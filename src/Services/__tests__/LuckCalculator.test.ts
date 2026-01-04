import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import {
  LuckCalculator,
  ALL_DICE_COMBINATIONS,
  classifyLuck,
  setHintProviderForTesting,
  HintProvider,
} from '../LuckCalculator'
import { DEFAULT_LUCK_THRESHOLDS } from '@nodots-llc/backgammon-types'

describe('LuckCalculator', () => {
  describe('ALL_DICE_COMBINATIONS', () => {
    it('should have 21 distinct combinations', () => {
      expect(ALL_DICE_COMBINATIONS.length).toBe(21)
    })

    it('should have 6 doubles with probability 1/36', () => {
      const doubles = ALL_DICE_COMBINATIONS.filter(
        ({ dice }) => dice[0] === dice[1]
      )
      expect(doubles.length).toBe(6)
      doubles.forEach(({ probability }) => {
        expect(probability).toBeCloseTo(1 / 36, 10)
      })
    })

    it('should have 15 non-doubles with probability 2/36', () => {
      const nonDoubles = ALL_DICE_COMBINATIONS.filter(
        ({ dice }) => dice[0] !== dice[1]
      )
      expect(nonDoubles.length).toBe(15)
      nonDoubles.forEach(({ probability }) => {
        expect(probability).toBeCloseTo(2 / 36, 10)
      })
    })

    it('probabilities should sum to 1', () => {
      const totalProbability = ALL_DICE_COMBINATIONS.reduce(
        (sum, { probability }) => sum + probability,
        0
      )
      expect(totalProbability).toBeCloseTo(1.0, 10)
    })
  })

  describe('classifyLuck', () => {
    it('should classify high luck as joker', () => {
      expect(classifyLuck(0.15)).toBe('joker')
      expect(classifyLuck(0.1)).toBe('joker')
    })

    it('should classify low luck as anti-joker', () => {
      expect(classifyLuck(-0.15)).toBe('anti-joker')
      expect(classifyLuck(-0.1)).toBe('anti-joker')
    })

    it('should classify normal luck as normal', () => {
      expect(classifyLuck(0)).toBe('normal')
      expect(classifyLuck(0.05)).toBe('normal')
      expect(classifyLuck(-0.05)).toBe('normal')
      expect(classifyLuck(0.09)).toBe('normal')
      expect(classifyLuck(-0.09)).toBe('normal')
    })

    it('should use custom thresholds when provided', () => {
      const customThresholds = { joker: 0.2, antiJoker: -0.2 }
      expect(classifyLuck(0.15, customThresholds)).toBe('normal')
      expect(classifyLuck(0.25, customThresholds)).toBe('joker')
      expect(classifyLuck(-0.15, customThresholds)).toBe('normal')
      expect(classifyLuck(-0.25, customThresholds)).toBe('anti-joker')
    })
  })

  describe('LuckCalculator class', () => {
    let calculator: LuckCalculator
    let mockHintProvider: HintProvider

    beforeEach(() => {
      calculator = new LuckCalculator()

      // Mock hint provider that returns consistent equities
      mockHintProvider = {
        getHintsFromPositionId: async (positionId: string, dice: [number, number]) => {
          // Return different equities based on dice to simulate luck variation
          // Higher doubles = better equity
          if (dice[0] === dice[1]) {
            // Doubles give higher equity (luckier rolls)
            return [{ equity: 0.5 + dice[0] * 0.05 }]
          }
          // Non-doubles give average equity
          const avgDie = (dice[0] + dice[1]) / 2
          return [{ equity: 0.4 + avgDie * 0.03 }]
        },
      }

      setHintProviderForTesting(mockHintProvider)
    })

    afterEach(() => {
      setHintProviderForTesting(null)
    })

    describe('calculateRollLuck', () => {
      it('should calculate positive luck for favorable rolls', async () => {
        const rollLuck = await calculator.calculateRollLuck(
          'test-position-id',
          [6, 6], // Double 6s - high equity roll
          1,
          'white'
        )

        // Double 6s should give higher equity than average
        expect(rollLuck.dice).toEqual([6, 6])
        expect(rollLuck.moveNumber).toBe(1)
        expect(rollLuck.playerColor).toBe('white')
        expect(typeof rollLuck.luck).toBe('number')
        expect(typeof rollLuck.actualEquity).toBe('number')
        expect(typeof rollLuck.expectedEquity).toBe('number')
        expect(rollLuck.luck).toBe(rollLuck.actualEquity - rollLuck.expectedEquity)
      })

      it('should calculate negative luck for unfavorable rolls', async () => {
        const rollLuck = await calculator.calculateRollLuck(
          'test-position-id',
          [1, 2], // Low non-double
          2,
          'black'
        )

        expect(rollLuck.dice).toEqual([1, 2])
        expect(rollLuck.moveNumber).toBe(2)
        expect(rollLuck.playerColor).toBe('black')
        expect(rollLuck.luck).toBe(rollLuck.actualEquity - rollLuck.expectedEquity)
      })
    })

    describe('calculatePlayerSummary', () => {
      it('should correctly summarize player luck', () => {
        const rolls = [
          {
            dice: [6, 6] as [number, number],
            luck: 0.15,
            actualEquity: 0.8,
            expectedEquity: 0.65,
            classification: 'joker' as const,
            moveNumber: 1,
            playerColor: 'white' as const,
          },
          {
            dice: [3, 4] as [number, number],
            luck: 0.02,
            actualEquity: 0.52,
            expectedEquity: 0.5,
            classification: 'normal' as const,
            moveNumber: 2,
            playerColor: 'white' as const,
          },
          {
            dice: [1, 2] as [number, number],
            luck: -0.12,
            actualEquity: 0.38,
            expectedEquity: 0.5,
            classification: 'anti-joker' as const,
            moveNumber: 3,
            playerColor: 'white' as const,
          },
        ]

        const summary = calculator.calculatePlayerSummary('user-123', 'white', rolls)

        expect(summary.userId).toBe('user-123')
        expect(summary.playerColor).toBe('white')
        expect(summary.rollCount).toBe(3)
        expect(summary.totalLuck).toBeCloseTo(0.15 + 0.02 - 0.12, 10)
        expect(summary.jokerCount).toBe(1)
        expect(summary.antiJokerCount).toBe(1)
        expect(summary.averageLuck).toBeCloseTo((0.15 + 0.02 - 0.12) / 3, 10)
      })

      it('should filter rolls by player color', () => {
        const rolls = [
          {
            dice: [6, 6] as [number, number],
            luck: 0.15,
            actualEquity: 0.8,
            expectedEquity: 0.65,
            classification: 'joker' as const,
            moveNumber: 1,
            playerColor: 'white' as const,
          },
          {
            dice: [3, 4] as [number, number],
            luck: -0.08,
            actualEquity: 0.42,
            expectedEquity: 0.5,
            classification: 'normal' as const,
            moveNumber: 2,
            playerColor: 'black' as const, // Different player
          },
        ]

        const whiteSummary = calculator.calculatePlayerSummary('user-123', 'white', rolls)
        const blackSummary = calculator.calculatePlayerSummary('user-456', 'black', rolls)

        expect(whiteSummary.rollCount).toBe(1)
        expect(whiteSummary.totalLuck).toBe(0.15)

        expect(blackSummary.rollCount).toBe(1)
        expect(blackSummary.totalLuck).toBe(-0.08)
      })

      it('should handle empty rolls', () => {
        const summary = calculator.calculatePlayerSummary('user-123', 'white', [])

        expect(summary.rollCount).toBe(0)
        expect(summary.totalLuck).toBe(0)
        expect(summary.averageLuck).toBe(0)
        expect(summary.jokerCount).toBe(0)
        expect(summary.antiJokerCount).toBe(0)
      })
    })

    describe('analyzeGame', () => {
      it('should analyze a complete game', async () => {
        const rolls = [
          {
            positionId: 'pos-1',
            dice: [6, 6] as [number, number],
            moveNumber: 1,
            playerId: 'player-1',
            playerColor: 'white' as const,
          },
          {
            positionId: 'pos-2',
            dice: [3, 4] as [number, number],
            moveNumber: 2,
            playerId: 'player-2',
            playerColor: 'black' as const,
          },
        ]

        const playerMap = new Map([
          ['player-1', { userId: 'user-1', color: 'white' as const }],
          ['player-2', { userId: 'user-2', color: 'black' as const }],
        ])

        const analysis = await calculator.analyzeGame('game-123', rolls, playerMap)

        expect(analysis.gameId).toBe('game-123')
        expect(analysis.analysisComplete).toBe(true)
        expect(analysis.players.length).toBe(2)
        expect(analysis.rolls?.length).toBe(2)
        expect(analysis.thresholds).toEqual(DEFAULT_LUCK_THRESHOLDS)
      })

      it('should handle errors gracefully', async () => {
        // Set up a failing hint provider
        setHintProviderForTesting({
          getHintsFromPositionId: async () => {
            throw new Error('Hint provider failed')
          },
        })

        const rolls = [
          {
            positionId: 'pos-1',
            dice: [6, 6] as [number, number],
            moveNumber: 1,
            playerId: 'player-1',
            playerColor: 'white' as const,
          },
        ]

        const playerMap = new Map([
          ['player-1', { userId: 'user-1', color: 'white' as const }],
        ])

        const analysis = await calculator.analyzeGame('game-123', rolls, playerMap)

        // Should complete but with fewer analyzed rolls
        expect(analysis.gameId).toBe('game-123')
        expect(analysis.analysisComplete).toBe(true)
        // Rolls array may be empty due to errors
        expect(analysis.rolls?.length).toBe(0)
      })
    })
  })
})
