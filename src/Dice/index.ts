import { generateId } from '..'
import {
  BackgammonColor,
  BackgammonDiceReady,
  BackgammonDiceRolled,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonRoll,
} from '../../types'

export class Dice {
  id!: string
  stateKind!: BackgammonDiceStateKind
  color: BackgammonColor | undefined = undefined
  currentRoll: BackgammonRoll | undefined = undefined

  public static initialize(color: BackgammonColor): BackgammonDiceReady {
    return {
      id: generateId(),
      stateKind: 'ready',
      color,
      currentRoll: undefined,
      total: 0,
    }
  }

  public static roll(dice: BackgammonDiceReady): BackgammonDiceRolled {
    const currentRoll: BackgammonRoll = [
      _rollDie() as BackgammonDieValue,
      _rollDie() as BackgammonDieValue,
    ]
    return {
      ...dice,
      stateKind: 'rolled',
      currentRoll,
      total: currentRoll[0] + currentRoll[1],
    }
  }

  public static switchDice: (
    dice: BackgammonDiceRolled
  ) => BackgammonDiceRolled = (dice: BackgammonDiceRolled) => {
    return {
      ...dice,
      currentRoll: [
        dice.currentRoll![1],
        dice.currentRoll![0],
      ] as BackgammonRoll,
    }
  }

  public static isDouble: (dice: BackgammonDiceRolled) => boolean = (
    dice: BackgammonDiceRolled
  ) => {
    return dice.currentRoll![0] === dice.currentRoll![1] ? true : false
  }
}
function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
