import { NodotsCheckercontainer } from './checkercontainer'
import { DieValue } from './dice'
import { NodotsMoveDirection } from './game'
import { NodotsPlayerPlayingRolling, NodotsPlayerPlayingMoving } from './player'

export interface NodotsMove {
  id: string
  playId: string
  player: NodotsPlayerPlayingRolling | NodotsPlayerPlayingMoving
  isAuto: boolean
  isForced: boolean
  dieValue: DieValue
  direction: NodotsMoveDirection
  origin: NodotsCheckercontainer | undefined
  destination: NodotsCheckercontainer | undefined
}

export interface MoveInitializing extends NodotsMove {
  kind: 'move-initializing'
}

export interface MoveMoving extends NodotsMove {
  kind: 'move-moving'
  origin: NodotsCheckercontainer
}

export interface MoveMoved extends NodotsMove {
  kind: 'move-moved'
  origin: NodotsCheckercontainer
  destination: NodotsCheckercontainer
}
