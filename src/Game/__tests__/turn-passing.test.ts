import { describe, expect, it } from '@jest/globals'
import {
  BackgammonColor,
  BackgammonGameMoving,
  BackgammonMove,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types'
import { Game } from '..'
import { Board } from '../../Board'
import { Cube } from '../../Cube'
import { Player } from '../../Player'

describe('Game Turn Passing', () => {
  // Helper function to create a mock moving game with completed moves
  const createGameWithCompletedMoves = (
    activeColor: BackgammonColor = 'white'
  ): BackgammonGameMoving => {
    const isWhiteActive = activeColor === 'white'

    const players: BackgammonPlayers = [
      Player.initialize(
        'white',
        'clockwise',
        isWhiteActive ? 'moving' : 'inactive',
        false,
        'test-user-white'
      ),
      Player.initialize(
        'black',
        'counterclockwise',
        isWhiteActive ? 'inactive' : 'moving',
        false,
        'test-user-black'
      ),
    ]

    const board = Board.initialize()
    const cube = Cube.initialize()

    // Get the active player based on color
    const activePlayer = players.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerMoving
    const inactivePlayer = players.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive

    // Create mock completed moves
    const mockMove1: BackgammonMove = {
      id: 'move-1',
      stateKind: 'completed',
      player: activePlayer,
      dieValue: 2,
      moveKind: 'point-to-point',
      isHit: false,
      origin: board.points[23], // Position 24 clockwise
      destination: board.points[21], // Position 22 clockwise
      possibleMoves: [],
    }

    const mockMove2: BackgammonMove = {
      id: 'move-2',
      stateKind: 'completed',
      player: activePlayer,
      dieValue: 3,
      moveKind: 'point-to-point',
      isHit: false,
      origin: board.points[21], // Position 22 clockwise
      destination: board.points[18], // Position 19 clockwise
      possibleMoves: [],
    }

    // Create a mock moving game
    const movingGame: BackgammonGameMoving = {
      id: 'test-game-id',
      stateKind: 'moving',
      players,
      board,
      cube,
      version: '1',
      rules: {},
      activeColor,
      activePlayer,
      inactivePlayer,
      activePlay: {
        id: 'test-play-id',
        stateKind: 'moving',
        player: activePlayer,
        board,
        moves: new Set([mockMove1, mockMove2]),
      },
      createdAt: new Date(),
      gnuPositionId: 'test-position',
      startTime: new Date(),
      lastUpdate: new Date(),
      settings: {
        allowUndo: false,
        allowResign: true,
        autoPlay: false,
        showHints: false,
        showProbabilities: false,
      },
    }

    return movingGame
  }

  describe('Game.toMoved()', () => {
    it('should transition from moving to moved state when all moves are completed', () => {
      const movingGame = createGameWithCompletedMoves()

      const movedGame = Game.toMoved(movingGame)

      expect(movedGame.stateKind).toBe('moved')
      expect(movedGame.activeColor).toBe('white')
      expect(movedGame.activePlayer.color).toBe('white')
      expect(movedGame.inactivePlayer.color).toBe('black')
      expect(movedGame.activePlay).toBeDefined()
    })

    it('should throw error when transitioning from non-moving state', () => {
      const rollingGame = {
        ...createGameWithCompletedMoves(),
        stateKind: 'rolling' as const,
      }

      expect(() => {
        Game.toMoved(rollingGame as any)
      }).toThrow('Cannot transition to moved from rolling state')
    })

    it('should throw error when moves are not completed', () => {
      const movingGame = createGameWithCompletedMoves()

      // Modify one move to be incomplete
      const moves = Array.from(movingGame.activePlay!.moves)
      moves[0] = {
        ...moves[0],
        stateKind: 'ready',
        origin: movingGame.board.points[23],
      }

      const gameWithIncompleteMove = {
        ...movingGame,
        activePlay: {
          ...movingGame.activePlay!,
          moves: new Set(moves),
        },
      }

      expect(() => {
        Game.toMoved(gameWithIncompleteMove)
      }).toThrow(
        'Cannot transition to moved state - not all moves are completed'
      )
    })

    it('should throw error when no active play exists', () => {
      const gameWithoutActivePlay = {
        ...createGameWithCompletedMoves(),
        activePlay: undefined,
      }

      expect(() => {
        Game.toMoved(gameWithoutActivePlay as any)
      }).toThrow('No active play found')
    })
  })

  describe('Game.confirmTurn() from moved state', () => {
    it('should transition from moved to rolling state for next player', () => {
      const movingGame = createGameWithCompletedMoves()
      const movedGame = Game.toMoved(movingGame)

      const nextTurnGame = Game.confirmTurn(movedGame)

      expect(nextTurnGame.stateKind).toBe('rolling')
      expect(nextTurnGame.activeColor).toBe('black') // Should switch to black
      expect(nextTurnGame.activePlayer.color).toBe('black')
      expect(nextTurnGame.activePlayer.stateKind).toBe('rolling')
      expect(nextTurnGame.inactivePlayer.color).toBe('white')
      expect(nextTurnGame.inactivePlayer.stateKind).toBe('inactive')
      expect(nextTurnGame.activePlay).toBeUndefined() // Should clear activePlay for next player
    })

    it('should throw error when transitioning from non-moved state', () => {
      const movingGame = createGameWithCompletedMoves()

      expect(() => {
        Game.confirmTurn(movingGame as any)
      }).toThrow(
        "Cannot confirm turn from non-moving state"
      )
    })

    it('should handle color switching correctly for both white and black players', () => {
      // Test white to black transition
      const whiteMovingGame = createGameWithCompletedMoves('white')
      const whiteMovedGame = Game.toMoved(whiteMovingGame)
      const blackTurnGame = Game.confirmTurn(whiteMovedGame)

      expect(blackTurnGame.activeColor).toBe('black')
      expect(blackTurnGame.activePlayer.color).toBe('black')

      // Test black to white transition
      const blackMovingGame = createGameWithCompletedMoves('black')

      const blackMovedGame = Game.toMoved(blackMovingGame)
      const whiteTurnGame = Game.confirmTurn(blackMovedGame)

      expect(whiteTurnGame.activeColor).toBe('white')
      expect(whiteTurnGame.activePlayer.color).toBe('white')
    })
  })

  describe('Complete turn passing workflow', () => {
    it('should complete the full workflow: moving -> moved -> next player rolling', () => {
      // Start with a moving game with completed moves
      const movingGame = createGameWithCompletedMoves()
      expect(movingGame.stateKind).toBe('moving')
      expect(movingGame.activeColor).toBe('white')

      // Step 1: Transition to moved state (automatic after all moves completed)
      const movedGame = Game.toMoved(movingGame)
      expect(movedGame.stateKind).toBe('moved')
      expect(movedGame.activeColor).toBe('white') // Still white's turn until confirmed

      // Step 2: Confirm turn (player clicks dice)
      const nextPlayerGame = Game.confirmTurn(movedGame)
      expect(nextPlayerGame.stateKind).toBe('rolling')
      expect(nextPlayerGame.activeColor).toBe('black') // Now black's turn
      expect(nextPlayerGame.activePlayer.color).toBe('black')
      expect(nextPlayerGame.activePlayer.stateKind).toBe('rolling')
      expect(nextPlayerGame.inactivePlayer.color).toBe('white')
      expect(nextPlayerGame.inactivePlayer.stateKind).toBe('inactive')
      expect(nextPlayerGame.activePlay).toBeUndefined()

      // Verify dice states are correct
      expect(nextPlayerGame.activePlayer.dice.stateKind).toBe('rolling')
      expect(nextPlayerGame.inactivePlayer.dice.stateKind).toBe('inactive')
    })

    it('should maintain game state integrity throughout the transition', () => {
      const movingGame = createGameWithCompletedMoves()
      const originalBoard = movingGame.board
      const originalCube = movingGame.cube
      const originalGameId = movingGame.id

      // Transition through the states
      const movedGame = Game.toMoved(movingGame)
      const nextPlayerGame = Game.confirmTurn(movedGame)

      // Verify game integrity is maintained
      expect(nextPlayerGame.id).toBe(originalGameId)
      expect(nextPlayerGame.board).toEqual(originalBoard)
      expect(nextPlayerGame.cube).toEqual(originalCube)
      expect(nextPlayerGame.players).toHaveLength(2)

      // Verify player objects are properly updated
      const activePlayer = nextPlayerGame.activePlayer
      const inactivePlayer = nextPlayerGame.inactivePlayer

      expect(activePlayer).toBeDefined()
      expect(inactivePlayer).toBeDefined()
      expect(activePlayer.color).not.toBe(inactivePlayer.color)
      expect([activePlayer.color, inactivePlayer.color]).toEqual(
        expect.arrayContaining(['white', 'black'])
      )
    })
  })
})
