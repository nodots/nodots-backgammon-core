import {
  BackgammonColor,
  BackgammonDice,
  BackgammonDieValue,
  BackgammonRoll,
  PlayerDice,
} from '../../types'

export class Dice implements BackgammonDice {
  white: PlayerDice
  black: PlayerDice
  constructor() {
    this.white = {
      kind: 'inactive',
      color: 'white',
      roll: () => this.rollDice('white'),
    }
    this.black = {
      kind: 'inactive',
      color: 'black',
      roll: () => this.rollDice('black'),
    }
  }

  roll = (): BackgammonDieValue =>
    (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue

  rollDice = (activeColor: BackgammonColor): BackgammonRoll => {
    const activeDice = activeColor === 'white' ? this.white : this.black
    return activeDice.roll()
  }

  isDoubles = (roll: BackgammonRoll) => roll[0] === roll[1]
}
