import { describe, it, expect } from '@jest/globals'
import { Dice } from '..'
import { randomBackgammonColor } from '../..'
import {
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonRoll,
} from 'nodots-backgammon-types'

const monteCarloRuns = 100000
const randomColor = randomBackgammonColor()

describe('Dice', () => {
  describe('Initialization', () => {
    it('should initialize the dice correctly with minimal parameters', () => {
      const dice = Dice.initialize(randomColor)
      expect(dice).toBeDefined()
      expect(dice.id).toBeDefined()
      expect(dice.stateKind).toBe('inactive')
      expect(dice.color).toBe(randomColor)
      expect(dice.currentRoll).toBeUndefined()
      expect(dice.total).toBeUndefined()
    })

    it('should initialize the dice correctly with all parameters', () => {
      const id = 'test-id'
      const currentRoll: BackgammonRoll = [3, 4]
      const dice = Dice.initialize(randomColor, 'inactive', id, currentRoll)
      expect(dice.id).toBe(id)
      expect(dice.stateKind).toBe('inactive')
      expect(dice.color).toBe(randomColor)
      expect(dice.currentRoll).toEqual(currentRoll)
      expect(dice.total).toBe(7)
    })
  })

  describe('Rolling', () => {
    const dice = Dice.initialize(randomColor)

    it('should roll the dice correctly', () => {
      const rolledDice = Dice.roll(dice)
      expect(rolledDice).toBeDefined()
      expect(rolledDice.id).toBe(dice.id)
      expect(rolledDice.stateKind).toBe('rolled')
      expect(rolledDice.color).toBe(dice.color)
      expect(rolledDice.currentRoll).toBeDefined()
      expect(rolledDice.currentRoll!.length).toBe(2)
      expect(rolledDice.currentRoll![0]).toBeGreaterThanOrEqual(1)
      expect(rolledDice.currentRoll![0]).toBeLessThanOrEqual(6)
      expect(rolledDice.currentRoll![1]).toBeGreaterThanOrEqual(1)
      expect(rolledDice.currentRoll![1]).toBeLessThanOrEqual(6)
      expect(rolledDice.total).toBe(
        rolledDice.currentRoll![0] + rolledDice.currentRoll![1]
      )
    })

    test('should have approximately uniform distribution for individual dice', () => {
      const rolls = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const roll = Dice.roll(dice)
        rolls.push(roll.currentRoll)
      }
      const counts = new Array(6).fill(0)
      rolls.forEach((roll) => {
        counts[roll![0] - 1]++
        counts[roll![1] - 1]++
      })
      const expectedCount = (monteCarloRuns * 2) / 6
      counts.forEach((count, index) => {
        const deviation = Math.abs(count - expectedCount) / expectedCount
        expect(deviation).toBeLessThan(0.05) // Allowing 5% deviation
        console.log(
          `Die value ${index + 1} appeared ${count} times (${(
            (count / (monteCarloRuns * 2)) *
            100
          ).toFixed(2)}%)`
        )
      })
    })

    test('should have correct probability distribution for totals', () => {
      const rolls = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const roll = Dice.roll(dice)
        rolls.push(roll.currentRoll)
      }

      // Expected probabilities for each total (2-12)
      const expectedProbabilities = {
        2: 1 / 36, // (1,1)
        3: 2 / 36, // (1,2), (2,1)
        4: 3 / 36, // (1,3), (2,2), (3,1)
        5: 4 / 36, // (1,4), (2,3), (3,2), (4,1)
        6: 5 / 36, // (1,5), (2,4), (3,3), (4,2), (5,1)
        7: 6 / 36, // (1,6), (2,5), (3,4), (4,3), (5,2), (6,1)
        8: 5 / 36, // (2,6), (3,5), (4,4), (5,3), (6,2)
        9: 4 / 36, // (3,6), (4,5), (5,4), (6,3)
        10: 3 / 36, // (4,6), (5,5), (6,4)
        11: 2 / 36, // (5,6), (6,5)
        12: 1 / 36, // (6,6)
      }

      const totalCounts = new Array(13).fill(0) // 0-12, ignore 0-1
      rolls.forEach((roll) => {
        const total = roll![0] + roll![1]
        totalCounts[total]++
      })

      // Check each total's probability
      for (let total = 2; total <= 12; total++) {
        const actualProbability = totalCounts[total] / monteCarloRuns
        const expectedProbability =
          expectedProbabilities[total as keyof typeof expectedProbabilities]
        const deviation =
          Math.abs(actualProbability - expectedProbability) /
          expectedProbability
        expect(deviation).toBeLessThan(0.1) // Allowing 10% deviation
      }
    })
  })

  describe('Switching Dice', () => {
    it('should switch dice correctly', () => {
      const dice = Dice.initialize(randomColor)
      const rolledDice = Dice.roll(dice)
      const originalRoll = [...rolledDice.currentRoll!]
      const switchedDice = Dice.switchDice(rolledDice)

      expect(switchedDice.currentRoll![0]).toBe(originalRoll[1])
      expect(switchedDice.currentRoll![1]).toBe(originalRoll[0])
      expect(switchedDice.total).toBe(rolledDice.total)
    })

    it('should maintain dice properties after switching', () => {
      const dice = Dice.initialize(randomColor)
      const rolledDice = Dice.roll(dice)
      const switchedDice = Dice.switchDice(rolledDice)

      expect(switchedDice.id).toBe(rolledDice.id)
      expect(switchedDice.stateKind).toBe(rolledDice.stateKind)
      expect(switchedDice.color).toBe(rolledDice.color)
    })
  })

  describe('Double Detection', () => {
    it('should correctly identify doubles', () => {
      const dice = Dice.initialize(randomColor)
      const mockRoll: BackgammonRoll = [4, 4]
      const rolledDice: BackgammonDiceRolled = {
        ...dice,
        stateKind: 'rolled',
        currentRoll: mockRoll,
        total: 8,
      }
      expect(Dice.isDouble(rolledDice)).toBe(true)
    })

    it('should correctly identify non-doubles', () => {
      const dice = Dice.initialize(randomColor)
      const mockRoll: BackgammonRoll = [3, 4]
      const rolledDice: BackgammonDiceRolled = {
        ...dice,
        stateKind: 'rolled',
        currentRoll: mockRoll,
        total: 7,
      }
      expect(Dice.isDouble(rolledDice)).toBe(false)
    })

    test('should have correct probability of doubles', () => {
      const dice = Dice.initialize(randomColor)
      const rolls = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const roll = Dice.roll(dice)
        rolls.push(roll)
      }

      const doubles = rolls.filter((roll) =>
        Dice.isDouble(roll as BackgammonDiceRolled)
      )
      const doublesProbability = doubles.length / monteCarloRuns
      const expectedProbability = 1 / 6 // 6 possible doubles out of 36 possible rolls

      const deviation =
        Math.abs(doublesProbability - expectedProbability) / expectedProbability
      expect(deviation).toBeLessThan(0.1) // Allowing 10% deviation
      console.log(
        `Doubles probability: Expected ${(expectedProbability * 100).toFixed(
          2
        )}%, Actual ${(doublesProbability * 100).toFixed(2)}%`
      )
    })
  })
})
