import { BackgammonRoll } from './dice'
import { BackgammonMoves } from './move'
import {
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
} from './player'

export type BackgammonPlayResult = {
  board: BackgammonBoard
  play: BackgammonPlay
}

export type BackgammonPlayStateKind =
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'moved'
  | 'confirmed'

type BasePlay = {
  id: string
  player: BackgammonPlayer
  moves?: BackgammonMoves
}

type Play = BasePlay & {
  stateKind: BackgammonPlayStateKind
}

export type BackgammonPlayRolling = Play & {
  stateKind: 'rolling'
  player: BackgammonPlayerRolling
}

export type BackgammonPlayRolled = Play & {
  stateKind: 'rolled'
  player: BackgammonPlayerRolled
  moves: BackgammonMoves
}

export type BackgammonPlayDoubled = Play & {
  stateKind: 'doubled'
}

export type BackgammonPlayMoving = Play & {
  stateKind: 'moving'
  player: BackgammonPlayerMoving
  moves: BackgammonMoves
}

export type BackgammonPlayMoved = Play & {
  stateKind: 'moved'
  player: BackgammonPlayerMoved
}

export type BackgammonPlayConfirmed = Play & {
  stateKind: 'confirmed'
  player: BackgammonPlayerMoved
}

export type BackgammonPlay =
  | BackgammonPlayRolling
  | BackgammonPlayRolled
  | BackgammonPlayDoubled
  | BackgammonPlayMoving
  | BackgammonPlayMoved
  | BackgammonPlayCompleted

export type BackgammonPlayResults = {
  board: BackgammonBoard
  play: BackgammonPlay
}
