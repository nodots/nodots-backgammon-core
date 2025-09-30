import { describe, expect, it } from '@jest/globals'
import {
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonDiceRollingForStart,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types'
import { Dice } from '..'
import { randomBackgammonColor } from '../..'
import { logger } from '../../utils/logger'

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
    const dice = Dice.initialize(
      randomColor,
      'inactive'
    ) as BackgammonDiceInactive

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
      const rolls: BackgammonRoll[] = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const inactiveDice = Dice.initialize(
          randomColor,
          'inactive'
        ) as BackgammonDiceInactive
        const roll = Dice.roll(inactiveDice)
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
        const percentage = ((count / (monteCarloRuns * 2)) * 100).toFixed(2)
        console.log(
          `Die value ${index + 1} appeared ${count} times (${percentage}%)`
        )
        logger.info('[Dice Test] Die distribution:', {
          dieValue: index + 1,
          count,
          percentage: parseFloat(percentage),
          expectedCount,
          deviation,
        })
      })
    })

    test('should have correct probability distribution for totals', () => {
      const rolls: BackgammonRoll[] = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const inactiveDice = Dice.initialize(
          randomColor,
          'inactive'
        ) as BackgammonDiceInactive
        const roll = Dice.roll(inactiveDice)
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

    test('should have correct probability of doubles', () => {
      const dice = Dice.initialize(
        randomColor,
        'inactive'
      ) as BackgammonDiceInactive
      const rolls: BackgammonDiceRolled[] = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const inactiveDice = Dice.initialize(
          randomColor,
          'inactive'
        ) as BackgammonDiceInactive
        const roll = Dice.roll(inactiveDice)
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
      const expectedPercentage = (expectedProbability * 100).toFixed(2)
      const actualPercentage = (doublesProbability * 100).toFixed(2)
      console.log(
        `Doubles probability: Expected ${expectedPercentage}%, Actual ${actualPercentage}%`
      )
      logger.info('[Dice Test] Doubles probability:', {
        expectedProbability: parseFloat(expectedPercentage),
        actualProbability: parseFloat(actualPercentage),
        deviation,
        totalRolls: monteCarloRuns,
        doublesCount: doubles.length,
      })
    })
  })

  describe('Switching Dice', () => {
    it('should switch dice correctly', () => {
      const dice = Dice.initialize(
        randomColor,
        'inactive'
      ) as BackgammonDiceInactive
      const rolledDice = Dice.roll(dice)
      const originalRoll = [...rolledDice.currentRoll!]
      const switchedDice = Dice.switchDice(rolledDice)

      expect(switchedDice.currentRoll![0]).toBe(originalRoll[1])
      expect(switchedDice.currentRoll![1]).toBe(originalRoll[0])
      expect(switchedDice.total).toBe(rolledDice.total)
    })

    it('should maintain dice properties after switching', () => {
      const dice = Dice.initialize(
        randomColor,
        'inactive'
      ) as BackgammonDiceInactive
      const rolledDice = Dice.roll(dice)
      const switchedDice = Dice.switchDice(rolledDice)

      expect(switchedDice.id).toBe(rolledDice.id)
      expect(switchedDice.stateKind).toBe(rolledDice.stateKind)
      expect(switchedDice.color).toBe(rolledDice.color)
    })
  })

  describe('Double Detection', () => {
    it('should correctly identify doubles', () => {
      const dice = Dice.initialize(
        randomColor,
        'inactive'
      ) as BackgammonDiceInactive
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
      const dice = Dice.initialize(
        randomColor,
        'inactive'
      ) as BackgammonDiceInactive
      const mockRoll: BackgammonRoll = [3, 4]
      const rolledDice: BackgammonDiceRolled = {
        ...dice,
        stateKind: 'rolled',
        currentRoll: mockRoll,
        total: 7,
      }
      expect(Dice.isDouble(rolledDice)).toBe(false)
    })
  })

  describe('Rolling for Start', () => {
    it('should roll for start correctly', () => {
      const dice = Dice.initialize(
        randomColor,
        'rolling-for-start'
      ) as BackgammonDiceRollingForStart
      
      const rolledForStartDice = Dice.rollForStart(dice)
      
      expect(rolledForStartDice).toBeDefined()
      expect(rolledForStartDice.id).toBe(dice.id)
      expect(rolledForStartDice.stateKind).toBe('rolled-for-start')
      expect(rolledForStartDice.color).toBe(dice.color)
      expect(rolledForStartDice.currentRoll).toBeDefined()
      expect(rolledForStartDice.currentRoll![0]).toBeGreaterThanOrEqual(1)
      expect(rolledForStartDice.currentRoll![0]).toBeLessThanOrEqual(6)
      expect(rolledForStartDice.currentRoll![1]).toBeUndefined()
      expect(rolledForStartDice.total).toBe(rolledForStartDice.currentRoll![0])
    })

    it('should initialize dice in rolling-for-start state correctly', () => {
      const dice = Dice.initialize(randomColor, 'rolling-for-start')
      expect(dice).toBeDefined()
      expect(dice.stateKind).toBe('rolling-for-start')
      expect(dice.color).toBe(randomColor)
      expect(dice.currentRoll).toBeUndefined()
      expect(dice.total).toBeUndefined()
    })

    it('should initialize dice in rolled-for-start state correctly', () => {
      const dice = Dice.initialize(randomColor, 'rolled-for-start', undefined, [3, undefined])
      expect(dice).toBeDefined()
      expect(dice.stateKind).toBe('rolled-for-start')
      expect(dice.color).toBe(randomColor)
      expect(dice.currentRoll).toEqual([3, undefined])
      expect(dice.total).toBe(3)
    })

    test('should have uniform distribution for start rolls', () => {
      const rolls: number[] = []
      for (let i = 0; i < monteCarloRuns; i++) {
        const dice = Dice.initialize(
          randomColor,
          'rolling-for-start'
        ) as BackgammonDiceRollingForStart
        const rolled = Dice.rollForStart(dice)
        rolls.push(rolled.currentRoll![0])
      }
      
      const counts = new Array(6).fill(0)
      rolls.forEach((value) => {
        counts[value - 1]++
      })
      
      const expectedCount = monteCarloRuns / 6
      counts.forEach((count, index) => {
        const deviation = Math.abs(count - expectedCount) / expectedCount
        expect(deviation).toBeLessThan(0.05) // Allowing 5% deviation
        const percentage = ((count / monteCarloRuns) * 100).toFixed(2)
        console.log(
          `Start roll value ${index + 1} appeared ${count} times (${percentage}%)`
        )
      })
    })
  })
})
