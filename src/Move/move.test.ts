import {
  Board,
  Dice,
  Player,
  randomBackgammonColor,
  randomBackgammonDirection,
  randomBoolean,
} from '..'
import { Move } from './index'
import {
  BackgammonBoard,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPoint,
  BackgammonRoll,
  MoveMoving,
  PlayMoving,
} from '../../types'
import { Play } from '../Play'

describe('Move', () => {
  let currentRoll: BackgammonRoll
  let board: BackgammonBoard
  let player: BackgammonPlayerMoving
  let dieValue: BackgammonDieValue
  let play: PlayMoving

  beforeEach(() => {
    currentRoll = [
      (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue,
      (Math.floor(Math.random() * 6) + 1) as BackgammonDieValue,
    ]

    board = Board.initialize()
    player = {
      id: '1',
      stateKind: 'moving',
      dice: { stateKind: 'rolled', currentRoll },
      color: randomBackgammonColor(),
      direction: randomBackgammonDirection(),
      pipCount: 167,
    }
    dieValue = randomBoolean() ? currentRoll[0] : currentRoll[1]
    play = Play.initialize(player, currentRoll)
  })

  test('initialize should create a new move', () => {
    const move = Move.initialize(player, dieValue)
    expect(move).toHaveProperty('id')
    expect(move.stateKind).toBe('initializing')
    expect(move.player).toBe(player)
    expect(move.dieValue).toBe(dieValue)
  })

  test('player should be able to move a valid checker', () => {
    const validMoves = Move.getValidMoves(board, play)
    expect(validMoves).toBeDefined()
    expect(validMoves.size).toBeGreaterThan(0)
    const randomMove = validMoves.values().next().value
    console.log('randomMove', randomMove)
    // const point = board.points[0]
    // point.checkers = [{ id: '1', color: player.color }]

    // const move = Move.initialize(player, dieValue)
    // const movingMove = Move.moving(move, point)

    // expect(movingMove.stateKind).toBe('moving')
    // expect(movingMove.origin).toBe(point)
    // expect(movingMove.destination).toBeUndefined()
  })
})
