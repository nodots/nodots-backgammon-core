import { Dice } from '.'
import { randomBackgammonColor } from '..'
import { BackgammonDiceInactive, BackgammonDiceReady } from '../../types'

const monteCarloRuns = 10000
const randomColor = randomBackgammonColor()
let dice: BackgammonDiceInactive | BackgammonDiceReady = Dice.initialize(
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

  it('should set the dice to ready', () => {
    dice = Dice.setReady(dice) as BackgammonDiceReady
    expect(dice.stateKind).toBe('ready')
  })
})
