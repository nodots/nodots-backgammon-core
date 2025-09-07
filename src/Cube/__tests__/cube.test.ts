import { beforeAll, describe, expect, it } from '@jest/globals'
import {
  BackgammonCubeDoubled,
  BackgammonCubeInitialized,
  BackgammonPlayerInactive,
  BackgammonPlayerRolled,
  BackgammonPlayers,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Cube } from '..'
import { generateId, randomBackgammonColor } from '../..'

let cube: Cube
let players: BackgammonPlayers | undefined = undefined

describe('Cube', () => {
  beforeAll(() => {
    cube = Cube.initialize({})
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
    const player: BackgammonPlayerRolled = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'rolled',
      color: clockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: clockwiseColor,
        stateKind: 'rolled',
        currentRoll: [1, 2] as BackgammonRoll,
        total: 3,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }
    const opponent: BackgammonPlayerInactive = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'inactive',
      color: counterclockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: counterclockwiseColor,
        stateKind: 'inactive',
        currentRoll: undefined,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }

    players = [player, opponent]
  })

  it('should initialize the cube', () => {
    expect(cube.id).toBeDefined()
    expect(cube.stateKind).toBe('initialized')
    expect(cube.value).toBeUndefined()
    expect(cube.owner).toBeUndefined()
  })

  it('should set the value to 2 when it is doubled the first time', () => {
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'

    const player: BackgammonPlayerRolled = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'rolled',
      color: clockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: clockwiseColor,
        stateKind: 'rolled',
        currentRoll: [1, 2] as BackgammonRoll,
        total: 3,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }
    const opponent: BackgammonPlayerInactive = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'inactive',
      color: counterclockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: counterclockwiseColor,
        stateKind: 'inactive',
        currentRoll: undefined,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }

    players = [player, opponent]
    cube = Cube.double(cube as BackgammonCubeInitialized, player, players)
    expect(cube.value).toBe(2)
    expect(cube.owner).toBe(opponent)
  })

  it('should double the value each time until it reaches 64', () => {
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
    const player: BackgammonPlayerRolled = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'rolled',
      color: clockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: clockwiseColor,
        stateKind: 'rolled',
        currentRoll: [1, 2] as BackgammonRoll,
        total: 3,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }
    const opponent: BackgammonPlayerInactive = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'inactive',
      color: counterclockwiseColor,
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: counterclockwiseColor,
        stateKind: 'inactive',
        currentRoll: undefined,
      },
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 4,
    }
    cube = Cube.initialize({
      value: undefined,
    })
    players = [player, opponent]

    cube = Cube.double(cube as BackgammonCubeInitialized, player, players)
    expect(cube.value).toBe(2)
    expect(cube.owner).toBe(opponent)
    expect(cube.stateKind).toBe('doubled')
    cube = Cube.double(cube as BackgammonCubeDoubled, opponent, players)
    expect(cube.value).toBe(4)
    expect(cube.owner).toBe(player)
    expect(cube.stateKind).toBe('doubled')
    cube = Cube.double(cube as BackgammonCubeDoubled, player, players)
    expect(cube.value).toBe(8)
    expect(cube.owner).toBe(opponent)
    expect(cube.stateKind).toBe('doubled')
    cube = Cube.double(cube as BackgammonCubeDoubled, opponent, players)
    expect(cube.value).toBe(16)
    expect(cube.owner).toBe(player)
    cube = Cube.double(cube as BackgammonCubeDoubled, player, players)
    expect(cube.value).toBe(32)
    expect(cube.owner).toBe(opponent)
    cube = Cube.double(cube as BackgammonCubeDoubled, opponent, players)
    expect(cube.value).toBe(64)
    expect(cube.owner).toBe(undefined)
    expect(cube.stateKind).toBe('maxxed')
  })
})
