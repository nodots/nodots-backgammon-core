import { BackgammonChecker } from './checker'
import { BackgammonDice, BackgammonDieValue } from './dice'
import { GameMoving } from './game'
import { BackgammonPips } from './pip'

export type BackgammonPlayerStateKind = 'initializing' | 'ready' | 'moving'

export type BaseBgPlayer = {
  id?: string
  color?: BackgammonColor
  direction?: BackgammonMoveDirection
  dice?: BackgammonDice
  pipCount?: BackgammonPips
  move?: (
    gameState: GameMoving,
    checkerId: string,
    dieValue: BackgammonDieValue
  ) => GameMoving
}

export type BackgammonPlayer = BaseBgPlayer & {
  stateKind: BackgammonPlayerStateKind
}

export interface BackgammonPlayerInitializing extends BackgammonPlayer {
  id: string
  stateKind: 'initializing'
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
  stateKind: 'moving'
  move: (
    gameState: GameMoving,
    checkerId: string,
    dieValue: BackgammonDieValue
  ) => GameMoving
}

export type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]

export type BackgammonPlayerCheckers<
  T extends BackgammonChecker = BackgammonChecker
> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T]
