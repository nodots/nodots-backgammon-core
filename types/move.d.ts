import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { PlayerMoving, PlayerPlayingMoving } from './player'

export type BackgammonMoveStateKind =
  | 'initializing'
  | 'moving'
  | 'moved'
  | 'no-move'
  | 'hit'

type BaseBgMove = {
  id?: string
  player?: PlayerMoving
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
  player: PlayerPlayingMoving
  dieValue: BackgammonDieValue
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer | undefined
}

export interface MoveMoved extends BackgammonMove {
  stateKind: 'moved'
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}

export type BackgammonMoves =
  | [BackgammonMove, BackgammonMove]
  | [BackgammonMove, BackgammonMove, BackgammonMove, BackgammonMove]
