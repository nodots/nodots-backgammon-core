import { Reenter } from '.'
import { Move } from '../..'
import { generateId, randomBackgammonColor } from '../../..'
import { BackgammonMove } from '../../../../types'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_REENTER } from '../../../Board/imports'

describe('Reenter', () => {
  const board = Board.initialize(BOARD_IMPORT_BOTH_REENTER)
  const color = randomBackgammonColor()
  it('should initialize the Reenter move', () => {
    let move: BackgammonMove = Move.initialize({
      player: {
        id: generateId(),
        color,
        direction: 'clockwise',
        stateKind: 'moving',
        pipCount: 167,
        dice: {
          id: generateId(),
          color,
          stateKind: 'rolled',
          currentRoll: [4, 4],
          total: 8,
        },
      },
      dieValue: 4,
    })
    expect(Reenter.isA(board, move.player)).toBe(true)
    const reenter = Reenter.move(board, move)
    expect(reenter).toBeDefined()
    console.log(reenter)
  })
})
