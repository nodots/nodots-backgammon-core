import { BearOff } from '.'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import {
  BackgammonDiceRolled,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../types'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../../../Board/imports'

describe('BearOff', () => {
  const diceId: string = generateId()
  const board = Board.initialize(BOARD_IMPORT_BOTH_BEAROFF)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll: BackgammonRoll = [1, 1]
  const dice = Dice.initialize(
    color,
    'rolled',
    diceId,
    currentRoll
  ) as BackgammonDiceRolled

  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    stateKind: 'moving',
    dice,
    direction,
    pipCount: 167,
  }

  let move: BackgammonMoveReady = {
    id: '1',
    player,
    stateKind: 'ready',
    dieValue: currentRoll[0],
  }

  const origin = board.points.find((p) => p.position[direction] === 1)!

  it('should initialize the BearOff move', () => {
    const m: BackgammonMoveInProgress = {
      id: '1',
      player,
      stateKind: 'in-progress',
      moveKind: 'bear-off',
      origin,
      dieValue: currentRoll[0],
    } as BackgammonMoveInProgress

    const moveResult = BearOff.move(board, m)
    const completedMove = moveResult.move
    if (completedMove.destination) {
      expect(completedMove).toBeDefined()
      expect(completedMove.id).toBeDefined()
      expect(completedMove.origin).toBeDefined()
      expect(completedMove.destination).toBeDefined()
    } else {
      expect(completedMove).toBeDefined()
      expect(completedMove.id).toBeDefined()
    }
  })
})
