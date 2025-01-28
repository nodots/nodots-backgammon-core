import { BackgammonChecker } from './checker'
import {
  BackgammonDice,
  BackgammonDiceInactive,
  BackgammonDiceRolled,
} from './dice'
import { BackgammonPips } from './pip'
import { BackgammonMoveDirection } from './game'

export type BackgammonPlayerStateKind =
  | 'inactive'
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

export type BackgammonPlayer =
  | BackgammonPlayerInactive
  | BackgammonPlayerRolling
  | BackgammonPlayerRolled
  | BackgammonPlayerMoving

export type BackgammonPlayerActive =
  | BackgammonPlayerRolling
  | BackgammonPlayerRolled
  | BackgammonPlayerMoving

export type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]

export type BackgammonPlayerCheckers<
  T extends BackgammonChecker = BackgammonChecker
> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T]
