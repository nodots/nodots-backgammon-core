import { BearOff } from '.'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../../../Board/imports'
import {
  BackgammonDiceInactive,
  BackgammonDiceStateKind,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../types'

describe('BearOff', () => {
  const diceId: string = generateId()
  const board = Board.initialize(BOARD_IMPORT_BOTH_BEAROFF)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll: BackgammonRoll = [1, 1]
  let dice = Dice.initialize(color) as BackgammonDiceInactive
  const diceStateKind: BackgammonDiceStateKind = 'rolled'
  const rolledDice = {
    ...dice,
    id: diceId,
    stateKind: diceStateKind,
    currentRoll,
    total: 2,
  }
  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    stateKind: 'moving',
    dice: rolledDice,
    direction,
    pipCount: 167,
  }

  let move: BackgammonMoveReady = {
    id: '1',
    player,
    stateKind: 'ready',
    dieValue: currentRoll[0],
    possibleMoves: Board.getPossibleMoves(board, player, currentRoll[0]),
  }

  const origin = board.points.find((p) => p.position[direction] === 1)!

  it('should initialize the BearOff move', () => {
    const m: BackgammonMoveReady = {
      id: '1',
      player,
      stateKind: 'ready',
      moveKind: 'bear-off',
      origin,
      dieValue: currentRoll[0],
      possibleMoves: Board.getPossibleMoves(board, player, currentRoll[0]),
    }
    Board.displayAsciiBoard(board)

    // const moveResult = BearOff.move(board, m)
    // const completedMove = moveResult.move
    // if (completedMove.destination) {
    //   expect(completedMove).toBeDefined()
    //   expect(completedMove.id).toBeDefined()
    //   expect(completedMove.origin).toBeDefined()
    //   expect(completedMove.destination).toBeDefined()
    // } else {
    //   expect(completedMove).toBeDefined()
    //   expect(completedMove.id).toBeDefined()
    // }
  })
})
