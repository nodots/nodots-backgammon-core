import { Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonGame,
  BackgammonGameRollingForStart,
  BackgammonPlayer,
  BackgammonPlayers,
} from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  let game: BackgammonGame | undefined = undefined
  let player: BackgammonPlayer | undefined = undefined
  let opponent: BackgammonPlayer | undefined = undefined

  const players: BackgammonPlayers = [
    Player.initialize(clockwiseColor, 'clockwise'),
    Player.initialize(counterclockwiseColor, 'counterclockwise'),
  ]

  const gameRollingForStart = Game.initialize(
    players
  ) as BackgammonGameRollingForStart

  it('should initialize the game correctly', () => {
    expect(gameRollingForStart).toBeDefined()
    expect(gameRollingForStart!.id).toBeDefined()
    expect(gameRollingForStart!.players).toBeDefined()
    expect(gameRollingForStart!.players.length).toBe(2)
  })

  const gameRolledForStart = Game.rollForStart(gameRollingForStart)

  it('should correctly handle a roll for start', () => {
    expect(gameRolledForStart).toBeDefined()
    expect(gameRolledForStart.stateKind).toBe('in-progress')
    expect(gameRolledForStart.activeColor).toBeDefined()
    expect(gameRolledForStart.players.length).toBe(2)
    const player = Game.activePlayer(gameRolledForStart)
    expect(player).toBeDefined()
    expect(player!.stateKind).toBe('rolling')
    expect(player!.dice).toBeDefined()
    expect(player!.dice.stateKind).toBe('ready')
  })

  const gameRolled = Game.roll(gameRolledForStart)

  it('should correctly handle a roll', () => {
    const activePlay = gameRolled.activePlay
    expect(gameRolled).toBeDefined()
    expect(gameRolled.stateKind).toBe('in-progress')
    expect(gameRolled.activeColor).toBeDefined()
    expect(gameRolled.players.length).toBe(2)
    const player = Game.activePlayer(gameRolled)
    expect(player).toBeDefined()
    expect(player!.stateKind).toBe('rolled')
    expect(player!.dice).toBeDefined()
    expect(player!.dice.stateKind).toBe('rolled')
    expect(activePlay).toBeDefined()
    expect(activePlay!.playerId).toBe(player!.id)
  })
})
