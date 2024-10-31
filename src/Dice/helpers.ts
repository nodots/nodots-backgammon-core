import { DieValue, NodotsRoll } from '../../@types'

export const roll = (): DieValue =>
  (Math.floor(Math.random() * 6) + 1) as DieValue

export const rollDice = (): NodotsRoll => [roll(), roll()]
export const isDoubles = (roll: NodotsRoll) => roll[0] === roll[1]
