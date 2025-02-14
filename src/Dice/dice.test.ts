import { Dice } from '.'
import { randomBackgammonColor } from '..'

const monteCarloRuns = 10000

describe('Dice', () => {
  const randomColor = randomBackgammonColor()
  const initializedDice = Dice.initialize(randomColor)
  test('should return a number between 1 and 6 for a single die roll', () => {
    const result = Dice.roll(initializedDice)
    const { color, stateKind, currentRoll } = result
    expect(currentRoll).toBeDefined()
    expect(stateKind).toBe('rolled')
    expect(currentRoll![0]).toBeGreaterThanOrEqual(1)
    expect(currentRoll![0]).toBeLessThanOrEqual(6)
    expect(currentRoll![1]).toBeGreaterThanOrEqual(1)
    expect(currentRoll![1]).toBeLessThanOrEqual(6)
    expect(color).toBeDefined()
    expect(color).toBe(randomColor)
  })

  test('should switch the dice', () => {
    const rolledDice = Dice.roll(initializedDice)
    const switchedDice = Dice.switchDice(rolledDice)
    expect(switchedDice.currentRoll).toEqual([
      rolledDice.currentRoll![1],
      rolledDice.currentRoll![0],
    ])
  })

  test('should return true if the dice are doubles', () => {
    const doubleDice = Dice.roll(initializedDice)
    doubleDice.currentRoll = [2, 2]
    expect(Dice.isDouble(doubleDice)).toBe(true)
  })

  test('should return false if the dice are not doubles', () => {
    const nonDoubleDice = Dice.roll(initializedDice)
    nonDoubleDice.currentRoll = [1, 2]
    expect(Dice.isDouble(nonDoubleDice)).toBe(false)
  })

  test('should have approximately uniform distribution', () => {
    const rolls = []
    for (let i = 0; i < monteCarloRuns; i++) {
      const roll = Dice.roll(initializedDice)
      rolls.push(roll.currentRoll)
    }
    const counts = new Array(6).fill(0)
    rolls.forEach((roll) => {
      counts[roll[0] - 1]++
      counts[roll[1] - 1]++
    })
    const expectedCount = (monteCarloRuns * 2) / 6
    counts.forEach((count) => {
      const deviation = Math.abs(count - expectedCount) / expectedCount
      expect(deviation).toBeLessThan(0.05) // Allowing 5% deviation
    })
  })
})
