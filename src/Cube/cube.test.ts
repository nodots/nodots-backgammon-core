import { Cube } from '.'
import { Player, randomBackgammonColor, randomBoolean } from '..'
import {
  BackgammonCube,
  BackgammonCubeMaxxed,
  BackgammonPlayer,
  BackgammonPlayers,
} from '../../types'

describe('Cube', () => {
  let cube: BackgammonCube
  let player: BackgammonPlayer
  let players: BackgammonPlayers

  beforeEach(() => {
    cube = Cube.initialize({})
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
    const player1 = Player.initialize(clockwiseColor, 'clockwise')
    const player2 = Player.initialize(counterclockwiseColor, 'counterclockwise')
    players = [player1, player2]
    player = randomBoolean() ? player1 : player2
  })

  test('should initialize with value undefined', () => {
    expect(cube.value).toBeUndefined()
    expect(cube.owner).toBeUndefined()
  })

  test('should set the cube value to 2 on the first double', () => {
    cube = Cube.double(cube, player, players)
    expect(cube.value).toBe(2)
  })

  test('should not double beyond 64', () => {
    const cubeValues = [2, 4, 8, 16, 32, 64]
    let value = undefined
    for (let i = 0; i < cubeValues.length; i++) {
      value = Cube.double(cube, player, players)
    }
    expect(cube.value).toBeLessThanOrEqual(64) // Assuming 64 is the max value
  })

  test('should throw an error if doubled when value is at max', () => {
    const maxxedCube: BackgammonCubeMaxxed = {
      ...cube,
      stateKind: 'maxxed',
      owner: undefined,
      value: 64,
    }

    expect(() => Cube.double(maxxedCube, player, players)).toThrow(
      'Maximum value reached'
    )
  })
})
