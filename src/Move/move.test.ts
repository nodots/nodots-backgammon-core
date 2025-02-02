import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonPlayerMoving,
  BackgammonPoint,
} from '../../types'
import { BOARD_IMPORT_DEFAULT } from '../Board/imports'
import { Move } from './index'

describe('Move', () => {
  let board: BackgammonBoard
  let move: BackgammonMove
  const color = randomBackgammonColor()
  const d = Dice.initialize(color)
  const dice = Dice.roll(d)
  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    direction: randomBackgammonDirection(),
    stateKind: 'moving',
    pipCount: 167,
    dice,
  }
  beforeEach(() => {
    board = Board.initialize(BOARD_IMPORT_DEFAULT)
    move = Move.initialize({ player, dieValue: dice.currentRoll[0] })
  })

  test('initialize should create a new move', () => {
    expect(move).toHaveProperty('id')
    expect(move.player).toBe(player)
    expect(move.dieValue).toBe(player.dice.currentRoll[0])
  })
})

describe('Move.isPointOpen', () => {
  const checkercontainerId = 'checkercontainer1'
  const color = randomBackgammonColor()
  const opponentColor = color === 'white' ? 'black' : 'white'
  const direction = randomBackgammonDirection()
  const player: BackgammonPlayerMoving = {
    id: 'player1',
    color,
    direction,
    stateKind: 'moving',
    pipCount: 167,
    dice: {
      id: '1',
      color,
      stateKind: 'rolled',
      currentRoll: [4, 4],
      total: 8,
    },
  }
  let emptyPoint: BackgammonPoint = {
    id: 'openPoint',
    kind: 'point',
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: [],
  }
  let playerPoint: BackgammonPoint = {
    id: 'openPoint',
    kind: 'point',
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: [
      {
        id: 'checker1',
        color,
        checkercontainerId,
      },
      {
        id: 'checker2',
        color,
        checkercontainerId,
      },
    ],
  }
  let closedPoint: BackgammonPoint = {
    id: 'closedPoint',
    kind: 'point',
    position: {
      clockwise: 2,
      counterclockwise: 23,
    },
    checkers: [
      {
        id: 'checker1',
        color: opponentColor,
        checkercontainerId,
      },
      {
        id: 'checker2',
        color: opponentColor,
        checkercontainerId,
      },
    ],
  }
  let hitPoint: BackgammonPoint = {
    id: 'closedPoint',
    kind: 'point',
    position: {
      clockwise: 2,
      counterclockwise: 23,
    },
    checkers: [
      {
        id: 'checker1',
        color: opponentColor,
        checkercontainerId,
      },
    ],
  }

  test('should return true for an empty point', () => {
    expect(Move.isPointOpen(emptyPoint, player)).toBe(true)
  })
  test('should return true for a point with just the player`s checkers', () => {
    expect(Move.isPointOpen(playerPoint, player)).toBe(true)
  })
  test('should return false for a point with just the opponent`s checkers', () => {
    expect(Move.isPointOpen(closedPoint, player)).toBe(false)
  })
  test('should return true for a point with one opponent checker', () => {
    expect(Move.isPointOpen(hitPoint, player)).toBe(true)
  })
})
