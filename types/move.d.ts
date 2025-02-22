import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { BackgammonPlayerActive } from './player'

export type BackgammonMoveState =
  | 'ready'
  | 'in-progress'
  | 'completed'
  | 'confirmed'

export type BackgammonMoveKind =
  | 'no-move'
  | 'point-to-point'
  | 'reenter'
  | 'bear-off'

type BaseMove = {
  id: string
  player: BackgammonPlayerActive
  stateKind: BackgammonMoveState
  dieValue: BackgammonDieValue
  moveKind?: BackgammonMoveKind
  isHit?: boolean
  origin?: BackgammonCheckercontainer
  destination?: BackgammonCheckercontainer
}

type Move = BaseMove & {
  stateKind: BackgammonMoveStateKind
}

export type BackgammonMoveReady = Move & {
  stateKind: 'ready'
  player: BackgammonPlayerActive
  dieValue: BackgammonDieValue
}

export type BackgammonMoveInProgress = Move & {
  stateKind: 'in-progress'
  moveKind: BackgammonMoveKind
  player: BackgammonPlayerMoving
  dieValue: BackgammonDieValue
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer | undefined
}

export type BackgammonMoveCompleted = Move & {
  stateKind: 'completed'
  moveKind: BackgammonMoveKind
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export type BackgammonMoveConfirmed = Move & {
  stateKind: 'confirmed'
  moveKind: BackgammonMoveKind
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export type BackgammonMoveNoMove = Move & {
  stateKind: 'confirmed'
  moveKind: undefined
  origin: undefined
  destination: undefined
}

export type BackgammonMove =
  | BackgammonMoveReady
  | BackgammonMoveInProgress
  | BackgammonMoveCompleted
  | BackgammonMoveConfirmed
  | BackgammonMoveNoMove

export type BackgammonMoves =
  | [BackgammonMove, BackgammonMove]
  | [BackgammonMove, BackgammonMove, BackgammonMove, BackgammonMove]

export type BackgammonMoveResult = {
  board: BackgammonBoard
  move: BackgammonMove
}
