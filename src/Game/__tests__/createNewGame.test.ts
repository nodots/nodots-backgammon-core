import { describe, expect, it } from '@jest/globals'
import { Game } from '../index'

describe('Game.createNewGame', () => {
  it('should create a game that progresses to rolling-for-start state', () => {
    const game = Game.createNewGame(
      { userId: 'player1', isRobot: false },
      { userId: 'player2', isRobot: false }
    )

    expect(game.stateKind).toBe('rolling-for-start')
    expect(game.activeColor).toBeUndefined()
    expect(game.activePlayer).toBeUndefined()
    expect(game.inactivePlayer).toBeUndefined()
  })
})
