import { describe, expect, test } from '@jest/globals'
import { EloCalculator } from '../EloCalculator'

describe('EloCalculator', () => {
  const calc = new EloCalculator()

  describe('expectedScore', () => {
    test('equal ratings produce 0.5 expected score', () => {
      expect(calc.expectedScore(1500, 1500)).toBeCloseTo(0.5, 5)
    })

    test('higher rated player has higher expected score', () => {
      const strong = calc.expectedScore(1800, 1500)
      const weak = calc.expectedScore(1500, 1800)
      expect(strong).toBeGreaterThan(0.5)
      expect(weak).toBeLessThan(0.5)
    })

    test('expected scores for two players sum to 1', () => {
      const playerA = calc.expectedScore(1600, 1400)
      const playerB = calc.expectedScore(1400, 1600)
      expect(playerA + playerB).toBeCloseTo(1.0, 10)
    })

    test('400 point difference produces ~0.91 expected score', () => {
      const expected = calc.expectedScore(1900, 1500)
      expect(expected).toBeCloseTo(0.9091, 3)
    })
  })

  describe('getKFactor', () => {
    test('new player (< 30 games) gets K=32', () => {
      expect(calc.getKFactor(1500, 0)).toBe(32)
      expect(calc.getKFactor(1500, 29)).toBe(32)
    })

    test('established player gets K=16', () => {
      expect(calc.getKFactor(1500, 30)).toBe(16)
      expect(calc.getKFactor(2000, 100)).toBe(16)
    })

    test('elite player (2100+) gets K=10', () => {
      expect(calc.getKFactor(2100, 30)).toBe(10)
      expect(calc.getKFactor(2300, 500)).toBe(10)
    })

    test('new player above elite threshold still gets K=32', () => {
      // New player bonus overrides elite damping
      expect(calc.getKFactor(2200, 10)).toBe(32)
    })
  })

  describe('calculate', () => {
    test('win against equal opponent increases rating', () => {
      const result = calc.calculate(1500, 1500, 1, 50)
      expect(result.ratingChange).toBeGreaterThan(0)
      expect(result.newRating).toBeGreaterThan(1500)
    })

    test('loss against equal opponent decreases rating', () => {
      const result = calc.calculate(1500, 1500, 0, 50)
      expect(result.ratingChange).toBeLessThan(0)
      expect(result.newRating).toBeLessThan(1500)
    })

    test('rating changes are symmetric for equal players', () => {
      const winResult = calc.calculate(1500, 1500, 1, 50)
      const lossResult = calc.calculate(1500, 1500, 0, 50)
      expect(winResult.ratingChange).toBe(-lossResult.ratingChange)
    })

    test('upset win (low beats high) produces larger gain', () => {
      const upsetWin = calc.calculate(1300, 1700, 1, 50)
      const expectedWin = calc.calculate(1700, 1300, 1, 50)
      expect(upsetWin.ratingChange).toBeGreaterThan(expectedWin.ratingChange)
    })

    test('result contains all expected fields', () => {
      const result = calc.calculate(1500, 1600, 1, 30)
      expect(result.previousRating).toBe(1500)
      expect(result.opponentRating).toBe(1600)
      expect(result.actualScore).toBe(1)
      expect(result.kFactor).toBe(16)
      expect(result.expectedScore).toBeLessThan(0.5)
      expect(typeof result.newRating).toBe('number')
      expect(typeof result.ratingChange).toBe('number')
    })

    test('new player has larger rating swing', () => {
      const newPlayer = calc.calculate(1500, 1500, 1, 5)
      const established = calc.calculate(1500, 1500, 1, 50)
      expect(newPlayer.ratingChange).toBeGreaterThan(established.ratingChange)
    })
  })

  describe('prToElo', () => {
    test('anchor points map exactly', () => {
      expect(EloCalculator.prToElo(1)).toBe(2100)
      expect(EloCalculator.prToElo(2)).toBe(1900)
      expect(EloCalculator.prToElo(5)).toBe(1700)
      expect(EloCalculator.prToElo(8)).toBe(1500)
      expect(EloCalculator.prToElo(12)).toBe(1300)
      expect(EloCalculator.prToElo(15)).toBe(1200)
      expect(EloCalculator.prToElo(20)).toBe(1100)
    })

    test('values below minimum PR clamp to highest ELO', () => {
      expect(EloCalculator.prToElo(0)).toBe(2100)
      expect(EloCalculator.prToElo(0.5)).toBe(2100)
    })

    test('values above maximum PR clamp to lowest ELO', () => {
      expect(EloCalculator.prToElo(25)).toBe(1100)
      expect(EloCalculator.prToElo(100)).toBe(1100)
    })

    test('interpolation between anchors', () => {
      // PR 1.5 is halfway between (1, 2100) and (2, 1900) = 2000
      expect(EloCalculator.prToElo(1.5)).toBe(2000)
      // PR 10 is between (8, 1500) and (12, 1300)
      // t = (10-8)/(12-8) = 0.5 => 1500 + 0.5*(1300-1500) = 1400
      expect(EloCalculator.prToElo(10)).toBe(1400)
    })

    test('monotonically decreasing (higher PR = lower ELO)', () => {
      const prs = [1, 2, 3, 5, 8, 10, 12, 15, 20]
      for (let i = 0; i < prs.length - 1; i++) {
        expect(EloCalculator.prToElo(prs[i])).toBeGreaterThanOrEqual(
          EloCalculator.prToElo(prs[i + 1])
        )
      }
    })
  })
})
