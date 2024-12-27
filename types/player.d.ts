import { BackgammonChecker } from './checker'
import { BackgammonDice, BackgammonDieValue } from './dice'
import { GameMoving } from './game'
import { BackgammonPips } from './pip'

export type BackgammonPlayerStateKind = 'ready' | 'moving'

export type BaseBgPlayer = {
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
  roll: () => BackgammonRoll
  switchDice: () => BackgammonRoll
  move?: (
    gameState: GameMoving,
    checkerId: string,
    dieValue: BackgammonDieValue
  ) => GameMoving
}

export type BackgammonPlayer = BaseBgPlayer & {
  id: string
  stateKind: BackgammonPlayerStateKind
}

export interface BackgammonPlayerReady extends BackgammonPlayer {
  stateKind: 'ready'
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
