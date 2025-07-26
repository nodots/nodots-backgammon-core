import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonDiceRolling,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { generateId } from '..'

export class Dice {
  public static initialize = function initializeDice(
    color: BackgammonColor,
    stateKind: BackgammonDiceStateKind = 'inactive',
    id: string = generateId(),
    currentRoll: BackgammonRoll | undefined = undefined
  ): BackgammonDice {
    const total = currentRoll ? currentRoll[0] + currentRoll[1] : undefined

    switch (stateKind) {
      case 'inactive':
        return {
          id,
          stateKind: 'inactive',
          color,
          currentRoll,
          total,
        } as BackgammonDiceInactive
      case 'rolling':
        return {
          id,
          stateKind: 'rolling',
          color,
          currentRoll,
          total,
        } as BackgammonDiceRolling
      case 'rolled':
        if (!currentRoll) {
          throw new Error('currentRoll is required for rolled dice')
        }
        return {
          id,
          stateKind: 'rolled',
          color,
          currentRoll,
          total: total!,
        } as BackgammonDiceRolled
      default:
        throw new Error(`Unknown dice state: ${stateKind}`)
    }
  }

  public static roll = function rollDice(
    dice: BackgammonDiceInactive | BackgammonDiceRolling
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
