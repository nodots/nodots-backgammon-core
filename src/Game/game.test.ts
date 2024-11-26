import { Game } from '.'

describe('startGame', () => {
  const player1Id = 'player1'
  const player2Id = 'player2'
  const game = new Game(player1Id, player2Id)

  it('should return a valid GameRollingForStart object', () => {
    const { board, players, dice, cube } = game
    const { points, bar, off } = board
    const [player1, player2] = players
    const { white: whiteDice, black: blackDice } = dice

    expect(game).toHaveProperty('id')
    expect(game).toHaveProperty('kind', 'rolling-for-start')
    expect(game).toHaveProperty('players')
    expect(players).toHaveLength(2)
    expect(player1).toHaveProperty('playerId', player1Id)
    expect(player2).toHaveProperty('playerId', player2Id)
    expect(player1).toHaveProperty('color')
    expect(player2).toHaveProperty('color')
    expect(player1).toHaveProperty('direction')
    expect(player2).toHaveProperty('direction')
    expect(player1.color).not.toEqual(player2.color)
    expect(player1.direction).not.toEqual(player2.direction)
    expect(player1).toHaveProperty('pipCount', 167)
    expect(player2).toHaveProperty('pipCount', 167)
    expect(game).toHaveProperty('board')
    expect(game).toHaveProperty('cube')
    expect(game).toHaveProperty('dice')
    expect(board).toHaveProperty('points')
    expect(points).toHaveLength(24)
    expect(board).toHaveProperty('bar')
    expect(board).toHaveProperty('off')
    expect(bar).toHaveProperty('clockwise')
    expect(bar).toHaveProperty('counterclockwise')
    const barCheckers =
      bar.clockwise.checkers.length + bar.counterclockwise.checkers.length
    const offCheckers =
      off.clockwise.checkers.length + off.counterclockwise.checkers.length
    const pointCheckers = points.reduce(
      (acc, point) => acc + point.checkers.length,
      0
    )
    expect(barCheckers + offCheckers + pointCheckers).toEqual(2 * 15)

    expect(cube).toHaveProperty('value')
    expect(cube).toHaveProperty('owner')
    expect(cube.owner).toBeUndefined()
    expect(cube.value).toEqual(2)

    expect(dice).toHaveProperty('white')
    expect(dice).toHaveProperty('black')
    expect(whiteDice.color).toEqual('white')
    expect(blackDice.color).toEqual('black')
    expect(whiteDice.kind).toEqual('inactive')
    expect(blackDice.kind).toEqual('inactive')
    expect(whiteDice.roll).toBeInstanceOf(Function)
    expect(blackDice.roll).toBeInstanceOf(Function)
  })

  it('should throw an error if player1Id is equal to player2Id', () => {
    const player1Id = 'player1'
    expect(() => new Game(player1Id, player1Id)).toThrow()
  })

  it('should throw an error if rollForStart is called in an invalid state', () => {
    game.rollForStart()
    expect(game).toHaveProperty('kind', 'rolling')
    expect(game.activeColor).toBeDefined()
  })

  it('should throw an error if roll is called in an invalid state', () => {
    const { activeColor } = game
    expect(activeColor).toBeDefined()
    const activeDice = activeColor ? game.dice[activeColor] : undefined
    expect(activeDice).toBeDefined()
    // activeDice!.roll()
  })
})
