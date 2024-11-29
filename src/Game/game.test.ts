import { Game, GameProps } from '.'
import { BackgammonPips, PlayerReady } from '../../types'

const PLAYER1: PlayerReady = {
  id: 'player1',
  stateKind: 'ready',
  color: 'black',
  direction: 'clockwise',

  pipCount: 167 as BackgammonPips,
}

const PLAYER2: PlayerReady = {
  id: 'player2',
  stateKind: 'ready',
  color: 'white',
  direction: 'counterclockwise',
  dice: { kind: 'ready' },
  pipCount: 167 as BackgammonPips,
}

describe('Game', () => {
  it('should create a new game', () => {
    const game = new Game({
      players: [PLAYER1, PLAYER2],
    } as GameProps)
    expect(game).toBeDefined()
  })
})
