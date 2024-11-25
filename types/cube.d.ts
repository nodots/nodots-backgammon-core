import { BackgammonPlayer } from './player'

export type BackgammonCubeValue = 2 | 4 | 8 | 16 | 32 | 64

export type BackgammonCubeOwner = BackgammonPlayer | undefined

export interface BackgammonCube {
  value: BackgammonCubeValue
  owner: BackgammonCubeOwner
}
