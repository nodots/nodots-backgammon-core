import { Game, Player, randomBackgammonColor } from '..'
import { BackgammonPlayers } from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  let players: BackgammonPlayers = [
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

  const gameRolled = Game.roll(gameRolledForStart)

  it('should correctly handle a roll', () => {
    expect(gameRolled).toBeDefined()
    expect(gameRolled.stateKind).toBe('in-progress')
    const { activeColor, activePlay, players } = gameRolled
    expect(activeColor).toBeDefined()
    expect(players.length).toBe(2)
    const activePlayer = players.find((p) => p.color === activeColor)
    expect(activePlayer).toBeDefined()
    expect(activePlayer?.stateKind).toBe('rolled')
    expect(activePlayer?.dice.stateKind).toBe('rolled')
    expect(activePlay).toBeDefined()
    expect(activePlay?.stateKind).toBe('rolled')
    expect(activePlay?.player.dice.currentRoll).toBeDefined()
    if (
      activePlay?.player.dice.currentRoll[0] ===
      activePlay?.player.dice.currentRoll[1]
    ) {
      expect(activePlay?.moves.length).toBe(4)
    } else {
      expect(activePlay?.moves.length).toBe(2)
    }
  })

  // const gameMoving = Game.move(gameRolled)

  // it('should correctly handle a move', () => {
  //   expect(gameMoving).toBeDefined()
  //   expect(gameMoving.stateKind).toBe('in-progress')
  //   const { activeColor, activePlay, players } = gameMoving
  //   expect(activeColor).toBeDefined()
  //   expect(players.length).toBe(2)
  //   const activePlayer = players.find((p) => p.color === activeColor)
  //   expect(activePlayer).toBeDefined()
  //   expect(activePlay.moves)

  //   // expect(activePlayer?.dice.stateKind).toBe('rolled')
  //   // expect(activePlay).toBeDefined()
  //   // expect(activePlay?.stateKind).toBe('moving')
  //   // expect(activePlay?.player.dice.currentRoll).toBeDefined()
  //   // if (
  //   //   activePlay?.player.dice.currentRoll[0] ===
  //   //   activePlay?.player.dice.currentRoll[1]
  //   // ) {
  //   //   expect(activePlay?.moves.length).toBe(4)
  //   // } else {
  //   //   expect(activePlay?.moves.length).toBe(2)
  //   // }
  // })

  // const gameDoubled = Game.double(gameRolledForStart, activePlayer, players)
  // let cube = gameDoubled.cube
  // it('should correctly handle a double', () => {
  //   expect(gameDoubled).toBeDefined()
  //   expect(gameDoubled.stateKind).toBe('in-progress')
  //   expect(cube.stateKind).toBe('doubled')
  //   expect(cube.value).toBe(2)
  //   expect(cube.owner).toBe(inactivePlayer)
  // })
})
