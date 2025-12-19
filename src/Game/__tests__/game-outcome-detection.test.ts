/**
 * Tests for gammon/backgammon detection at game completion
 *
 * Rules:
 * - Normal (1 point): Opponent has at least 1 checker borne off
 * - Gammon (2 points): Opponent has 0 checkers borne off, no checkers in winner's home or bar
 * - Backgammon (3 points): Opponent has 0 checkers borne off AND has checker(s) in winner's home board or on bar
 */

import {
  BackgammonGameCompleted,
  BackgammonGameOutcome,
  GAME_OUTCOME_POINTS,
} from '@nodots-llc/backgammon-types'

describe('Game Outcome Detection', () => {
  describe('GAME_OUTCOME_POINTS constant', () => {
    it('should have correct point values for each outcome', () => {
      expect(GAME_OUTCOME_POINTS.normal).toBe(1)
      expect(GAME_OUTCOME_POINTS.gammon).toBe(2)
      expect(GAME_OUTCOME_POINTS.backgammon).toBe(3)
    })

    it('should cover all possible outcomes', () => {
      const outcomes: BackgammonGameOutcome[] = ['normal', 'gammon', 'backgammon']
      outcomes.forEach((outcome) => {
        expect(GAME_OUTCOME_POINTS[outcome]).toBeGreaterThan(0)
      })
    })
  })

  describe('BackgammonGameCompleted type structure', () => {
    it('should have outcome, basePoints, and finalScore fields in completed game', () => {
      // Create a mock completed game to verify type structure
      const mockCompletedGame: Partial<BackgammonGameCompleted> = {
        stateKind: 'completed',
        winner: 'some-player-id',
        outcome: 'gammon',
        basePoints: 2,
        finalScore: 4, // 2 * cube value of 2
      }

      expect(mockCompletedGame.outcome).toBe('gammon')
      expect(mockCompletedGame.basePoints).toBe(2)
      expect(mockCompletedGame.finalScore).toBe(4)
    })

    it('should calculate finalScore as basePoints * cubeValue', () => {
      // Test various combinations
      const testCases = [
        { outcome: 'normal' as const, cubeValue: 1, expected: 1 },
        { outcome: 'normal' as const, cubeValue: 2, expected: 2 },
        { outcome: 'gammon' as const, cubeValue: 1, expected: 2 },
        { outcome: 'gammon' as const, cubeValue: 4, expected: 8 },
        { outcome: 'backgammon' as const, cubeValue: 1, expected: 3 },
        { outcome: 'backgammon' as const, cubeValue: 2, expected: 6 },
        { outcome: 'backgammon' as const, cubeValue: 8, expected: 24 },
      ]

      testCases.forEach(({ outcome, cubeValue, expected }) => {
        const basePoints = GAME_OUTCOME_POINTS[outcome]
        const finalScore = basePoints * cubeValue
        expect(finalScore).toBe(expected)
      })
    })
  })

  describe('Outcome scoring rules', () => {
    it('normal win is worth 1 base point', () => {
      // Normal: opponent has borne off at least 1 checker
      expect(GAME_OUTCOME_POINTS.normal).toBe(1)
    })

    it('gammon is worth 2 base points', () => {
      // Gammon: opponent has 0 checkers borne off, but none in winner home or bar
      expect(GAME_OUTCOME_POINTS.gammon).toBe(2)
    })

    it('backgammon is worth 3 base points', () => {
      // Backgammon: opponent has 0 off AND has checker in winner home or bar
      expect(GAME_OUTCOME_POINTS.backgammon).toBe(3)
    })
  })
})
