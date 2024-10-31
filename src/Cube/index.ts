import { CubeValue, NodotsCube } from '../../@types'

export const buildCube = (): NodotsCube => {
  return {
    value: 2,
    owner: undefined,
  }
}

export const double = (cube: NodotsCube): CubeValue => {
  let cubeValue = cube.value as number
  cubeValue = cubeValue === 64 ? cube.value : cube.value * 2
  return cubeValue as CubeValue
}
