import { BackgammonColor } from './game'
export type BackgammonDieValue = undefined | 1 | 2 | 3 | 4 | 5 | 6
export type BackgammonDieOrder = 0 | 1
export type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]

export type BackgammonDiceStateKind = 'ready' | 'rolled'

type _BaseBgDice = {
  color: BackgammonColor
  currentRoll: BackgammonRoll | undefined
  roll: (dice: BackgammonDiceReady) => BackgammonRoll
  switchDice: (dice: BackgammonDiceRolled) => BackgammonRoll
  isDoubles: (dice: BackgammonRolled) => boolean
}

export type BackgammonDice = _BaseBgDice & {
  id: string
  stateKind: BackgammonDiceStateKind
}

export interface BackgammonDiceReady extends BackgammonDice {
  stateKind: 'ready'
}

export interface RolledDiceState extends BackgammonDice {
  stateKind: 'rolled'
}
