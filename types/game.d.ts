import { BackgammonBoard } from './board'
import { BackgammonChecker } from './checker'
import { BackgammonCube } from './cube'
import { BackgammonDieValue } from './dice'
import { IntegerRange } from './generics'
import { BackgammonPlay } from './play'
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
  | 'moving'

type _BaseBgGame = {
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
  activeColor?: BackgammonColor
  activePlay?: BackgammonPlay
  initialize?: (players: BackgammonPlayers) => void
  rollForStart?: (game: GameInitializing) => GameRolling
  roll?: (game: GameRolling) => GameMoving
  move?: (
    game: GameMoving,
    checker: BackgammonChecker,
    dieValue: BackgammonDieValue
  ) => GameMoving | GameRolling //
}

export type _Game = _BaseBgGame & {
  id: string
  stateKind: BackgammonGameStateKind
}

export interface GameInitializing extends _Game {
  stateKind: 'initializing'
}
export interface GameRollingForStart extends _Game {
  stateKind: 'rolling-for-start'
  rollForStart: (game: GameInitializing) => GameRolling
}

export interface GameRolling extends _Game {
  stateKind: 'rolling'
  activeColor: BackgammonColor
}

export interface GameMoving extends _Game {
  stateKind: 'moving'
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

// export interface GameOver extends _Game {
//   id: string
//   kind: 'over'
// }

// export interface GameDoubleProposed extends _Game {
//   id: string
//   kind: 'double-proposed'
//   activeColor: BackgammonColor
// }

// export interface GameResignationProposed extends _Game {
//   id: string
//   kind: 'resignation-proposed'
//   activeColor: BackgammonColor
// }
