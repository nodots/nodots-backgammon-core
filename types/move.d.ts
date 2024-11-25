import { BackgammonCheckercontainer } from './checkercontainer'
import { BackgammonDieValue } from './dice'
import { BackgammonMoveDirection } from './game'
import { PlayerPlayingRolling, PlayerPlayingMoving } from './player'

export interface Move {
  id: string
  playId: string
  player: PlayerPlayingRolling | PlayerPlayingMoving
  isAuto: boolean
  isForced: boolean
  dieValue: BackgammonDieValue
  direction: BackgammonMoveDirection
  origin: BackgammonCheckercontainer | undefined
  destination: BackgammonCheckercontainer | undefined
}

export interface MoveInitializing extends Move {
  kind: 'move-initializing'
}

export interface MoveMoving extends Move {
  kind: 'move-moving'
  origin: BackgammonCheckercontainer
}

export interface MoveMoved extends Move {
  kind: 'move-moved'
  origin: BackgammonCheckercontainer
  destination: BackgammonCheckercontainer
}
