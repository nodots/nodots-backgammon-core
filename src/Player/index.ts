import { Dice, generateId } from '..'
import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonPips,
  BackgammonPlayer,
  BackgammonPlayerStateKind,
  BackgammonRoll,
  GameMoving,
  BackgammonPlayerReady,
  BackgammonDiceReady,
} from '../../types'

export interface Player extends BackgammonPlayer {

  roll: function (dice: Dice): BackgammonRoll = {
    if (this.stateKind !== 'ready') {
      throw new Error('Player is not in ready state')
    }
    const roll: BackgammonRoll = dice.roll()
    this.stateKind = 'moving'
    return roll
  }
}

function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
