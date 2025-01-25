import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { PlayerMoving, PlayerPlayingMoving } from './player'

export type BackgammonMoveStateKind =
  | 'initializing'
  | 'in-progress'
  | 'completed'

export type BackgammonMoveKind =
  | 'no-move'
  | 'point-to-point'
  | 'reenter'
  | 'bear-off'

type BaseBgMove = {
  id: string
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
  stateKind: BackgammonMoveStateKind
}

export interface MoveInitializing extends BackgammonMove {
  stateKind: 'initializing'
  player: PlayerPlayingMoving
  dieValue: BackgammonDieValue
}
export interface MoveMoving extends BackgammonMove {
  stateKind: 'in-progress'
  moveKind: BackgammonMoveKind
  player: PlayerPlayingMoving
  dieValue: BackgammonDieValue
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer | undefined
}

export interface MoveMoved extends BackgammonMove {
  stateKind: 'completed'
  moveKind: BackgammonMoveKind
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export interface MoveNoMove extends BackgammonMove {
  stateKind: 'completed'
  moveKind: undefined
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
