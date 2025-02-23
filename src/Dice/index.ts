import { generateId } from '..'
import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceInactive,
  BackgammonDiceRolling,
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
    color: BackgammonColor,
    stateKind: BackgammonDiceStateKind = 'inactive',
    id: string = generateId(),
    currentRoll: BackgammonRoll | undefined = undefined
  ): BackgammonDice {
    const total = currentRoll ? currentRoll[0] + currentRoll[1] : undefined

    switch (stateKind) {
      case 'rolling':
        return {
          id,
          color,
          stateKind,
          currentRoll,
          total,
        } as BackgammonDiceRolling
      case 'rolled':
        return {
          id,
          color,
          stateKind,
          currentRoll: currentRoll as BackgammonRoll,
          total: total as number,
        } as BackgammonDiceRolled
      case 'inactive':
        return {
          id,
          color,
          stateKind,
        } as BackgammonDiceInactive
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
    return dice.currentRoll![0] === dice.currentRoll![1] ? true : false
  }

  static rollDie = function rollDie(): BackgammonDieValue {
    return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
  }
  // Convenience  mostly for tests
  static _RandomRoll = [this.rollDie(), this.rollDie()] as BackgammonRoll
}
