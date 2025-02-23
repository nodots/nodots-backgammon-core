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
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '../../../../types'
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
    const moveResult = BearOff.move(board, move, origin)
    const completedMove = moveResult.move as BackgammonMoveCompleted
    expect(completedMove).toBeDefined()
    expect(completedMove.id).toBeDefined()
    expect(completedMove.stateKind).toBe('ready')
    expect(completedMove.player).toBe(player)
  })
})
