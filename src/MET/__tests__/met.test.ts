import { describe, expect, it } from '@jest/globals'
import {
  DEFAULT_MET,
  getMatchEquity,
  getTakePoint,
  getDoublePoint,
  getGammonValues,
  getMatchScoreContext,
  analyzeCubeDecision,
} from '../index'

describe('Match Equity Table', () => {
  describe('DEFAULT_MET', () => {
    it('should have correct metadata', () => {
      expect(DEFAULT_MET.name).toBe('Kazaross XG2 25 point MET')
      expect(DEFAULT_MET.maxLength).toBe(25)
      expect(DEFAULT_MET.preCrawford.length).toBe(25)
      expect(DEFAULT_MET.postCrawford.length).toBe(25)
    })

    it('should have symmetric 50% equity at equal scores', () => {
      // At any equal score, equity should be 50%
      expect(DEFAULT_MET.preCrawford[0][0]).toBe(0.5) // 1-away vs 1-away
      expect(DEFAULT_MET.preCrawford[4][4]).toBe(0.5) // 5-away vs 5-away
      expect(DEFAULT_MET.preCrawford[9][9]).toBe(0.5) // 10-away vs 10-away
    })
  })

  describe('getMatchEquity', () => {
    it('should return 50% for equal scores', () => {
      expect(getMatchEquity(5, 5)).toBeCloseTo(0.5, 4)
      expect(getMatchEquity(1, 1)).toBeCloseTo(0.5, 4)
    })

    it('should return higher equity when player is ahead', () => {
      // 1-away vs 5-away should be > 50%
      const equity = getMatchEquity(1, 5)
      expect(equity).toBeGreaterThan(0.5)
      expect(equity).toBeCloseTo(0.84179, 4)
    })

    it('should return lower equity when player is behind', () => {
      // 5-away vs 1-away should be < 50%
      const equity = getMatchEquity(5, 1)
      expect(equity).toBeLessThan(0.5)
      expect(equity).toBeCloseTo(0.15821, 4)
    })

    it('should use post-Crawford table when appropriate', () => {
      // Post-Crawford: player at match point (1-away) vs opponent 3-away
      const equity = getMatchEquity(1, 3, false, true)
      expect(equity).toBeCloseTo(0.32264, 4)
    })
  })

  describe('getMatchScoreContext', () => {
    it('should detect Crawford game correctly', () => {
      // Crawford: one player at match point - 1, other not
      const context1 = getMatchScoreContext(4, 0, 5) // Player 1-away, opp 5-away
      expect(context1.isCrawford).toBe(true)
      expect(context1.isPostCrawford).toBe(false)

      const context2 = getMatchScoreContext(0, 4, 5) // Player 5-away, opp 1-away
      expect(context2.isCrawford).toBe(true)
    })

    it('should calculate away scores correctly', () => {
      const context = getMatchScoreContext(3, 2, 7)
      expect(context.playerAway).toBe(4) // 7 - 3
      expect(context.opponentAway).toBe(5) // 7 - 2
      expect(context.matchLength).toBe(7)
    })
  })

  describe('getTakePoint', () => {
    it('should return approximately 25% for money game equivalent', () => {
      // At equal scores with cube at 1, take point should be around 20-25%
      const takePoint = getTakePoint(5, 5, 1)
      expect(takePoint).toBeGreaterThan(0.18)
      expect(takePoint).toBeLessThan(0.30)
    })

    it('should increase when trailing in match', () => {
      // When trailing, take point goes up (more to lose)
      const equalTake = getTakePoint(5, 5, 1)
      const trailingTake = getTakePoint(3, 7, 1) // 3-away vs 7-away (trailing)
      expect(trailingTake).toBeGreaterThan(equalTake)
    })
  })

  describe('getDoublePoint', () => {
    it('should return reasonable double point', () => {
      const doublePoint = getDoublePoint(5, 5, 1)
      expect(doublePoint).toBeGreaterThan(0.5) // Need to be favorite to double
      expect(doublePoint).toBeLessThan(0.85) // But not too high
    })
  })

  describe('getGammonValues', () => {
    it('should return positive gammon values for player', () => {
      const values = getGammonValues(5, 5, 1, false)
      expect(values.playerGammonValue).toBeGreaterThan(0)
      expect(values.playerBackgammonValue).toBeGreaterThan(values.playerGammonValue)
    })

    it('should have zero gammon value when gammon is useless', () => {
      // When player needs 1 point, gammon doesn't help
      const values = getGammonValues(1, 5, 1, false)
      expect(values.playerGammonValue).toBe(0)
      expect(values.playerBackgammonValue).toBe(0)
    })
  })

  describe('analyzeCubeDecision', () => {
    it('should recommend taking with good winning chances', () => {
      const analysis = analyzeCubeDecision(
        5, // playerAway
        5, // opponentAway
        0.4, // 40% chance to win - above typical take point
        0, // gammonRate
        0, // backgammonRate
        1, // cubeValue
        false // isCrawford
      )
      expect(analysis.shouldPass).toBe(false)
    })

    it('should recommend passing with poor winning chances', () => {
      const analysis = analyzeCubeDecision(
        5, // playerAway
        5, // opponentAway
        0.1, // 10% chance to win - below take point
        0, // gammonRate
        0, // backgammonRate
        1, // cubeValue
        false // isCrawford
      )
      expect(analysis.shouldPass).toBe(true)
    })

    it('should not recommend doubling in Crawford game', () => {
      const analysis = analyzeCubeDecision(
        1, // playerAway (at match point)
        3, // opponentAway
        0.8, // 80% chance to win
        0,
        0,
        1,
        true // isCrawford
      )
      expect(analysis.shouldDouble).toBe(false)
    })
  })
})
