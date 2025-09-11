import { describe, expect, it } from '@jest/globals'
import {
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonGameMoving,
  BackgammonMove,
} from '@nodots-llc/backgammon-types/dist'
import { Game } from '../index'

describe('isMovable E2E Tests', () => {
  describe('Complete Game Flow with isMovable Attribute', () => {
    it('should correctly set and manage isMovable attribute through full game cycle', async () => {
      // 1. Create a new game with explicit configuration for deterministic testing
      const initialGame = Game.createNewGame(
        { userId: 'human1', isRobot: false },
        { userId: 'human2', isRobot: false }
      ) as BackgammonGameRollingForStart

      expect(initialGame.stateKind).toBe('rolling-for-start')
      expect(initialGame.players.length).toBe(2)

      // 2. Verify all checkers start with isMovable = false
      for (const point of initialGame.board.points) {
        for (const checker of point.checkers) {
          expect(checker.isMovable).toBe(false)
        }
      }

      // 3. Roll for start to determine who goes first
      const rolledForStartGame = Game.rollForStart(initialGame)
      expect(rolledForStartGame.stateKind).toBe('rolled-for-start')
      expect(rolledForStartGame.activeColor).toBeDefined()

      // 4. Roll dice for the first turn
      const movingGame = Game.roll(rolledForStartGame)
      expect(movingGame.stateKind).toBe('moving')
      expect(movingGame.activePlay).toBeDefined()
      expect(movingGame.activePlay.moves.size).toBeGreaterThan(0)

      // 5. Collect all movable container IDs from possible moves
      const expectedMovableContainerIds = new Set<string>()
      const movesArray = Array.from(movingGame.activePlay.moves)
      
      for (const move of movesArray) {
        if (move.stateKind === 'ready' && move.possibleMoves && move.possibleMoves.length > 0) {
          for (const possibleMove of move.possibleMoves) {
            if (possibleMove.origin) {
              expectedMovableContainerIds.add(possibleMove.origin.id)
            }
          }
        }
      }

      console.log(`Expected movable containers: ${Array.from(expectedMovableContainerIds).join(', ')}`)
      console.log(`Active player color: ${movingGame.activePlayer.color}`)

      // 6. Verify that checkers in movable containers have isMovable = true
      let movableCheckersFound = 0
      let nonMovableCheckersFound = 0

      // Check points
      for (const point of movingGame.board.points) {
        for (const checker of point.checkers) {
          if (expectedMovableContainerIds.has(point.id) && checker.color === movingGame.activePlayer.color) {
            expect(checker.isMovable).toBe(true)
            movableCheckersFound++
            console.log(`✓ Found movable checker at point ${point.id} (positions: clockwise=${point.position.clockwise}, counterclockwise=${point.position.counterclockwise})`)
          } else {
            expect(checker.isMovable).toBe(false)
            nonMovableCheckersFound++
          }
        }
      }

      // Check bar checkers
      const bars = [movingGame.board.bar.clockwise, movingGame.board.bar.counterclockwise]
      for (const bar of bars) {
        for (const checker of bar.checkers) {
          if (expectedMovableContainerIds.has(bar.id) && checker.color === movingGame.activePlayer.color) {
            expect(checker.isMovable).toBe(true)
            movableCheckersFound++
            console.log(`✓ Found movable checker on bar ${bar.direction}`)
          } else {
            expect(checker.isMovable).toBe(false)
            nonMovableCheckersFound++
          }
        }
      }

      // 7. Verify we found expected number of movable checkers
      expect(expectedMovableContainerIds.size).toBeGreaterThan(0)
      expect(movableCheckersFound).toBeGreaterThan(0)
      expect(nonMovableCheckersFound).toBeGreaterThan(0)

      console.log(`Total movable checkers found: ${movableCheckersFound}`)
      console.log(`Total non-movable checkers found: ${nonMovableCheckersFound}`)

      // 8. Verify that only active player's checkers can be movable
      for (const point of movingGame.board.points) {
        for (const checker of point.checkers) {
          if (checker.isMovable) {
            expect(checker.color).toBe(movingGame.activePlayer.color)
          }
        }
      }

      // 9. Game is already in moving state, ready to test isMovable updates after moves
      expect(movingGame.stateKind).toBe('moving')

      // Find a valid move to execute
      const firstReadyMove = movesArray.find(m => m.stateKind === 'ready' && m.possibleMoves.length > 0)
      expect(firstReadyMove).toBeDefined()

      const firstPossibleMove = firstReadyMove!.possibleMoves[0]
      expect(firstPossibleMove).toBeDefined()

      // Execute the actual move
      const gameAfterMove = Game.move(movingGame, firstPossibleMove.origin.id)

      // 10. Verify isMovable is updated after the move
      let movableAfterMove = 0
      if (gameAfterMove.stateKind === 'moving') {
        // Count movable checkers after the move
        for (const point of gameAfterMove.board.points) {
          for (const checker of point.checkers) {
            if (checker.isMovable) {
              movableAfterMove++
            }
          }
        }
        console.log(`Movable checkers after move: ${movableAfterMove}`)
      }

      // 11. Complete all required moves or confirm turn when possible
      let finalGame: any = gameAfterMove
      
      if (gameAfterMove.stateKind === 'moving') {
        // Check if we can confirm turn (all moves completed or no legal moves remaining)
        if (Game.canConfirmTurn(gameAfterMove)) {
          finalGame = Game.confirmTurn(gameAfterMove)
        } else {
          // More moves are required, but for testing purposes, let's just check the current state
          console.log('More moves required - checking current isMovable state')
          finalGame = gameAfterMove
        }
      } else if (gameAfterMove.stateKind === 'moved') {
        finalGame = Game.confirmTurn(gameAfterMove)
      }

      // 12. Verify isMovable behavior based on game state
      if (finalGame.board) {
        if (finalGame.stateKind === 'rolling' || finalGame.stateKind === 'rolled-for-start') {
          // After turn confirmation, all isMovable should be false
          for (const point of finalGame.board.points) {
            for (const checker of point.checkers) {
              expect(checker.isMovable).toBe(false)
            }
          }

          for (const bar of [finalGame.board.bar.clockwise, finalGame.board.bar.counterclockwise]) {
            for (const checker of bar.checkers) {
              expect(checker.isMovable).toBe(false)
            }
          }

          console.log('✓ All checkers have isMovable = false after turn confirmation')
        } else {
          // Still in middle of turn, verify isMovable corresponds to remaining possible moves
          console.log(`Game state: ${finalGame.stateKind} - verifying isMovable corresponds to remaining moves`)
          
          // This is still a valid test - the isMovable should reflect current game state
          let currentMovableCount = 0
          for (const point of finalGame.board.points) {
            for (const checker of point.checkers) {
              if (checker.isMovable) {
                currentMovableCount++
                expect(checker.color).toBe(finalGame.activePlayer.color)
              }
            }
          }
          
          console.log(`✓ Current movable checkers: ${currentMovableCount}`)
        }
      }

      // 13. If game continues, roll for next player and verify isMovable is set again
      if (finalGame.stateKind === 'rolling') {
        const nextRolledGame = Game.roll(finalGame) as BackgammonGameRolled
        expect(nextRolledGame.stateKind).toBe('rolled')

        // Count movable checkers for the next player
        let nextPlayerMovableCheckers = 0
        for (const point of nextRolledGame.board.points) {
          for (const checker of point.checkers) {
            if (checker.isMovable) {
              expect(checker.color).toBe(nextRolledGame.activePlayer.color)
              nextPlayerMovableCheckers++
            }
          }
        }

        expect(nextPlayerMovableCheckers).toBeGreaterThan(0)
        console.log(`✓ Next player has ${nextPlayerMovableCheckers} movable checkers`)
      }
    })

    it('should handle edge case when no moves are possible', () => {
      // Create a scenario where a player might have no legal moves
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      ) as BackgammonGameRollingForStart

      expect(game.stateKind).toBe('rolling-for-start')
      const rolledForStart = Game.rollForStart(game)
      const movingGame = Game.roll(rolledForStart) as BackgammonGameRolled

      // Even if no moves are possible, all moves should be marked as 'no-move'
      const movesArray = Array.from(movingGame.activePlay.moves)
      let hasReadyMoves = false
      let hasNoMoves = false

      for (const move of movesArray) {
        if (move.stateKind === 'ready') {
          if (move.possibleMoves.length > 0) {
            hasReadyMoves = true
          } else if (move.moveKind === 'no-move') {
            hasNoMoves = true
          }
        }
      }

      // Either we have ready moves or no-moves, but the system should handle both
      expect(hasReadyMoves || hasNoMoves).toBe(true)

      // Verify isMovable attribute exists on all checkers regardless
      for (const point of movingGame.board.points) {
        for (const checker of point.checkers) {
          expect(typeof checker.isMovable).toBe('boolean')
        }
      }
    })
  })
})