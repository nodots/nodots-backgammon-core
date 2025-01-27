import { generateId } from '..'
import {
  BackgammonCube,
  BackgammonCubeStateKind,
  BackgammonCubeValue,
  BackgammonPlayer,
  BackgammonPlayerInactive,
  BackgammonPlayerRolled,
  BackgammonPlayers,
} from '../../types'

export interface CubeProps {
  id?: string
  stateKind?: BackgammonCubeStateKind
  value?: BackgammonCubeValue
  owner?: BackgammonPlayer
}
export class Cube {
  id!: string
  stateKind: BackgammonCubeStateKind = 'initialized'
  value: BackgammonCubeValue | undefined = undefined
  owner: BackgammonPlayer | undefined = undefined

  public static initialize({
    id,
    stateKind,
    value,
    owner,
  }: CubeProps): BackgammonCube {
    if (!id) {
      id = generateId()
    }
    if (!stateKind) {
      stateKind = 'initialized' // FIXME. Should not be necessary
    }
    return {
      id,
      stateKind,
      value,
      owner,
    }
  }

  public static double(
    cube: BackgammonCube,
    player: BackgammonPlayer,
    players: BackgammonPlayers
  ): BackgammonCube {
    let value = cube.value ? cube.value : 2
    value = value < 64 ? value : 64
    const stateKind = value < 64 ? 'doubled' : 'maxxed'
    if (cube.owner !== undefined && cube.owner !== player)
      throw Error(
        `Player ${JSON.stringify(player)} does not own Cube ${JSON.stringify(
          cube
        )}`
      )

    const owner = players.find((p) => p !== player)

    return {
      ...cube,
      stateKind,
      owner,
      value,
    }
  }
}
