import { Reenter } from '.'
import { Move } from '../..'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import {
  BackgammonDiceRolled,
  BackgammonMove,
  BackgammonPlayerMoving,
} from '../../../types'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_REENTER } from '../../../Board/imports'

describe('Reenter', () => {
  const diceId: string = generateId()
  const board = Board.initialize(BOARD_IMPORT_BOTH_REENTER)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll = Dice._RandomRoll
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

  const origin = board.bar[direction]

  let move: BackgammonMove = {
    id: '1',
    player,
    stateKind: 'ready',
    dieValue: currentRoll[0],
  }

  it('should initialize the Reenter move', () => {
    const moveResult = Reenter.move(board, move)
    move = moveResult.move
    expect(move).toBeDefined()
    expect(move.id).toBeDefined()
    expect(move.stateKind).toBe('ready')
    expect(move.player).toBe(player)
  })
})
