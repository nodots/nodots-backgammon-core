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
  color: BackgammonColor | undefined = undefined
  stateKind: 'ready' = 'ready'
  currentRoll: BackgammonRoll | undefined = undefined

  public static initialize(color: BackgammonColor) {
    return {
      id: generateId(),
      stateKind: 'ready',
      color,
      currentRoll: undefined,
    }
  }

  public static roll: (dice: BackgammonDiceReady) => BackgammonDiceRolled =
    (): BackgammonDiceRolled => {
      const currentRoll: BackgammonRoll = [
        _rollDie() as BackgammonDieValue,
        _rollDie() as BackgammonDieValue,
      ]
      return {
        ...this,
        stateKind: 'rolled',
        currentRoll,
      }
    }

  switchDice: (dice: BackgammonDiceRolled) => BackgammonDiceRolled = (
    dice: BackgammonDiceRolled
  ) => {
    return {
      ...dice,
      currentRoll: [
        dice.currentRoll![1],
        dice.currentRoll![0],
      ] as BackgammonRoll,
    }
  }

  isDoubles: () => boolean = () => {
    return this.currentRoll![0] === this.currentRoll![1]
  }
}

function _rollDie(): BackgammonDieValue {
  return (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
