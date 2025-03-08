import { PointToPoint } from '.'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import { Board } from '../../../Board'
import { BOARD_IMPORT_DEFAULT } from '../../../Board/imports'
import {
  BackgammonMoveCompleted,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../types'

describe('PointToPoint', () => {
  const diceId: string = generateId()
  let board = Board.initialize(BOARD_IMPORT_DEFAULT)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll: BackgammonRoll = [1, 5]
  const total = currentRoll[0] + currentRoll[1]
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
      total,
    },
    direction,
    pipCount: 167,
  }

  const origin = board.points.find((p) => p.position[direction] === 24)!

  let validMove: BackgammonMoveReady = {
    id: '1',
    player,
    stateKind: 'ready',
    dieValue,
    origin,
    possibleMoves: Board.getPossibleMoves(board, player, dieValue),
  }

  const moveResult = PointToPoint.move(
    board,
    validMove,
    origin
  ) as BackgammonMoveResult

  it('should return a BackgammonMoveResult', () => {
    console.log('FUCKIG MOVE RESULT', moveResult)

    expect(moveResult).toHaveProperty('board')
    expect(moveResult).toHaveProperty('move')
  })
})
