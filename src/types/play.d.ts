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
  move: BackgammonMoveCompleted
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
  board: BakgammonBoard
  moves?: BackgammonMoves
}

type BackgammonPlay = BasePlay & {
  stateKind: BackgammonPlayStateKind
}

export type BackgammonPlayRolling = BackgammonPlay & {
  stateKind: 'rolling'
  player: BackgammonPlayerRolling
}

export type BackgammonPlayRolled = BackgammonPlay & {
  stateKind: 'rolled'
  player: BackgammonPlayerRolled
  moves: BackgammonMoves
}

export type BackgammonPlayDoubled = BackgammonPlay & {
  stateKind: 'doubled'
}

export type BackgammonPlayMoving = BackgammonPlay & {
  stateKind: 'moving'
  player: BackgammonPlayerMoving
  moves: BackgammonMoves
}

export type BackgammonPlayMoved = BackgammonPlay & {
  stateKind: 'moved'
  player: BackgammonPlayerMoved
}

export type BackgammonPlayConfirmed = BackgammonPlay & {
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

export type BackgammonRollResults = {
  player: BackgammonPlayerRolled
  activePlay: BackgammonPlayRolled
}

export type BackgammonPlayResults = {
  board: BackgammonBoard
  play: BackgammonPlay
}
