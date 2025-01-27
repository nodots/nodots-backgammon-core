import { BackgammonRoll } from './dice'
import {
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
} from './player'

export type BackgammonPlayStateKind =
  | 'initializing'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'doubled'
  | 'completed'

type BasePlay = {
  id: string
  player: BackgammonPlayer
  roll: BackgammonRoll
  moves: BackgammonMoves
}

type Play = BasePlay & {
  stateKind: BackgammonPlayStateKind
}

export type BackgammonPlayRolling = Play & {
  stateKind: 'rolling'
  player: BackgammonPlayerRolling
}

export type BackgammonPlayRolled = Play & {
  stateKind: 'rolled'
  player: BackgammonPlayerRolled
}

export type BackgammonPlayDoubled = Play & {
  stateKind: 'doubled'
}

export type BackgammonPlayMoving = Play & {
  stateKind: 'moving'
  player: BackgammonPlayerMoving
}

export type BackgammonPlayMoved = Play & {
  stateKind: 'moved'
  player: BackgammonPlayerMoved
}

export type BackgammonPlayCompleted = Play & {
  stateKind: 'completed'
  player: BackgammonPlayerMoved
}

export type BackgammonPlay =
  | BackgammonPlayRolling
  | BackgammonPlayRolled
  | BackgammonPlayDoubled
  | BackgammonPlayMoving
  | BackgammonPlayMoved
  | BackgammonPlayCompleted
