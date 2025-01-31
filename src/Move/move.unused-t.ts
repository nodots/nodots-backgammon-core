import {
  Board,
  Player,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import { BackgammonBoard, BackgammonDieValue } from '../../types'
import { Play } from '../Play'
import { Move } from './index'

describe('Move', () => {
  let board: BackgammonBoard
  let play: Play
  const playerInitializing = Player.initialize(
    randomBackgammonColor(),
    randomBackgammonDirection()
  )

  beforeEach(() => {
    board = Board.initialize()
    let dieValue: BackgammonDieValue
    const rolledPlayer = Player.roll({
      ...playerInitializing,
      stateKind: 'rolled',
    })
    play = Play.initialize(rolledPlayer)
  })

  test('initialize should create a new move', () => {
    const move = Move.initialize(rolledPlayer, dieValue)
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
