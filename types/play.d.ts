import { BackgammonRoll } from './dice'
import { BackgammonColor } from './game'
import { BackgammonMove } from './move'
import { BackgammonPlayerMoving } from './player'

export type BackgammonPlayStateKind = 'initializing' | 'moving'

type BaseBgPlay = {
  id?: string
  player?: BackgammonPlayerMoving
  roll?: BackgammonRoll
  moves?: BackgammonMove[]
}

export interface PlayInitializing extends BaseBgPlay {
  id: string
  stateKind: 'initializing'
  player: BackgammonPlayerMoving
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayMoving extends BaseBgPlay {
  id: string
  stateKind: 'moving'
  player: BackgammonPlayerMoving
  roll: BackgammonRoll
  moves: BackgammonMoves
}
