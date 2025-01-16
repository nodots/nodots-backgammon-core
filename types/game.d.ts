import { BackgammonBoard } from './board'
import { BackgammonCube } from './cube'
import { IntegerRange } from './generics'
import { BackgammonPlay, PlayRolling } from './play'
import { BackgammonPlayers } from './player'

export type BackgammonColor = 'black' | 'white'
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'
export type BackgammonPips = IntegerRange<1, 167>

export const MAX_PIP_COUNT = 167
export const CHECKERS_PER_PLAYER = 15

// FIXME This is a horrible type name because it doesn't describe
// a kind of game but rather the state of the game. Complication of
// informal pattern in this library for all classes to have a `kind`.
export type BackgammonGameStateKind =
  | 'initializing'
  | 'rolling-for-start'
  | 'rolling'
  | 'rolled'
  | 'moving'

export type BaseBgGame = {
  id?: string
  stateKind?: BackgammonGameStateKind
  players?: BackgammonPlayers
  board?: BackgammonBoard
  cube?: BackgammonCube
  activeColor?: BackgammonColor
  activePlay?: BackgammonPlay
}

export interface GameInitializing extends BaseBgGame {
  id: string
  stateKind: 'initializing'
}
export interface GameRollingForStart extends BaseBgGame {
  id: string
  stateKind: 'rolling-for-start'
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
}

export interface GameRolling extends BaseBgGame {
  id: string
  stateKind: 'rolling'
  activeColor: BackgammonColor
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
  activePlay?: PlayRolling
}

export interface GameRolled extends BaseBgGame {
  id: string
  stateKind: 'rolled'
  activeColor: BackgammonColor
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
  activePlay: PlayRolled
}

export interface GameMoving extends BaseBgGame {
  id: string
  stateKind: 'moving'
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
  activeColor: BackgammonColor
  activePlay: BackgammonPlay
}

export type BackgammonGame =
  | GameInitializing
  | GameRollingForStart
  | GameRolling
  | GameMoving

export type BackgammonGameActive =
  | GameRollingForStart
  | GameRolling
  | GameMoving
