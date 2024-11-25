import { BackgammonCube, BackgammonCubeValue } from '../../types'

export const buildCube = (): BackgammonCube => {
  return {
    value: 2,
    owner: undefined,
  }
}

export const double = (cube: BackgammonCube): BackgammonCubeValue => {
  let cubeValue = cube.value as number
  cubeValue = cubeValue === 64 ? cube.value : cube.value * 2
  return cubeValue as BackgammonCubeValue
}
