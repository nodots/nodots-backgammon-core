import { BackgammonBoard } from './board'
import { BackgammonCube } from './cube'
import { IntegerRange } from './generics'
import { BackgammonPlay, BackgammonPlayMoving } from './play'
import {
  BackgammonPlayerActive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayers,
  BackgammonPlayerWinner,
} from './player'

export type BackgammonColor = 'black' | 'white'
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'
export type BackgammonPips = IntegerRange<1, 167>

export const MAX_PIP_COUNT = 167
export const CHECKERS_PER_PLAYER = 15

export type BackgammonGameStateKind =
  | 'rolling-for-start'
  | 'rolled-for-start'
  | 'rolling'
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

export type BackgammonGameRolledForStart = BackgammonGame & {
  stateKind: 'rolled-for-start'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerRolling
  inactivePlayer: BackgammonPlayerInactive
}

export type BackgammonGameRolling = BackgammonGame & {
  stateKind: 'rolling'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerActive
  inactivePlayer: BackgammonPlayerInactive
}

export type BackgammonGameMoving = BackgammonGame & {
  stateKind: 'moving'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerActive
  inactivePlayer: BackgammonPlayerInactive
}

export type BackgammonGameCompleted = BackgammonGame & {
  stateKind: 'completed'
  winner: BackgammonPlayerWinner
}

export type BackgammonGame =
  | BackgammonGameRollingForStart
  | BackgammonGameRolledForStart
  | BackgammonGameRolling
  | BackgammonGameMoving
  | BackgammonGameCompleted
