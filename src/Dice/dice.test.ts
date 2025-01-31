import { Dice } from '.'
import { randomBackgammonColor } from '..'

const monteCarloRuns = 1000000

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

  test('should have random rolls', () => {
    const rolls = []
    for (let i = 0; i < monteCarloRuns; i++) {
      const roll = Dice.roll(initializedDice)
      rolls.push(roll.currentRoll)
    }
    interface totalRow {
      total: number
      count: number
    }
    const uniqueTotals: totalRow[] = []

    rolls.forEach((roll) => {
      const total = roll[0] + roll[1]
      const index = uniqueTotals.findIndex((row) => row.total === total)
      if (index === -1) {
        uniqueTotals.push({ total, count: 1 })
      } else {
        uniqueTotals[index].count++
      }
    })
    const expectedDistinctRolls = 11 // Maximum number of unique totals for two six-sided dice
    expect(uniqueTotals.length).toBeLessThan(monteCarloRuns)
    expect(uniqueTotals.length).toEqual(expectedDistinctRolls)
    uniqueTotals.forEach((row) => {
      const probability = row.count / monteCarloRuns
      expect(probability).toBeGreaterThan(0)
      expect(probability).toBeLessThan(1)
    })
  })
})
