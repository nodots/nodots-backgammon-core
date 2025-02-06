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
  id: string
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
}

type Player = BasePlayer & {
  stateKind: BackgammonPlayerStateKind
}

export type BackgammonPlayerInactive = Player & {
  stateKind: 'inactive'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRollingForStart = Player & {
  stateKind: 'rolling-for-start'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRolledForStart = Player & {
  stateKind: 'rolled-for-start'
  dice: BackgammonDiceInactive
}

export type BackgammonPlayerRolling = Player & {
  stateKind: 'rolling'
  dice: BackgammonDiceReady
}

export type BackgammonPlayerRolled = Player & {
  stateKind: 'rolled'
  dice: BackgammonDiceRolled
}

export type BackgammonPlayerMoving = Player & {
  stateKind: 'moving'
  dice: BackgammonDiceRolled
}

export type BackgammonPlayerMoved = Player & {
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
