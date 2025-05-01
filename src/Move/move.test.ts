import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonDiceRolled,
  BackgammonDieValue,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../types'
import { Move } from './index'

describe('Move', () => {
  const color = 'white'
  const direction = 'clockwise'
  const board = Board.initialize()
  let dice = Dice.initialize(color)
  const currentRoll: BackgammonRoll = [
    1 as BackgammonDieValue,
    1 as BackgammonDieValue,
  ]
  const rolledDice = {
    ...dice,
    stateKind: 'rolled',
    currentRoll,
    total: currentRoll[0] + currentRoll[1],
  } as BackgammonDiceRolled

  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    direction,
    stateKind: 'moving',
    dice: rolledDice,
    pipCount: 167,
  }
  const origin = board.points[5] // Use point 6 for white's starting position
  const destination = board.points[4] // Use point 5 for destination (one point forward)
  let move: BackgammonMoveReady = {
    id: '1',
    player,
    dieValue: currentRoll[0],
    stateKind: 'ready',
    origin,
    possibleMoves: Board.getPossibleMoves(board, player, currentRoll[0]),
  }

  it('should initialize the move correctly', () => {
    const newMove = Move.initialize({ move, origin })
    expect(newMove).toBeDefined()
    expect(newMove.id).toBeDefined()
    expect(newMove.stateKind).toBe('ready')
    expect(newMove.player).toBe(player)
  })

  const validPointToPoint: BackgammonMoveReady = {
    player,
    id: '1',
    dieValue: currentRoll[0],
    stateKind: 'ready',
    moveKind: 'point-to-point',
    origin,
    destination,
    possibleMoves: Board.getPossibleMoves(board, player, currentRoll[0]),
  }

  it('Should have possibleMoves', () => {
    expect(validPointToPoint.possibleMoves).toBeDefined()
    expect(validPointToPoint.possibleMoves.length).toBeGreaterThan(0)
    expect(validPointToPoint.destination).toBeDefined()
    expect(validPointToPoint.moveKind).toBe('point-to-point')
    expect(validPointToPoint.stateKind).toBe('ready')
  })

  const randomMoveSkeleton = validPointToPoint.possibleMoves[0]
  const randomMove = {
    ...randomMoveSkeleton,
  }

  it('Should have a random move', () => {
    expect(randomMove).toBeDefined()
    expect(randomMove.origin).toBeDefined()
    expect(randomMove.destination).toBeDefined()
  })

  const movePayload: BackgammonMoveReady = {
    ...validPointToPoint,
    id: '1',
    moveKind: 'point-to-point',
    stateKind: 'ready',
    player,
    dieValue: currentRoll[0],
    origin,
    destination,
    possibleMoves: validPointToPoint.possibleMoves,
  }
  const moveResult = Move.move(board, movePayload, false)

  it('Should move the checker', () => {
    expect(moveResult).toBeDefined()
    expect(moveResult.board).toBeDefined()
    expect(moveResult.move).toBeDefined()
    expect(moveResult.move.stateKind).toBe('completed')
    expect(moveResult.move.moveKind).toBe('point-to-point')
    expect(moveResult.move.origin).toBeDefined()
    expect(moveResult.move.destination).toBeDefined()
    expect(moveResult.move.origin).not.toBe(moveResult.move.destination)
  })

  // const moveInProgress: BackgammonMoveInProgress = {
  //   ...moveResult.move,
  //   stateKind: 'in-progress',
  //   moveKind: 'point-to-point',
  // }
  // const confirmedMove = Move.confirmMove(moveInProgress)

  // const completedPointToPointResult = Move.move(board, validPointToPoint, false)
  // const newBoard = completedPointToPointResult.board
})
