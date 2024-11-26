import { BackgammonCube, BackgammonCubeValue } from '../../types'

export class Cube implements BackgammonCube {
  value = 2 as BackgammonCubeValue
  owner = undefined

  double = (cube: BackgammonCube): BackgammonCubeValue => {
    let cubeValue = cube.value as number
    cubeValue = cubeValue === 64 ? cube.value : cube.value * 2
    return cubeValue as BackgammonCubeValue
  }
}
