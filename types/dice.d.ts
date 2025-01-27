import { BackgammonColor } from './game'
export type BackgammonDieValue = 1 | 2 | 3 | 4 | 5 | 6
export type BackgammonDieOrder = 0 | 1
export type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]

export type BackgammonDiceStateKind = 'inactive' | 'ready' | 'rolled'

type BaseDice = {
  id: string
  color: BackgammonColor
  currentRoll?: BackgammonRoll | undefined
}

type Dice = BaseDice & {
  stateKind: BackgammonDiceStateKind
}

export type BackgammonDiceInactive = Dice & {
  stateKind: 'inactive'
}

export type BackgammonDiceReady = Dice & {
  stateKind: 'ready'
}

export type BackgammonDiceRolled = Dice & {
  stateKind: 'rolled'
  currentRoll: BackgammonRoll
}

export type BackgammonDice =
  | BackgammonDiceInactive
  | BackgammonDiceReady
  | BackgammonDiceRolled
