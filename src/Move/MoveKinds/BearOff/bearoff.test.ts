import { BearOff } from '.'
import { Move } from '../..'
import { generateId, randomBackgammonColor } from '../../..'
import { BackgammonMove } from '../../../../types'
import { Board } from '../../../Board'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../../../Board/imports'

describe('BearOff', () => {
  const board = Board.initialize(BOARD_IMPORT_BOTH_BEAROFF)
  const color = randomBackgammonColor()
  it('should initialize the bear off move', () => {
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
    const bearOff = BearOff.move(board, move)
    expect(bearOff).toBeDefined()
  })
})
