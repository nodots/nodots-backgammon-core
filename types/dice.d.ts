import { BackgammonColor } from './game'
import { BackgammonPlayer } from './player'

export type BackgammonDieValue = undefined | 1 | 2 | 3 | 4 | 5 | 6
export type BackgammonDieOrder = 0 | 1
export type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]

export type DiceKind = 'ready' | 'rolled'

type _Dice = {
  kind: DiceKind
  color: BackgammonColor
  roll?: BackgammonRoll
  roll: () => BackgammonRoll
}

export interface BackgammonDiceReady extends _Dice {
  kind: 'ready'
  roll: () => BackgammonRoll
}

export interface BackgammonDiceRolled extends _Dice {
  kind: 'rolled'
  roll: BackgammonRoll
}
export interface BackgammonDice {
  color: BackgammonColor
  kind: DiceKind
  roll(): BackgammonRoll
  isDoubles(roll: BackgammonRoll): boolean
}
