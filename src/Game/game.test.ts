import { startGame } from '.'

describe('startGame', () => {
  it('should return a valid GameRollingForStart object', () => {
    const player1Id = 'player1'
    const player2Id = 'player2'
    const game = startGame(player1Id, player2Id)

    expect(game).toHaveProperty('id')
    expect(game).toHaveProperty('kind', 'rolling-for-start')
    expect(game).toHaveProperty('players')
    expect(game.players).toHaveLength(2)
    expect(game.players[0]).toHaveProperty('playerId', player1Id)
    expect(game.players[1]).toHaveProperty('playerId', player2Id)
    expect(game.players[0]).toHaveProperty('color')
    expect(game.players[1]).toHaveProperty('color')
    expect(game.players[0]).toHaveProperty('direction')
    expect(game.players[1]).toHaveProperty('direction')
    expect(game.players[0].color).not.toEqual(game.players[1].color)
    expect(game.players[0].direction).not.toEqual(game.players[1].direction)
    expect(game.players[0]).toHaveProperty('pipCount', 167)
    expect(game.players[1]).toHaveProperty('pipCount', 167)
    expect(game).toHaveProperty('board')
    expect(game).toHaveProperty('cube')
    expect(game).toHaveProperty('dice')
  })
})
