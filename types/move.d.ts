import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { PlayerPlayingRolling, PlayerPlayingMoving } from './player'

export type BackgammonMoveStateKind = 'initializing' | 'moving' | 'moved'

export type _BaseBgMove = {
  player: PlayerMoving
  isAuto: boolean
  isForced: boolean
  dieValue: BackgammonDieValue
  direction: BackgammonMoveDirection
  origin?: BackgammonCheckercontainer
  destination?: BackgammonCheckercontainer
}

export type BackgammonMove = _BaseBgMove & {
  id: string
  stateKind: BackgammonMoveStateKind
}

export interface MoveMoving extends BackgammonMove {
  kind: 'moving'
  dieValue: BackgammonDieValue
}

export interface MoveMoved extends BackgammonMove {
  kind: 'moved'
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export type BackgammonMoves =
  | [BackgammonMove, BackgammonMove]
  | [BackgammonMove, BackgammonMove, BackgammonMove, BackgammonMove]
