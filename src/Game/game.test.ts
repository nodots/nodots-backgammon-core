import { Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayers,
  BackgammonPlayerWinner,
} from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  let game: BackgammonGame | undefined = undefined
  let stateKind:
    | 'rolling-for-start'
    | 'rolled-for-start'
    | 'in-progress'
    | 'completed'
    | undefined = undefined
  let board: BackgammonBoard | undefined = undefined
  let cube: BackgammonCube | undefined = undefined
  const players: BackgammonPlayers = [
    Player.initialize(clockwiseColor, 'clockwise'),
    Player.initialize(counterclockwiseColor, 'counterclockwise'),
  ]
  let activeColor: BackgammonColor | undefined = undefined
  let activePlay: BackgammonPlay | undefined = undefined
  let activePlayer: BackgammonPlayer | undefined = undefined
  let inactivePlayer: BackgammonPlayer | undefined = undefined
  let winner: BackgammonPlayerWinner | undefined = undefined

  game = Game.initialize(players) as BackgammonGameRollingForStart
  stateKind = game.stateKind
  board = game.board
  cube = game.cube
  activeColor = game.activeColor
  activePlay = game.activePlay
  winner = game.winner

  it('should initialize the game correctly', () => {
    expect(game).toBeDefined()
    expect(stateKind).toBe('rolled-for-start')
    expect(board).toBeDefined()
    expect(cube).toBeDefined()
    expect(activeColor).toBeDefined()
    expect(activePlay).toBeDefined()
    expect(activePlayer).toBeDefined()
    expect(winner).toBeUndefined()
  })

  const gameRolledForStart = Game.rollForStart(
    game as BackgammonGameRollingForStart
  ) as BackgammonGameRolledForStart
  stateKind = gameRolledForStart.stateKind
  activeColor = gameRolledForStart.activeColor
  activePlayer = gameRolledForStart.activePlayer
  inactivePlayer = gameRolledForStart.inactivePlayer

  it('should roll for start correctly', () => {
    stateKind = gameRolledForStart.stateKind
    activeColor = gameRolledForStart.activeColor
    activePlayer = gameRolledForStart.activePlayer

    expect(game).toBeDefined()
    expect(stateKind).toBe('rolled-for-start')
    expect(activeColor).toBeDefined()
    expect(activePlayer).toBeDefined()
    expect(inactivePlayer).toBeDefined()
  })
  // game = Game.roll(game as BackgammonGameRolledForStart)

  // it('should roll the dice correctly', () => {
  //   stateKind = game.stateKind
  //   activePlay = game.activePlay

  //   expect(game).toBeDefined()
  //   expect(stateKind).toBe('in-progress')
  //   expect(activePlay).toBeDefined()
  //   expect(activePlayer).toBeDefined()
  //   expect(inactivePlayer).toBeDefined()
  // })
})
