import { BackgammonRoll } from './dice'
import { BackgammonPlayerMoving } from './player'

export type BackgammonPlayStateKind =
  | 'initializing'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'doubled'
  | 'completed'

type BaseBgPlay = {
  id: string
  player?: BackgammonPlayerMoving | BackgammonPlayerRolled
  roll?: BackgammonRoll
  moves?: BackgammonMoves
}

export interface BackgammonPlay extends BaseBgPlay {
  stateKind: BackgammonPlayStateKind
}
export interface PlayInitializing extends BackgammonPlay {
  stateKind: 'initializing'
  player: BackgammonPlayerMoving
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayRolling extends BackgammonPlay {
  stateKind: 'rolling'
  player: BackgammonPlayerRolling
  roll?: BackgammonRoll
  moves?: BackgammonMoves
}

export interface PlayRolled extends BackgammonPlay {
  stateKind: 'rolled'
  player: BackgammonPlayerRolled
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayDoubled extends BackgammonPlay {
  stateKind: 'doubled'
  player: BackgammonPlayerRolled
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayMoving extends BackgammonPlay {
  stateKind: 'moving'
  player: BackgammonPlayerMoving
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayMoved extends BackgammonPlay {
  stateKind: 'moved'
  player: BackgammonPlayerMoving
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export interface PlayCompleted extends BackgammonPlay {
  stateKind: 'completed'
  player: BackgammonPlayerMoved
  roll: BackgammonRoll
  moves: BackgammonMoves
}

export type BackgammonPlay =
  | PlayInitializing
  | PlayRolling
  | PlayRolled
  | PlayDoubled
  | PlayMoving
  | PlayMoved
  | PlayCompleted
