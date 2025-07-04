import { describe, expect, it, jest } from '@jest/globals'
import {
  BackgammonGame,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '../../index'
import { Robot, RobotSkillLevel } from '../index'

describe('Robot', () => {
  describe('makeOptimalMove', () => {
    it('should return error when active player is not a robot', async () => {
      const humanPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'player1',
        'rolling',
        false
      ) // isRobot = false
      const robotPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      )

      const game = Game.initialize(
        [humanPlayer, robotPlayer],
        'game1',
        'rolling',
        undefined,
        undefined,
        undefined,
        'white',
        humanPlayer as any,
        robotPlayer as any
      ) as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Active player is not a robot')
    })

    it('should handle rolling-for-start state', async () => {
      const robotPlayer1 = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'inactive',
        true
      )
      const robotPlayer2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'robot2',
        'inactive',
        true
      )

      const game = Game.initialize([
        robotPlayer1,
        robotPlayer2,
      ]) as BackgammonGameRollingForStart

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(true)
      expect(result.game?.stateKind).toBe('rolled-for-start')
      expect(result.message).toBe('Robot rolled for start')
    })

    it('should handle rolled-for-start state by rolling dice', async () => {
      const robotPlayer1 = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolled-for-start',
        true
      )
      const robotPlayer2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'robot2',
        'inactive',
        true
      )

      const game = Game.initialize(
        [robotPlayer1, robotPlayer2],
        'game1',
        'rolled-for-start',
        undefined,
        undefined,
        undefined,
        'white',
        robotPlayer1 as any,
        robotPlayer2 as any
      ) as BackgammonGameRolledForStart

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(true)
      expect(result.game?.stateKind).toBe('rolled')
      expect(result.message).toContain('Robot rolled:')
    })

    it('should handle rolling state by rolling dice', async () => {
      const robotPlayer1 = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )
      const robotPlayer2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'robot2',
        'inactive',
        true
      )

      const game = Game.initialize(
        [robotPlayer1, robotPlayer2],
        'game1',
        'rolling',
        undefined,
        undefined,
        undefined,
        'white',
        robotPlayer1 as any,
        robotPlayer2 as any
      ) as BackgammonGameRolling

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(true)
      expect(result.game?.stateKind).toBe('rolled')
      expect(result.message).toContain('Robot rolled:')
    })

    it('should return error for unsupported game states', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'inactive',
        true
      )
      const player2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      )

      const game = {
        stateKind: 'completed',
        activePlayer: robotPlayer,
        players: [robotPlayer, player2],
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Robot cannot act in game state: completed')
    })

    it('should handle errors gracefully', async () => {
      const invalidGame = null as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(invalidGame)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('difficulty levels', () => {
    it('should use beginner difficulty by default', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )
      const player2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      )

      const game = Game.initialize(
        [robotPlayer, player2],
        'game1',
        'rolling',
        undefined,
        undefined,
        undefined,
        'white',
        robotPlayer as any,
        player2 as any
      ) as BackgammonGame

      const result = await Robot.makeOptimalMove(game) // No difficulty specified

      expect(result.success).toBe(true)
      // Beginner difficulty should work (default behavior)
    })

    it('should accept different difficulty levels', async () => {
      const robotPlayer: BackgammonPlayerRolling = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      ) as BackgammonPlayerRolling
      const player2: BackgammonPlayerInactive = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      ) as BackgammonPlayerInactive

      const game = Game.initialize(
        [robotPlayer, player2],
        'game1',
        'rolling',
        undefined,
        undefined,
        undefined,
        'white',
        robotPlayer,
        player2
      ) as BackgammonGame

      const difficulties: RobotSkillLevel[] = [
        'beginner',
        'intermediate',
        'advanced',
      ]

      for (const difficulty of difficulties) {
        const result = await Robot.makeOptimalMove(game, difficulty)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('move selection strategies', () => {
    let mockGame: BackgammonGame
    let possibleMoves: any[]

    beforeEach(() => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const player2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      )

      mockGame = {
        activePlayer: robotPlayer,
        players: [robotPlayer, player2],
        board: Board.initialize(),
      } as unknown as BackgammonGame

      possibleMoves = [
        {
          origin: {
            position: { clockwise: 24 },
            checkers: [{ color: 'white' }],
          },
          destination: { position: { clockwise: 20 }, kind: 'point' },
        },
        {
          origin: {
            position: { clockwise: 13 },
            checkers: [{ color: 'white' }, { color: 'white' }],
          },
          destination: { position: { clockwise: 10 }, kind: 'point' },
        },
        {
          origin: {
            position: { clockwise: 6 },
            checkers: [{ color: 'white' }],
          },
          destination: { kind: 'bear-off' },
        },
      ]
    })

    it('should select first move for beginner difficulty', () => {
      const selectedMove = (Robot as any).selectMoveByDifficulty(
        possibleMoves,
        'beginner',
        mockGame
      )
      expect(selectedMove).toBe(possibleMoves[0])
    })

    it('should prefer bear-off moves for intermediate difficulty', () => {
      const selectedMove = (Robot as any).selectMoveByDifficulty(
        possibleMoves,
        'intermediate',
        mockGame
      )

      // Should prefer the bear-off move (has bonus points)
      expect(selectedMove.destination.kind).toBe('bear-off')
    })

    it('should use advanced heuristics for advanced difficulty', () => {
      const selectedMove = (Robot as any).selectMoveByDifficulty(
        possibleMoves,
        'advanced',
        mockGame
      )

      // Advanced strategy should also prefer bear-off moves (highest bonus)
      expect(selectedMove.destination.kind).toBe('bear-off')
    })

    it('should penalize leaving blots in intermediate strategy', () => {
      const movesWithBlots = [
        {
          origin: {
            position: { clockwise: 24 },
            checkers: [{ color: 'white' }],
          }, // Single checker (blot)
          destination: { position: { clockwise: 20 }, kind: 'point' },
        },
        {
          origin: {
            position: { clockwise: 13 },
            checkers: [{ color: 'white' }, { color: 'white' }],
          }, // Safe (2 checkers)
          destination: { position: { clockwise: 10 }, kind: 'point' },
        },
      ]

      const selectedMove = (Robot as any).selectIntermediateMove(
        movesWithBlots,
        mockGame
      )

      // Should prefer the safe move (2 checkers) over the blot move
      expect(selectedMove.origin.position.clockwise).toBe(13)
    })

    it('should reward hitting opponent blots in advanced strategy', () => {
      const movesWithHitting = [
        {
          origin: {
            position: { clockwise: 24 },
            checkers: [{ color: 'white' }],
          },
          destination: {
            position: { clockwise: 20 },
            checkers: [{ color: 'black' }],
          }, // Hit opponent
        },
        {
          origin: {
            position: { clockwise: 13 },
            checkers: [{ color: 'white' }],
          },
          destination: { position: { clockwise: 10 }, checkers: [] }, // Safe move
        },
      ]

      const selectedMove = (Robot as any).selectAdvancedMove(
        movesWithHitting,
        mockGame
      )

      // Should prefer hitting the opponent (gets bonus points)
      expect(selectedMove.destination.position.clockwise).toBe(20)
    })
  })

  describe('findOptimalChecker', () => {
    it('should find a checker from a point', () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const board = Board.initialize()

      const mockGame = {
        activePlayer: robotPlayer,
        board,
      } as unknown as BackgammonGame

      // Find a point with white checkers
      const pointWithWhiteCheckers = board.points.find((point) =>
        point.checkers.some((checker) => checker.color === 'white')
      )

      expect(pointWithWhiteCheckers).toBeDefined()

      const moveToMake = {
        origin: pointWithWhiteCheckers,
        destination: { kind: 'point' },
      }

      const result = (Robot as any).findOptimalChecker(mockGame, moveToMake)

      expect(result).toBeDefined()
      expect(result.checkerId).toBeDefined()
    })

    it('should find a checker from the bar', () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const board = Board.initialize()

      // Add a white checker to the bar
      const whiteChecker = {
        id: 'checker-bar',
        color: 'white' as const,
        checkercontainerId: 'bar-clockwise',
      }
      board.bar.clockwise.checkers.push(whiteChecker as any)

      const mockGame = {
        activePlayer: robotPlayer,
        board,
      } as unknown as BackgammonGame

      const moveToMake = {
        origin: { kind: 'bar', id: 'bar-clockwise' },
        destination: { kind: 'point' },
      }

      const result = (Robot as any).findOptimalChecker(mockGame, moveToMake)

      expect(result).toBeDefined()
      expect(result.checkerId).toBe('checker-bar')
    })

    it('should return null when no suitable checker found', () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const board = Board.initialize()

      const mockGame = {
        activePlayer: robotPlayer,
        board,
      } as unknown as BackgammonGame

      const moveToMake = {
        origin: { id: 'non-existent-point' },
        destination: { kind: 'point' },
      }

      const result = (Robot as any).findOptimalChecker(mockGame, moveToMake)

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', () => {
      const invalidGame = { activePlayer: null } as unknown as BackgammonGame
      const moveToMake = { origin: {}, destination: {} }

      const result = (Robot as any).findOptimalChecker(invalidGame, moveToMake)

      expect(result).toBeNull()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle games with no active player', async () => {
      const game = {
        stateKind: 'rolling',
        activePlayer: null,
        players: [],
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Active player is not a robot')
    })

    it('should handle games with no possible moves', async () => {
      // Mock Game.getPossibleMoves to return no moves
      const originalGetPossibleMoves = (Game as any).getPossibleMoves
      ;(Game as any).getPossibleMoves = jest.fn().mockReturnValue({
        success: true,
        possibleMoves: [],
      })

      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      ) as BackgammonPlayerRolling
      const player2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'player2',
        'inactive',
        true
      ) as BackgammonPlayerInactive

      // Use proper state flow: rolling-for-start -> rolled-for-start -> rolling -> rolled
      const initialGame = Game.initialize(
        [robotPlayer, player2],
        'game1',
        'rolling-for-start'
      ) as any
      const rolledForStartGame = Game.rollForStart(initialGame)
      const game = Game.roll(rolledForStartGame)

      const result = await Robot.makeOptimalMove(game)

      // Robot should successfully pass the turn when no moves are available
      expect(result.success).toBe(true)
      expect(result.message).toContain(
        'Robot attempted to pass turn (no legal moves available)'
      )

      // Restore original method
      ;(Game as any).getPossibleMoves = originalGetPossibleMoves
    })
  })
})
