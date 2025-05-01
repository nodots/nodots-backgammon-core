import { PointToPoint } from '.'
import { Dice, generateId } from '../../..'
import { Board } from '../../../Board'
import { BOARD_IMPORT_DEFAULT } from '../../../Board/imports'
import {
  BackgammonDieValue,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../types'

describe('PointToPoint', () => {
  const diceId: string = generateId()
  let board = Board.initialize(BOARD_IMPORT_DEFAULT)
  const color = 'white'
  const direction = 'clockwise'
  const currentRoll: BackgammonRoll = [
    1 as BackgammonDieValue,
    4 as BackgammonDieValue,
  ]
  const dieValue = currentRoll[0]
  const dice: Dice = {
    id: diceId,
    color,
    currentRoll,
    stateKind: 'rolled',
  }
  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    stateKind: 'moving',
    dice: {
      ...dice,
      color,
      stateKind: 'rolled',
      currentRoll,
      total: currentRoll[0] + currentRoll[1],
    },
    direction,
    pipCount: 167,
  }

  const origin = board.points[5] // Use point 6 for white's starting position
  const destination = board.points[4] // Use point 5 for destination (one point forward)

  let validMove: BackgammonMoveReady = {
    id: '1',
    player,
    stateKind: 'ready',
    moveKind: 'point-to-point',
    dieValue,
    origin,
    destination,
    possibleMoves: Board.getPossibleMoves(board, player, dieValue),
  }

  const moveResult = PointToPoint.move(board, validMove) as BackgammonMoveResult
  it('should return a BackgammonMoveResult', () => {
    expect(moveResult).toHaveProperty('board')
    expect(moveResult).toHaveProperty('move')
    expect(moveResult.move.stateKind).toBe('completed')
    expect(moveResult.move.moveKind).toBe('point-to-point')
    expect(moveResult.move.origin).toBeDefined()
    expect(moveResult.move.destination).toBeDefined()
    expect(moveResult.move.origin).not.toBe(moveResult.move.destination)
  })
})
