import { BackgammonBoard } from './board'
import { BackgammonCube } from './cube'
import { IntegerRange } from './generics'
import { BackgammonPlay } from './play'
import { BackgammonPlayerActive, BackgammonPlayers } from './player'

export type BackgammonColor = 'black' | 'white'
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'
export type BackgammonPips = IntegerRange<1, 167>

export const MAX_PIP_COUNT = 167
export const CHECKERS_PER_PLAYER = 15

export type BackgammonGameStateKind =
  | 'rolling-for-start'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'completed'

type BaseGame = {
  id: string
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
  winner?: BackgammonPlayer
  activeColor?: BackgammonColor
  activePlay?: BackgammonPlay
}

type BackgammonGame = BaseGame & {
  stateKind: BackgammonGameStateKind
}

export type BackgammonGameRollingForStart = BackgammonGame & {
  stateKind: 'rolling-for-start'
}

export type BackgammonGameRolling = BackgammonGame & {
  stateKind: 'rolling'
  activeColor: BackgammonColor
}

export type BackgammonGameRolled = BackgammonGame & {
  stateKind: 'rolled'
  activeColor: BackgammonColor
  activePlay: PlayRolled
}

export type BackgammonGameMoving = BackgammonGame & {
  stateKind: 'moving'
  activeColor: BackgammonColor
  activePlay: BackgammonPlayerActive
}

export type BackgammonGameCompleted = BackgammonGame & {
  stateKind: 'completed'
  winner: BackgammonPlayer // FIXME: Should probably be BackgammonPlayerWinner
}

export type BackgammonGame =
  | BackgammonGameRollingForStart
  | BackgammonGameRolling
  | BackgammonGameMoving
  | BackgammonGameCompleted
