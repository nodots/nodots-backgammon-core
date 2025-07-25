import { beforeEach, describe, expect, it, jest } from '@jest/globals'
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
      // Robot should automatically complete its turn after winning roll-for-start
      expect(result.game?.stateKind).toBe('rolling')
      expect(result.message).toContain('Robot rolled for start')
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
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )
      const humanPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human1',
        'inactive',
        false
      )

      const game = {
        stateKind: 'rolling',
        activePlayer: null, // This is what we're testing
        players: [robotPlayer, humanPlayer], // Valid players array
        board: Board.initialize(), // Valid board
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
        'Robot completed turn (no legal moves available)'
      )

      // Restore original method
      ;(Game as any).getPossibleMoves = originalGetPossibleMoves
    })

    it('should handle games with null or undefined board', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )
      const humanPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human1',
        'inactive',
        false
      )

      const game = {
        stateKind: 'rolling',
        activePlayer: robotPlayer,
        players: [robotPlayer, humanPlayer],
        board: null, // This is what we're testing
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Game board is undefined')
    })

    it('should handle games with invalid players array', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )

      const game = {
        stateKind: 'rolling',
        activePlayer: robotPlayer,
        players: [robotPlayer], // Only 1 player, should be 2
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Game players are invalid')
    })

    it('should handle games with no players at all', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'rolling',
        true
      )

      const game = {
        stateKind: 'rolling',
        activePlayer: robotPlayer,
        players: [], // Empty players array
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Game players are invalid')
    })

    it('should handle rolling-for-start with no robot players', async () => {
      const humanPlayer1 = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'human1',
        'inactive',
        false
      )
      const humanPlayer2 = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human2',
        'inactive',
        false
      )

      const game = Game.initialize([
        humanPlayer1,
        humanPlayer2,
      ]) as BackgammonGameRollingForStart

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No robot players in game')
    })

    it('should handle error in rollForStart', async () => {
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

      // Mock Game.rollForStart to throw an error
      const originalRollForStart = (Game as any).rollForStart
      ;(Game as any).rollForStart = jest.fn().mockImplementation(() => {
        throw new Error('Test error in rollForStart')
      })

      const game = Game.initialize([
        robotPlayer1,
        robotPlayer2,
      ]) as BackgammonGameRollingForStart

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error in rollForStart')

      // Restore original method
      ;(Game as any).rollForStart = originalRollForStart
    })

    it('should handle error in roll', async () => {
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

      // Mock Game.roll to throw an error
      const originalRoll = (Game as any).roll
      ;(Game as any).roll = jest.fn().mockImplementation(() => {
        throw new Error('Test error in roll')
      })

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

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error in roll')

      // Restore original method
      ;(Game as any).roll = originalRoll
    })

    it('should handle moving state without active player', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const humanPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human1',
        'inactive',
        false
      )

      const game = {
        stateKind: 'moving',
        activePlayer: null, // No active player
        players: [robotPlayer, humanPlayer],
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Active player is not a robot')
    })

    it('should handle moving state with no dice roll', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const humanPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human1',
        'inactive',
        false
      )

      // Robot player without dice roll
      const robotPlayerWithoutDice = {
        ...robotPlayer,
        dice: null,
      }

      const game = {
        stateKind: 'moving',
        activePlayer: robotPlayerWithoutDice,
        players: [robotPlayerWithoutDice, humanPlayer],
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No dice roll available for AI move')
    })

    it('should handle moving state with dice but no current roll', async () => {
      const robotPlayer = Player.initialize(
        'white',
        'clockwise',
        undefined,
        'robot1',
        'moving',
        true
      )
      const humanPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        'human1',
        'inactive',
        false
      )

      // Robot player with dice but no current roll
      const robotPlayerWithEmptyDice = {
        ...robotPlayer,
        dice: { currentRoll: null },
      }

      const game = {
        stateKind: 'moving',
        activePlayer: robotPlayerWithEmptyDice,
        players: [robotPlayerWithEmptyDice, humanPlayer],
        board: Board.initialize(),
      } as unknown as BackgammonGame

      const result = await Robot.makeOptimalMove(game)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No dice roll available for AI move')
    })
  })

  describe('AI plugin management', () => {
    it('should register AI plugins', () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        generateMove: jest.fn() as any,
        shouldOfferDouble: jest.fn() as any,
        shouldAcceptDouble: jest.fn() as any,
        getSupportedDifficulties: jest.fn() as any,
        getCapabilities: jest.fn() as any,
      }

      expect(() => Robot.registerAIPlugin(mockPlugin as any)).not.toThrow()
    })

    it('should set default AI plugin', () => {
      expect(() => Robot.setDefaultAI('basic-ai')).not.toThrow()
    })

    it('should list AI plugins', () => {
      const plugins = Robot.listAIPlugins()
      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBeGreaterThan(0)
    })

    it('should get default AI plugin', () => {
      const defaultAI = Robot.getDefaultAI()
      expect(typeof defaultAI).toBe('string')
      expect(defaultAI).toBe('basic-ai')
    })
  })

  describe('private method coverage', () => {
    it('should test selectMoveByDifficulty with unknown difficulty', () => {
      const mockGame = {
        activePlayer: { color: 'white', direction: 'clockwise' },
      } as BackgammonGame

      const possibleMoves = [
        {
          origin: { position: { clockwise: 24 } },
          destination: { kind: 'point' },
        },
        {
          origin: { position: { clockwise: 13 } },
          destination: { kind: 'point' },
        },
      ]

      const selectedMove = (Robot as any).selectMoveByDifficulty(
        possibleMoves,
        'unknown' as any,
        mockGame
      )

      expect(selectedMove).toBe(possibleMoves[0])
    })

    it('should test findCheckerForMove with bar origin', () => {
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
        id: 'bar-checker',
        color: 'white' as const,
        checkercontainerId: 'bar-clockwise',
      }
      board.bar.clockwise.checkers.push(whiteChecker as any)

      const mockGame = {
        activePlayer: robotPlayer,
        board,
      } as unknown as BackgammonGame

      const selectedMove = {
        origin: { kind: 'bar', id: 'bar-clockwise' },
        destination: { kind: 'point' },
      }

      const result = (Robot as any).findCheckerForMove(mockGame, selectedMove)

      expect(result).toBeDefined()
      expect(result.checkerId).toBe('bar-checker')
    })

    it('should test findCheckerForMove with invalid origin', () => {
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

      const selectedMove = {
        origin: { id: 'invalid-id' },
        destination: { kind: 'point' },
      }

      const result = (Robot as any).findCheckerForMove(mockGame, selectedMove)

      expect(result).toBeNull()
    })

    it('should test advanced move selection with complex scoring', () => {
      const mockGame = {
        activePlayer: { color: 'white', direction: 'clockwise' },
      } as BackgammonGame

      const complexMoves = [
        {
          origin: {
            position: { clockwise: 24 },
            checkers: [{ color: 'white' }],
          },
          destination: {
            position: { clockwise: 20 },
            checkers: [{ color: 'black' }],
          },
        },
        {
          origin: {
            position: { clockwise: 13 },
            checkers: [{ color: 'white' }],
          },
          destination: { position: { clockwise: 10 }, checkers: [] },
        },
        {
          origin: {
            position: { clockwise: 6 },
            checkers: [{ color: 'white' }],
          },
          destination: { kind: 'bear-off' },
        },
      ]

      const selectedMove = (Robot as any).selectAdvancedMove(
        complexMoves,
        mockGame
      )

      expect(selectedMove).toBeDefined()
      expect(selectedMove.destination.kind).toBe('bear-off')
    })
  })

  describe('Complete Robot Turn Automation', () => {
    it('should automatically advance robot after winning roll-for-start', async () => {
      // Create a robot vs human game - robot should win roll-for-start and be ready to move
      const robotVsHumanGame = Game.createNewGame(
        'robot-user',
        'human-user',
        true, // auto-roll for start
        true, // player 1 is robot
        false // player 2 is human
      )

      // Robot should have automatically advanced after winning roll-for-start (either rolled or moving state)
      expect(['rolled', 'moving']).toContain(robotVsHumanGame.stateKind)

      // The active player should be the robot (ready to make moves)
      expect(robotVsHumanGame.activePlayer?.isRobot).toBe(true)
      expect(['rolled', 'moving']).toContain(
        robotVsHumanGame.activePlayer?.stateKind
      )

      // The human should be inactive
      expect(robotVsHumanGame.inactivePlayer?.isRobot).toBe(false)
      expect(robotVsHumanGame.inactivePlayer?.stateKind).toBe('inactive')

      // Verify that checkers have actually moved (robot made some moves)
      const totalCheckersOnBoard = robotVsHumanGame.board.points.reduce(
        (total, point) => total + point.checkers.length,
        0
      )

      // In a standard game, we start with 30 checkers on the board
      // After robot moves, there should still be 30 checkers total (just repositioned)
      expect(totalCheckersOnBoard).toBe(30)

      // Verify the game flow makes sense
      expect(robotVsHumanGame.players).toHaveLength(2)
      expect(robotVsHumanGame.activeColor).toBeDefined()
      expect(robotVsHumanGame.board).toBeDefined()

      // Now test that Robot.makeOptimalMove can complete the robot's turn
      const robotMoveResult = await Robot.makeOptimalMove(robotVsHumanGame)
      expect(robotMoveResult.success).toBe(true)

      // After robot makes moves, the game should eventually transition to human's turn
      if (robotMoveResult.game?.stateKind === 'rolling') {
        expect(robotMoveResult.game.activePlayer?.isRobot).toBe(false)
        expect(robotMoveResult.game.activePlayer?.stateKind).toBe('rolling')
      }
    })

    it('should handle robot vs robot game with multiple automatic turns', async () => {
      // Create a robot vs robot game
      const robotVsRobotGame = Game.createNewGame(
        'robot1-user',
        'robot2-user',
        true, // auto-roll for start
        true, // player 1 is robot
        true // player 2 is robot
      )

      // The game should be in 'rolled' or 'moving' state with a robot ready to make moves
      expect(['rolled', 'moving']).toContain(robotVsRobotGame.stateKind)
      expect(robotVsRobotGame.activePlayer?.isRobot).toBe(true)
      expect(['rolled', 'moving']).toContain(
        robotVsRobotGame.activePlayer?.stateKind
      )

      // Use Robot.makeOptimalMove to advance the second robot's turn
      const secondRobotResult = await Robot.makeOptimalMove(robotVsRobotGame)

      expect(secondRobotResult.success).toBe(true)
      expect(['rolled', 'rolling', 'moving']).toContain(
        secondRobotResult.game?.stateKind
      )

      // Should now be back to the first robot's turn
      expect(secondRobotResult.game?.activePlayer?.isRobot).toBe(true)
    })

    it('should preserve game state consistency through robot automation', async () => {
      const game = Game.createNewGame(
        'robot-user',
        'human-user',
        true,
        true,
        false
      )

      // Verify all game state is consistent
      expect(game.players).toHaveLength(2)
      expect(game.players.some((p) => p.isRobot)).toBe(true)
      expect(game.players.some((p) => !p.isRobot)).toBe(true)

      // Verify activeColor matches activePlayer
      expect(game.activePlayer?.color).toBe(game.activeColor)

      // Verify player states are complementary
      const activePlayerState = game.activePlayer?.stateKind
      const inactivePlayerState = game.inactivePlayer?.stateKind
      expect(activePlayerState).toBe('rolled')
      expect(inactivePlayerState).toBe('inactive')

      // Verify board state is valid
      expect(game.board.points).toHaveLength(24)
      expect(game.board.bar).toBeDefined()
      expect(game.board.off).toBeDefined()
    })
  })
})
