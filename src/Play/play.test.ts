import { Board, Dice, Player } from '..'
import { Play } from './index'
import {
  BackgammonCheckercontainerImport,
  BackgammonColor,
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
} from '../types'

describe('Play', () => {
  test('initialize', () => {
    // Create a simple board setup with only 1 checker per point
    const boardImport: BackgammonCheckercontainerImport[] = [
      {
        position: { clockwise: 6, counterclockwise: 19 },
        checkers: { qty: 1, color: 'white' },
      },
      {
        position: { clockwise: 19, counterclockwise: 6 },
        checkers: { qty: 1, color: 'black' },
      },
    ]

    const board = Board.initialize(boardImport)
    const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
    const player = Player.initialize(
      'white',
      'clockwise',
      inactiveDice,
      undefined,
      'rolling'
    ) as BackgammonPlayerRolling

    // Roll the player to get a rolled state
    const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled

    // Initialize the play with the rolled player
    const play = Play.initialize(board, rolledPlayer)

    expect(play).toBeDefined()
    expect(play.stateKind).toBe('rolled')
    expect(play.moves).toBeDefined()
    expect(Array.from(play.moves).length).toBeGreaterThan(0)
  })
})
