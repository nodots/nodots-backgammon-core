import { BackgammonDice } from './dice'
import { BackgammonChecker } from './checker'
import { BackgammonDieValue } from './dice'
import { GameMoving, GameRolling } from './game'
import { BackgammonPips } from './pip'

export type BackgammonPlayerStateKind = 'ready' | 'moving'

type _BaseBgPlayer = {
  color: BackgammonColor
  direction: BackgammonMoveDirection
  dice: BackgammonDice
  pipCount: BackgammonPips
}

export type BackgammonPlayer = _BaseBgPlayer & {
  id: string
  stateKind: BackgammonPlayerStateKind
  move?: (
    gameState: GameMoving,
    checkerId: string,
    dieValue: BackgammonDieValue
  ) => GameMoving
}

export interface PlayerReady extends BackgammonPlayer {
  stateKind: 'ready'
  roll: () => BackgammonRoll
}
export interface PlayerMoving extends BackgammonPlayer {
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
