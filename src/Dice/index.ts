import { generateId } from '..'
import {
  BackgammonColor,
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonRoll,
} from 'nodots-backgammon-types'

export class Dice {
  public static initialize = function initializeDice(
    color: BackgammonColor,
    stateKind: BackgammonDiceStateKind = 'inactive',
    id: string = generateId(),
    currentRoll: BackgammonRoll | undefined = undefined
  ): BackgammonDiceInactive {
    const total = currentRoll ? currentRoll[0] + currentRoll[1] : undefined
    return {
      id,
      stateKind: 'inactive',
      color,
      currentRoll,
      total,
    }
  }

  public static roll = function rollDice(
    dice: BackgammonDiceInactive
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
    return dice.currentRoll![0] === dice.currentRoll![1]
  }

  static rollDie = function rollDie(): BackgammonDieValue {
    return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
  }
  // Convenience  mostly for tests
  static _RandomRoll = [this.rollDie(), this.rollDie()] as BackgammonRoll
}
