import { BackgammonRoll } from './dice'
import { BackgammonColor } from './game'
import { BackgammonMove } from './move'
import { PlayerMoving } from './player'

export type BackgammonPlayStateKind = 'moving' | 'dice-switching' | 'doubling'

type _BaseBgPlay = {
  roll: BackgammonRoll
  moves: BackgammonMove[]
}

export interface PlayInitializing extends _BaseBgPlay {
  stateKind: 'initializing'
  player: PlayerMoving
}

export interface PlayMoving extends _BaseBgPlay {
  stateKind: 'moving'
  player: PlayerMoving
  moves: BackgammonMoves
}

export interface PlayDiceSwitching extends _BaseBgPlay {
  stateKind: 'dice-switching'
  player: PlayerMoving
}
