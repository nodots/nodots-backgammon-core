import {
  BackgammonCube,
  BackgammonCubeDoubled,
  BackgammonCubeInitialized,
  BackgammonCubeMaxxed,
  BackgammonCubeStateKind,
  BackgammonCubeValue,
  BackgammonPlayer,
  BackgammonPlayers,
  CubeProps,
} from '@nodots-llc/backgammon-types'
import { generateId } from '..'

// CubeProps is now imported from @nodots-llc/backgammon-types

export class Cube {
  id!: string
  stateKind: BackgammonCubeStateKind = 'initialized'
  value: BackgammonCubeValue = undefined
  owner: BackgammonPlayer | undefined = undefined

  // Overload returns initialized cube type
  public static initialize(cube?: CubeProps): BackgammonCubeInitialized
  public static initialize(cube?: CubeProps): BackgammonCubeInitialized {
    const cfg = cube ?? {}
    let { id, stateKind } = cfg
    const { value, owner } = cfg
    id ??= generateId()
    stateKind ??= 'initialized'
    return {
      id,
      stateKind,
      value,
      owner: owner ?? undefined,
    } as BackgammonCubeInitialized
  }

  public static double = function doubleCube(
    cube: BackgammonCube,
    player: BackgammonPlayer,
    players: BackgammonPlayers
  ): BackgammonCubeDoubled | BackgammonCubeMaxxed {
    if (cube.owner !== undefined && cube.owner !== player)
      throw Error(
        `Player ${JSON.stringify(player)} does not own Cube ${JSON.stringify(
          cube
        )}`
      )

    const owner = players.find((p) => p.id !== player.id)
    const newValue = cube.value ? ((cube.value * 2) as BackgammonCubeValue) : 2
    const stateKind = newValue === 64 ? 'maxxed' : 'doubled'

    return stateKind === 'doubled'
      ? ({
          ...cube,
          value: newValue,
          stateKind,
          owner,
        } as BackgammonCubeDoubled)
      : ({
          ...cube,
          value: 64,
          stateKind,
          owner: undefined,
        } as BackgammonCubeMaxxed)
  }
}
