import { Game } from './index'
import { BackgammonPlayers } from '../../types/player'
import { generateId, Player, randomBackgammonColor } from '..'
import { GameInitializing } from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterClockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
  const mockPlayers: BackgammonPlayers = [
    { id: generateId(), color: clockwiseColor } as Player,
    { id: generateId(), color: counterClockwiseColor } as Player,
  ]

  it('should initialize the game with players', () => {
    const game = new Game(mockPlayers)

    expect(game.stateKind).toBe('initializing')
    expect(game.players).toBe(mockPlayers)
    expect(game.board).toBeDefined()
    expect(game.cube).toBeDefined()
  })

  it('should roll for start', () => {
    const game = new Game(mockPlayers) as GameInitializing
    const rollingGame = game.rollForStart(game)

    expect(rollingGame.stateKind).toBe('rolling')
    expect(rollingGame.activeColor).toBeDefined()
  })
})
