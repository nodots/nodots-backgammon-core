import {
  Board,
  Dice,
  Player,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonBoard,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonPlay,
  BackgammonPlayerMoving,
} from '../../types'
import { Play } from '../Play'
import { Move } from './index'
import { BOARD_IMPORT_DEFAULT } from '../Board/imports'

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

  // test('player should be able to move a valid checker', () => {
  //   const validMoves = Move.getValidMoves(board, play)
  //   expect(validMoves).toBeDefined()
  //   expect(validMoves.size).toBeGreaterThan(0)
  //   const randomMove = validMoves.values().next().value
  //   console.log('randomMove', randomMove)
  //   // const point = board.points[0]
  //   // point.checkers = [{ id: '1', color: player.color }]

  //   // const move = Move.initialize(player, dieValue)
  //   // const movingMove = Move.moving(move, point)

  //   // expect(movingMove.stateKind).toBe('moving')
  //   // expect(movingMove.origin).toBe(point)
  //   // expect(movingMove.destination).toBeUndefined()
  // })
})
