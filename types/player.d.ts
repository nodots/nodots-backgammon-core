import { BackgammonPips } from './game'

export interface BackgammonPlayer {
  playerId: string
  color: BackgammonColor
  direction: BackgammonMoveDirection
  pipCount: BackgammonPips
}

export type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]
