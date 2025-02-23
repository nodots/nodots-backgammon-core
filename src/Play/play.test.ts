import { Play } from '.'
import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonPlay,
  BackgammonPlayerRolling,
  BackgammonPlayRolled,
} from '../../types'

describe('Play', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const board = Board.initialize()
  let dice = Dice.initialize(color)
  dice.stateKind = 'rolling'

  let player: BackgammonPlayerRolling = {
    id: '1',
    color,
    direction,
    stateKind: 'rolling',
    dice,
    pipCount: 167,
  }

  let play: BackgammonPlay = Play.roll({ player }) as BackgammonPlayRolled
  const moves = play.moves

  it('should initialize the play correctly', () => {
    player = play.player
    const { dice } = player
    expect(play).toBeDefined()
    // expect(play.id).toBeDefined()
    // expect(play.stateKind).toBe('rolled')
    // expect(player).toBe(player)
    // expect(player.color).toBe(color)
    // expect(player.direction).toBe(direction)
    // expect(dice).toBeDefined()
    // expect(player.pipCount).toBe(167)
    // expect(dice.stateKind).toBe('rolled')
    // expect(moves).toBeDefined()
    // expect(moves.length).toBeGreaterThan(0)
    // expect(moves.length).toBeLessThanOrEqual(4)
  })

  // const validMoves = Play.getValidMoves(board, play.moves)
  // console.log('VALID_MOVES:', validMoves)

  // it('should get the valid moves', () => {
  //   expect(validMoves).toBeDefined()
  //   expect(validMoves.size).toBeGreaterThan(0)
  // })
  // it('should set the play to ready', () => {
  //   play = Play.setReady(play)
  //   expect(play.stateKind).toBe('ready')
  // })
})
