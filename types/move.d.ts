import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { PlayerMoving, PlayerPlayingMoving } from './player'

export type BackgammonMoveStateKind =
  | 'initializing'
  | 'moving'
  | 'moved'
  | 'no-move'

export type BackgammonMoveKind =
  | 'no-move'
  | 'point-to-point'
  | 'reenter'
  | 'bear-off'

type BaseBgMove = {
  id?: string
  moveKind?: BackgammonMoveKind
  player?: PlayerMoving
  isHit?: boolean
  isAuto?: boolean
  isForced?: boolean
  dieValue?: BackgammonDieValue
  direction?: BackgammonMoveDirection
  origin?: BackgammonCheckercontainer
  destination?: BackgammonCheckercontainer
}

export interface BackgammonMove extends BaseBgMove {
  id: string
  stateKind: BackgammonMoveStateKind
}

export interface MoveInitializing extends BackgammonMove {
  stateKind: 'initializing'
  player: PlayerPlayingMoving
  dieValue: BackgammonDieValue
}
export interface MoveMoving extends BackgammonMove {
  stateKind: 'moving'
  moveKind: BackgammonMoveKind
  player: PlayerPlayingMoving
  dieValue: BackgammonDieValue
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer | undefined
}

export interface MoveMoved extends BackgammonMove {
  stateKind: 'moved'
  moveKind: BackgammonMoveKind
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export interface MoveNoMove extends BackgammonMove {
  stateKind: 'no-move'
  moveKind: 'no-move'
  origin: BackgammonCheckercontainer
  destination: undefined
}

export type BackgammonMoves =
  | [BackgammonMove, BackgammonMove]
  | [BackgammonMove, BackgammonMove, BackgammonMove, BackgammonMove]

export type BackgammonMoveResult = {
  board: BackgammonBoard
  move: BackgammonMove
}
