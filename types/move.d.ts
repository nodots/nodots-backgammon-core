import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { BackgammonPlayerActive, BackgammonPlayerMoving } from './player'

export type BackgammonMoveStateKind =
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
  stateKind: BackgammonMoveStateKind
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
  player: BackgammonPlayerRolled
  dieValue: BackgammonDieValue
}

export type BackgammonMoveInProgress = Move & {
  stateKind: 'in-progress'
  moveKind: BackgammonMoveKind
  player: BackgammonPlayerMoving
  dieValue: BackgammonDieValue
  origin: BackgammonCheckercontainer
  destination?: BackgammonCheckercontainer
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
  stateKind: 'completed'
  moveKind: 'no-move'
  origin: BackgammonCheckercontainer
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
