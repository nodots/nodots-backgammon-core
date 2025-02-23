import { Dice } from '.'
import { randomBackgammonColor } from '..'
import { BackgammonDiceInactive, BackgammonDiceRolled } from '../../types'

const monteCarloRuns = 100000
const randomColor = randomBackgammonColor()
let dice: BackgammonDiceInactive = Dice.initialize(
  randomColor
) as BackgammonDiceInactive

describe('Dice', () => {
  it('should initialize the dice correctly', () => {
    expect(dice).toBeDefined()
    expect(dice.id).toBeDefined()
    expect(dice.stateKind).toBe('inactive')
    expect(dice.color).toBe(randomColor)
    expect(dice.currentRoll).toBeUndefined()
  })
  const rolledDice = Dice.roll(dice) as BackgammonDiceRolled

  it('should roll the dice correctly', () => {
    expect(rolledDice).toBeDefined()
    expect(rolledDice.id).toBe(dice.id)
    expect(rolledDice.stateKind).toBe('rolled')
    expect(rolledDice.color).toBe(dice.color)
    expect(rolledDice.currentRoll).toBeDefined()
    expect(rolledDice.total).toBe(
      rolledDice.currentRoll[0] + rolledDice.currentRoll[1]
    )
  })

  test('should have approximately uniform distribution', () => {
    const rolls = []
    for (let i = 0; i < monteCarloRuns; i++) {
      const roll = Dice.roll(dice)
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

  const rolls = []
  for (let i = 0; i < monteCarloRuns; i++) {
    const roll = Dice.roll(dice)
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
