import { Reenter } from '.'
import {
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_REENTER } from '../../../Board/imports'
import {
  BackgammonDiceRolled,
  BackgammonMoveCompleted,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../types'

describe('Reenter', () => {
  const diceId: string = generateId()
  let board = Board.initialize(BOARD_IMPORT_BOTH_REENTER)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll: BackgammonRoll = [1, 2]
  const total = currentRoll[0] + currentRoll[1]
  const dice: BackgammonDiceRolled = {
    id: diceId,
    stateKind: 'rolled',
    color,
    currentRoll,
    total,
  }

  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    stateKind: 'moving',
    dice,
    direction,
    pipCount: 167,
  }

  let dieValue = currentRoll[0]

  let reenter: BackgammonMoveReady = {
    id: '1',
    player,
    stateKind: 'ready',
    moveKind: 'reenter',
    dieValue,
    origin: board.bar[direction],
    destination: board.points[0],
    possibleMoves: Board.getPossibleMoves(board, player, dieValue),
  }

  const reenterResult = Reenter.move(board, reenter)
  board = reenterResult.board
  const move = reenterResult.move as BackgammonMoveCompleted

  it('should return a BackgammonMoveResult', () => {
    expect(reenterResult).toHaveProperty('board')
    expect(reenterResult).toHaveProperty('move')
    // console.log('reenterResult move:', move)
    // Board.displayAsciiBoard(board)
  })
})
