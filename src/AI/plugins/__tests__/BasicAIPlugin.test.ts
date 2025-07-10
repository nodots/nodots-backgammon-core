import { RobotSkillLevel } from '../../../Robot'
import { BasicAIPlugin } from '../BasicAIPlugin'

// Mock the dependencies to avoid complex type issues
jest.mock('../../../Game', () => ({
  Game: {
    getPossibleMoves: jest.fn(),
  },
}))

jest.mock('../../utils/PositionAnalyzer', () => ({
  PositionAnalyzer: {
    calculatePipCount: jest.fn(),
  },
}))

describe('BasicAIPlugin', () => {
  let plugin: BasicAIPlugin

  beforeEach(() => {
    plugin = new BasicAIPlugin()
  })

  describe('Plugin Identity', () => {
    test('has correct name and version', () => {
      expect(plugin.name).toBe('basic-ai')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.description).toContain(
        'Basic AI with heuristic-based move selection'
      )
    })

    test('getSupportedDifficulties returns all levels', () => {
      const difficulties = plugin.getSupportedDifficulties()
      expect(difficulties).toEqual(['beginner', 'intermediate', 'advanced'])
      expect(difficulties.length).toBe(3)
    })

    test('getCapabilities returns expected capabilities', () => {
      const capabilities = plugin.getCapabilities()
      expect(capabilities.supportsPositionEvaluation).toBe(false)
      expect(capabilities.supportsMoveExplanation).toBe(false)
      expect(capabilities.supportsOpeningBook).toBe(false)
      expect(capabilities.supportsThreatAnalysis).toBe(false)
      expect(capabilities.supportsMultiMoveSequencing).toBe(false)
      expect(capabilities.supportsGamePhaseRecognition).toBe(false)
    })
  })

  describe('generateMove', () => {
    const mockGameState = {
      activePlayer: {
        id: 'player1',
        color: 'white',
        direction: 'clockwise',
      },
      players: [
        { id: 'player1', color: 'white', direction: 'clockwise' },
        { id: 'player2', color: 'black', direction: 'counterclockwise' },
      ],
    } as any

    beforeEach(() => {
      const { Game } = require('../../../Game')
      Game.getPossibleMoves.mockReturnValue({
        success: true,
        possibleMoves: [
          {
            origin: {
              id: 'point1',
              position: { clockwise: 24, counterclockwise: 1 },
            },
            destination: {
              id: 'point2',
              position: { clockwise: 20, counterclockwise: 5 },
            },
          },
          {
            origin: {
              id: 'point3',
              position: { clockwise: 6, counterclockwise: 19 },
            },
            destination: { kind: 'bear-off' },
          },
        ],
      })
    })

    test('throws error when no possible moves available', async () => {
      const { Game } = require('../../../Game')
      Game.getPossibleMoves.mockReturnValue({
        success: false,
        possibleMoves: null,
      })

      await expect(
        plugin.generateMove(mockGameState, 'beginner')
      ).rejects.toThrow('No possible moves available')
    })

    test('returns first move for unknown difficulty', async () => {
      const move = await plugin.generateMove(
        mockGameState,
        'unknown' as RobotSkillLevel
      )
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })

    test('beginner difficulty returns a valid move', async () => {
      const move = await plugin.generateMove(mockGameState, 'beginner')
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })

    test('intermediate difficulty returns a valid move', async () => {
      const move = await plugin.generateMove(mockGameState, 'intermediate')
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })

    test('advanced difficulty returns a valid move', async () => {
      const move = await plugin.generateMove(mockGameState, 'advanced')
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })

    test('handles game state without active player', async () => {
      const noActivePlayerGame = { ...mockGameState, activePlayer: undefined }
      const move = await plugin.generateMove(noActivePlayerGame, 'intermediate')
      expect(move).toBeDefined()
    })
  })

  describe('shouldOfferDouble', () => {
    const mockGameState = {
      activePlayer: {
        id: 'player1',
        color: 'white',
        direction: 'clockwise',
      },
      players: [
        { id: 'player1', color: 'white', direction: 'clockwise' },
        { id: 'player2', color: 'black', direction: 'counterclockwise' },
      ],
    } as any

    test('returns false when no active player', async () => {
      const noActivePlayerGame = { ...mockGameState, activePlayer: undefined }
      const result = await plugin.shouldOfferDouble(
        noActivePlayerGame,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('returns false when no opponent found', async () => {
      const singlePlayerGame = {
        ...mockGameState,
        players: [mockGameState.players[0]],
      }
      const result = await plugin.shouldOfferDouble(
        singlePlayerGame,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('offers double when significantly ahead in pip count', async () => {
      const { PositionAnalyzer } = require('../../utils/PositionAnalyzer')
      PositionAnalyzer.calculatePipCount
        .mockReturnValueOnce(100) // Active player pip count
        .mockReturnValueOnce(140) // Opponent pip count (40 difference > 20 threshold)

      const result = await plugin.shouldOfferDouble(
        mockGameState,
        'intermediate'
      )
      expect(result).toBe(true)
    })

    test('does not offer double when not significantly ahead', async () => {
      const { PositionAnalyzer } = require('../../utils/PositionAnalyzer')
      PositionAnalyzer.calculatePipCount
        .mockReturnValueOnce(100) // Active player pip count
        .mockReturnValueOnce(110) // Opponent pip count (10 difference < 20 threshold)

      const result = await plugin.shouldOfferDouble(
        mockGameState,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('works with different difficulty levels', async () => {
      const difficulties: RobotSkillLevel[] = [
        'beginner',
        'intermediate',
        'advanced',
      ]

      for (const difficulty of difficulties) {
        const result = await plugin.shouldOfferDouble(mockGameState, difficulty)
        expect(typeof result).toBe('boolean')
      }
    })
  })

  describe('shouldAcceptDouble', () => {
    const mockGameState = {
      activePlayer: {
        id: 'player1',
        color: 'white',
        direction: 'clockwise',
      },
      players: [
        { id: 'player1', color: 'white', direction: 'clockwise' },
        { id: 'player2', color: 'black', direction: 'counterclockwise' },
      ],
    } as any

    test('returns false when no active player', async () => {
      const noActivePlayerGame = { ...mockGameState, activePlayer: undefined }
      const result = await plugin.shouldAcceptDouble(
        noActivePlayerGame,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('returns false when no opponent found', async () => {
      const singlePlayerGame = {
        ...mockGameState,
        players: [mockGameState.players[0]],
      }
      const result = await plugin.shouldAcceptDouble(
        singlePlayerGame,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('accepts double when not too far behind', async () => {
      const { PositionAnalyzer } = require('../../utils/PositionAnalyzer')
      PositionAnalyzer.calculatePipCount
        .mockReturnValueOnce(120) // Active player pip count
        .mockReturnValueOnce(100) // Opponent pip count (20 difference < 30 threshold)

      const result = await plugin.shouldAcceptDouble(
        mockGameState,
        'intermediate'
      )
      expect(result).toBe(true)
    })

    test('rejects double when too far behind', async () => {
      const { PositionAnalyzer } = require('../../utils/PositionAnalyzer')
      PositionAnalyzer.calculatePipCount
        .mockReturnValueOnce(140) // Active player pip count
        .mockReturnValueOnce(100) // Opponent pip count (40 difference > 30 threshold)

      const result = await plugin.shouldAcceptDouble(
        mockGameState,
        'intermediate'
      )
      expect(result).toBe(false)
    })

    test('works with different difficulty levels', async () => {
      const difficulties: RobotSkillLevel[] = [
        'beginner',
        'intermediate',
        'advanced',
      ]

      for (const difficulty of difficulties) {
        const result = await plugin.shouldAcceptDouble(
          mockGameState,
          difficulty
        )
        expect(typeof result).toBe('boolean')
      }
    })
  })

  describe('Move Selection Logic', () => {
    test('intermediate difficulty considers player direction', async () => {
      const counterclockwiseGame = {
        activePlayer: {
          id: 'player1',
          color: 'white',
          direction: 'counterclockwise',
        },
        players: [
          { id: 'player1', color: 'white', direction: 'counterclockwise' },
          { id: 'player2', color: 'black', direction: 'clockwise' },
        ],
      } as any

      const { Game } = require('../../../Game')
      Game.getPossibleMoves.mockReturnValue({
        success: true,
        possibleMoves: [
          {
            origin: {
              id: 'point1',
              position: { clockwise: 1, counterclockwise: 24 },
            },
            destination: {
              id: 'point2',
              position: { clockwise: 5, counterclockwise: 20 },
            },
          },
        ],
      })

      const move = await plugin.generateMove(
        counterclockwiseGame,
        'intermediate'
      )
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })

    test('advanced difficulty considers player direction', async () => {
      const counterclockwiseGame = {
        activePlayer: {
          id: 'player1',
          color: 'white',
          direction: 'counterclockwise',
        },
        players: [
          { id: 'player1', color: 'white', direction: 'counterclockwise' },
          { id: 'player2', color: 'black', direction: 'clockwise' },
        ],
      } as any

      const { Game } = require('../../../Game')
      Game.getPossibleMoves.mockReturnValue({
        success: true,
        possibleMoves: [
          {
            origin: {
              id: 'point1',
              position: { clockwise: 1, counterclockwise: 24 },
            },
            destination: {
              id: 'point2',
              position: { clockwise: 5, counterclockwise: 20 },
            },
          },
        ],
      })

      const move = await plugin.generateMove(counterclockwiseGame, 'advanced')
      expect(move).toBeDefined()
      expect(move.origin).toBeDefined()
      expect(move.destination).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handles getPossibleMoves returning success: false', async () => {
      const { Game } = require('../../../Game')
      Game.getPossibleMoves.mockReturnValue({
        success: false,
        possibleMoves: undefined,
      })

      const mockGameState = {
        activePlayer: { id: 'player1', color: 'white', direction: 'clockwise' },
        players: [{ id: 'player1', color: 'white', direction: 'clockwise' }],
      } as any

      await expect(
        plugin.generateMove(mockGameState, 'beginner')
      ).rejects.toThrow()
    })

    test('doubling decisions are consistent with same game state', async () => {
      const mockGameState = {
        activePlayer: { id: 'player1', color: 'white', direction: 'clockwise' },
        players: [
          { id: 'player1', color: 'white', direction: 'clockwise' },
          { id: 'player2', color: 'black', direction: 'counterclockwise' },
        ],
      } as any

      const { PositionAnalyzer } = require('../../utils/PositionAnalyzer')
      PositionAnalyzer.calculatePipCount.mockReturnValue(100)

      const results: Array<{ offer: boolean; accept: boolean }> = []
      for (let i = 0; i < 3; i++) {
        const offer = await plugin.shouldOfferDouble(
          mockGameState,
          'intermediate'
        )
        const accept = await plugin.shouldAcceptDouble(
          mockGameState,
          'intermediate'
        )
        results.push({ offer, accept })
      }

      // All results should be the same (deterministic for same game state)
      expect(results.every((r) => r.offer === results[0].offer)).toBe(true)
      expect(results.every((r) => r.accept === results[0].accept)).toBe(true)
    })
  })
})
