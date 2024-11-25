import { BackgammonDice, BackgammonDieValue, BackgammonRoll } from '../../types'

export const buildDice = (): BackgammonDice => {
  return {
    white: {
      kind: 'inactive',
      color: 'white',
      roll: [undefined, undefined],
    },
    black: {
      kind: 'inactive',
      color: 'black',
      roll: [undefined, undefined],
    },
  }
}

export const roll = (): BackgammonDieValue =>
  (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue

export const rollDice = (): BackgammonRoll => [roll(), roll()]
export const isDoubles = (roll: BackgammonRoll) => roll[0] === roll[1]
