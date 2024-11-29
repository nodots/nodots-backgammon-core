import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceReady,
  BackgammonDiceRolled,
  BackgammonDieValue,
  BackgammonRoll,
  DiceKind,
} from '../../types'

export class Dice implements BackgammonDice {
  color: BackgammonColor
  kind: DiceKind

  constructor(color: BackgammonColor) {
    this.color = color
    this.kind = 'ready'
  }

  roll = (dice: BackgammonDiceReady): BackgammonDiceRolled => {
    return {
      ...dice,
      kind: 'rolled',
      roll: [this._roll(), this._roll()],
    }
  }

  isDoubles = (roll: BackgammonRoll) => roll[0] === roll[1]

  private _roll = (): BackgammonDieValue =>
    (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue
}
