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

  public static initialize = function initializeDice(
    color: BackgammonColor
  ): BackgammonDiceReady {
    return {
      id: generateId(),
      stateKind: 'ready',
      color,
      currentRoll: undefined,
      total: 0,
    }
  }

  public static roll = function rollDice(
    dice: BackgammonDiceReady
  ): BackgammonDiceRolled {
    const currentRoll: BackgammonRoll = [
      Dice.rollDie() as BackgammonDieValue,
      Dice.rollDie() as BackgammonDieValue,
    ]
    return {
      ...dice,
      stateKind: 'rolled',
      currentRoll,
      total: currentRoll[0] + currentRoll[1],
    }
  }

  public static switchDice = function switchDice(
    dice: BackgammonDiceRolled
  ): BackgammonDiceRolled {
    return {
      ...dice,
      currentRoll: [
        dice.currentRoll![1],
        dice.currentRoll![0],
      ] as BackgammonRoll,
    }
  }

  public static isDouble = function isDouble(
    dice: BackgammonDiceRolled
  ): boolean {
    return dice.currentRoll![0] === dice.currentRoll![1] ? true : false
  }

  private static rollDie = function rollDie(): BackgammonDieValue {
    return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
  }
}
