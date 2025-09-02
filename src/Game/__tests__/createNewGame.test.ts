import { describe, expect, it } from '@jest/globals'
import { Game } from '../index'

describe('Game.createNewGame', () => {
  it('should create a game that progresses to rolling-for-start state', () => {
    const game = Game.createNewGame('player1', 'player2', false, false)

    expect(game.stateKind).toBe('rolling-for-start')
    expect(game.activeColor).toBeUndefined()
    expect(game.activePlayer).toBeUndefined()
    expect(game.inactivePlayer).toBeUndefined()
  })
})
