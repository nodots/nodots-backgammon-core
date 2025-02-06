import { Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonGame,
  BackgammonGameRollingForStart,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
  BackgammonPlayers,
} from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  const players: BackgammonPlayers = [
    Player.initialize({
      id: '1',
      stateKind: 'rolled-for-start',
      dice: {
        id: '1',
        stateKind: 'inactive',
        color: clockwiseColor,
      },
      color: clockwiseColor,
      direction: 'clockwise',
      pipCount: 167,
    }),
    Player.initialize({
      id: '2',
      stateKind: 'inactive',
      dice: {
        id: '2',
        stateKind: 'inactive',
        color: counterclockwiseColor,
      },
      color: counterclockwiseColor,
      direction: 'counterclockwise',
      pipCount: 167,
    }),
  ]

  const gameInititalized = Game.initialize(players)

  it('should initialize the game correctly', () => {
    expect(gameInititalized).toBeDefined()
    expect(gameInititalized.id).toBeDefined()
    expect(gameInititalized.stateKind).toBe('rolling-for-start')
    expect(gameInititalized.players).toBeDefined()
    expect(gameInititalized.players.length).toBe(2)
  })

  const gameRolledForStart = Game.rollForStart(gameInititalized)

  it('should correctly handle a roll for start', () => {
    expect(gameRolledForStart.stateKind).toBe('in-progress')
    const { activeColor, players } = gameRolledForStart
    expect(activeColor).toBeDefined()
    expect(players.length).toBe(2)
  })

  let activePlayer = gameRolledForStart.players.find(
    (p) => p.stateKind === 'rolling'
  ) as BackgammonPlayerRolling

  let inactivePlayer = gameRolledForStart.players.find(
    (p) => p !== activePlayer
  ) as BackgammonPlayerInactive

  const gameDoubled = Game.double(gameRolledForStart, activePlayer, players)
  let cube = gameDoubled.cube
  it('should correctly handle a double', () => {
    expect(gameDoubled).toBeDefined()
    expect(gameDoubled.stateKind).toBe('in-progress')
    expect(cube.stateKind).toBe('doubled')
    expect(cube.value).toBe(2)
    expect(cube.owner).toBe(inactivePlayer)
  })
})
