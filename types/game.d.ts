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
  | 'in-progress'
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

export type BackgammonGameInProgress = BackgammonGame & {
  stateKind: 'in-progress'
  activeColor: BackgammonColor
  activePlay?: BackgammonPlay
}

export type BackgammonGameCompleted = BackgammonGame & {
  stateKind: 'completed'
  winner: BackgammonPlayer // FIXME: Should probably be BackgammonPlayerWinner
}

export type BackgammonGame =
  | BackgammonGameRollingForStart
  | BackgamonGameInProgress
  | BackgammonGameCompleted
