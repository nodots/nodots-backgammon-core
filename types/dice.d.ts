import { BackgammonColor } from './game'
export type BackgammonDieValue = 1 | 2 | 3 | 4 | 5 | 6
export type BackgammonDieOrder = 0 | 1
export type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]

export type BackgammonDiceStateKind = 'ready' | 'rolled'

type _BaseBgDice = {
  color?: BackgammonColor
  currentRoll?: BackgammonRoll | undefined
  roll?: (dice: BackgammonDiceReady) => BackgammonDiceRolled
  switchDice?: (dice: BackgammonDiceRolled) => BackgammonDiceRolled
  isDoubles?: (dice: BackgammonDiceRolled) => boolean
}

export type BackgammonDice = _BaseBgDice & {
  id?: string
  stateKind: BackgammonDiceStateKind
}

export interface BackgammonDiceReady extends BackgammonDice {
  stateKind: 'ready'
}

export interface BackgammonDiceRolled extends BackgammonDice {
  stateKind: 'rolled'
}
