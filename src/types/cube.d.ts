import { BackgammonPlayer, BackgammonPlayers } from './player'

export type BackgammonCubeValue = undefined | 2 | 4 | 8 | 16 | 32 | 64
export const BackgammonCubeValues: BackgammonCubeValue[] = [
  undefined,
  2,
  4,
  8,
  16,
  32,
  64,
]
export type BackgammonCubeStateKind = 'initialized' | 'doubled' | 'maxxed'

type BaseCube = {
  id: string
  owner: BackgammonCubeOwner | undefined
  value: BackgammonCubeValue | undefined
}

type BackgammonCube = BaseCube & {
  stateKind: BackgammonCubeStateKind
}

export type BackgammonCubeInitialized = BackgammonCube & {
  stateKind: 'initialized'
  owner: undefined
  value: undefined
}

export type BackgammonCubeDoubled = BackgammonCube & {
  stateKind: 'doubled'
  owner: BackgammonPlayer
  value: BackgammonCubeValue
}

export type BackgammonCubeMaxxed = BackgammonCube & {
  stateKind: 'maxxed'
  owner: undefined
  value: 64
}

export type BackgammonCube =
  | BackgammonCubeInitialized
  | BackgammonCubeDoubled
  | BackgammonCubeMaxxed

export interface CubeProps {
  id?: string
  stateKind?: BackgammonCubeStateKind
  value?: BackgammonCubeValue
  owner?: BackgammonPlayer
}

export interface CubeClass {
  id: string
  stateKind: BackgammonCubeStateKind
  value: BackgammonCubeValue | undefined
  owner: BackgammonPlayer | undefined

  initialize: (cube?: CubeProps) => BackgammonCube
  double: (
    cube: BackgammonCube,
    player: BackgammonPlayer,
    players: BackgammonPlayers
  ) => BackgammonCubeDoubled | BackgammonCubeMaxxed
}
