import { BackgammonChecker } from './checker'
import { BackgammonDice } from './dice'
import { BackgammonPips } from './pip'

export type BackgammonPlayerStateKind = 'initializing' | 'ready' | 'moving'

export type BaseBgPlayer = {
  id?: string
  color?: BackgammonColor
  direction?: BackgammonMoveDirection
  dice?: BackgammonDice
  pipCount?: BackgammonPips
}

export type BackgammonPlayer = BaseBgPlayer & {
  stateKind: BackgammonPlayerStateKind
}

export interface BackgammonPlayerInitializing extends BackgammonPlayer {
  id: string
  stateKind: 'initializing'
  direction: BackgammonMoveDirection
}
export interface BackgammonPlayerReady extends BackgammonPlayer {
  id: string
  stateKind: 'ready'
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
}

export interface BackgammonPlayerMoving extends BackgammonPlayer {
  id: string
  stateKind: 'moving'
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
}

export type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]

export type BackgammonPlayerCheckers<
  T extends BackgammonChecker = BackgammonChecker
> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T]
