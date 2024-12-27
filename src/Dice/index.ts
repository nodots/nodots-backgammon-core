import {
  BackgammonDice,
  BackgammonDieValue,
  BackgammonRoll,
  BackgammonDiceReady,
} from '../../types'

export interface Dice extends BackgammonDice {}

export class DiceImpl implements Dice {
  roll(dice: BackgammonDiceReady): BackgammonRoll {
    const currentRoll = [_rollDie(), _rollDie()]
    return currentRoll
  }
}

function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
