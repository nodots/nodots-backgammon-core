import { Game } from './index'
import { BackgammonPlayers } from '../../types/player'
import { GameStateError } from './error'
import { generateId, Player, randomBackgammonColor } from '..'
import { GameInitializing } from '../../types'

const player1: 

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterClockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
  const mockPlayers: BackgammonPlayers = [
    new Player({
      id: 'player1',
      direction: 'clockwise',
      color: clockwiseColor,
    }),
    new Player({
      id: 'player2',
      direction: 'counterClockwise',
      color: counterClockwiseColor,
    }),
  ]

  it('should throw an error if neither players nor gameId are provided', () => {
    expect(() => new Game({})).toThrow(GameStateError('Invalid state'))
  })

  it('should initialize the game with players', () => {
    const mockId = 'mockId'
    ;(generateId as jest.Mock).mockReturnValue(mockId)

    const game = new Game({ players: mockPlayers })

    expect(game.id).toBe(mockId)
    expect(game.stateKind).toBe('initializing')
    expect(game.players).toBe(mockPlayers)
    expect(game.board).toBeDefined()
    expect(game.cube).toBeDefined()
  })

  it('should throw an error for unimplemented initialization signature', () => {
    expect(() => new Game({ gameId: 'someGameId' })).toThrow(
      GameStateError('Unimplemented initialization signature for game')
    )
  })

  it('should roll for start and change state to rolling', () => {
    const mockColor = 'white'
    ;(randomBackgammonColor as jest.Mock).mockReturnValue(mockColor)

    const game = new Game({ players: mockPlayers })
    const gameInitializing: GameInitializing = {
      id: game.id,
      stateKind: 'initializing',
      players: mockPlayers,
      board: game.board,
      cube: game.cube,
    }

    const gameRolling = game.rollForStart(gameInitializing)

    expect(gameRolling.stateKind).toBe('rolling')
    expect(gameRolling.activeColor).toBe(mockColor)
  })
})
