import { generateId } from '..'
import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceReady,
  BackgammonDiceRolled,
  BackgammonDieValue,
  BackgammonRoll,
} from '../../types'

export class Dice implements BackgammonDice {
  id: string = generateId()
  stateKind: 'ready' = 'ready'
  currentRoll: BackgammonRoll | undefined = undefined

  constructor(public color: BackgammonColor) {
    this.color = color
  }

  roll: (dice: BackgammonDiceReady) => BackgammonRoll = (dice) => {
    this.currentRoll = [_rollDie(), _rollDie()]
    return this.currentRoll
  }

  switchDice: (dice: BackgammonDiceRolled) => BackgammonRoll = (dice) => {
    return [this.currentRoll![1], this.currentRoll![0]]
  }

  isDoubles: (dice: BackgammonDiceRolled) => boolean = (dice) => {
    return this.currentRoll![0] === this.currentRoll![1]
  }
}

function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
