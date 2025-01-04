import { Dice, generateId } from '..'
import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonRoll,
} from '../../types'
import { BackgammonPips } from '../../types/pip'

export class Player implements BackgammonPlayer {
  id: string
  stateKind: 'ready' = 'ready'
  dice: BackgammonDice
  pipCount: BackgammonPips = 167
  constructor(
    public color: BackgammonColor,
    public direction: BackgammonMoveDirection
  ) {
    this.id = generateId()
    this.color = color
    this.dice = new Dice(color)
  }
}

function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
