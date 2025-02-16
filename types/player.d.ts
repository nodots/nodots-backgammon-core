import { BackgammonChecker } from './checker'
import {
  BackgammonDice,
  BackgammonDiceInactive,
  BackgammonDiceReady,
  BackgammonDiceRolled,
} from './dice'
import { BackgammonPips } from './pip'
import { BackgammonMoveDirection } from './game'

export type BackgammonPlayerStateKind =
  | 'inactive'
  | 'rolling-for-start'
  | 'rolled-for-start'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'moved'

type BasePlayer = {
  id?: string
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
}

type Player = BasePlayer & {
  stateKind: BackgammonPlayerStateKind
}

export type BackgammonPlayerInitializing = Player & {
  stateKind: 'initializing'
}

export type BackgammonPlayerInactive = Player & {
  id: string
  stateKind: 'inactive'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRollingForStart = Player & {
  id: string
  stateKind: 'rolling-for-start'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRolledForStart = Player & {
  id: string
  stateKind: 'rolled-for-start'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRolling = Player & {
  id: string
  stateKind: 'rolling'
  dice: BackgammonDiceReady
}

export type BackgammonPlayerRolled = Player & {
  id: string
  stateKind: 'rolled'
  dice: BackgammonDiceRolled
}

export type BackgammonPlayerMoving = Player & {
  id: string
  stateKind: 'moving'
  dice: BackgammonDiceRolled
}

export type BackgammonPlayerMoved = Player & {
  id: string
  stateKind: 'moved'
  dice: BackgammonDiceRolled
}

export type BackgammonPlayer =
  | BackgammonPlayerInactive
  | BackgammonPlayerRollingForStart
  | BackgammonPlayerRolledForStart
  | BackgammonPlayerRolling
  | BackgammonPlayerRolled
  | BackgammonPlayerMoving
  | BackgammonPlayerMoved

export type BackgammonPlayerActive =
  | BackgammonPlayerRollingForStart
  | BackgammonPlayerRolledForStart
  | BackgammonPlayerRolling
  | BackgammonPlayerRolled
  | BackgammonPlayerMoving
  | BackgammonPlayerMoved

export type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]

export type BackgammonPlayerCheckers<
  T extends BackgammonChecker = BackgammonChecker
> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T]
