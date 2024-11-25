import { BackgammonColor } from './game'

export type BackgammonDieValue = undefined | 1 | 2 | 3 | 4 | 5 | 6
export type BackgammonDieOrder = 0 | 1
export type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]

export type DiceKind = 'inactive' | 'ready' | 'rolled'

export type PlayerDice = {
  kind: DiceKind
  color: BackgammonColor
  roll: BackgammonRoll
}

export type BackgammonDice = {
  white: PlayerDice
  black: PlayerDice
}
