import { Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
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
  let players: BackgammonPlayers = [
    Player.initialize(clockwiseColor, 'clockwise'),
    Player.initialize(counterclockwiseColor, 'counterclockwise'),
  ]
  let activeColor: BackgammonColor | undefined = undefined
  let activePlay: BackgammonPlay | undefined = undefined
  let activePlayer: BackgammonPlayer | undefined = undefined
  let inactivePlayer: BackgammonPlayer | undefined = undefined
  let winner: BackgammonPlayerWinner | undefined = undefined

  const gameRolledForStart = Game.initialize(
    players
  ) as BackgammonGameRollingForStart
  players = gameRolledForStart.players
  stateKind = gameRolledForStart.stateKind
  board = gameRolledForStart.board
  cube = gameRolledForStart.cube
  activeColor = gameRolledForStart.activeColor
  activePlay = gameRolledForStart.activePlay
  winner = gameRolledForStart.winner

  it('should initialize the game correctly', () => {
    expect(gameRolledForStart).toBeDefined()
    // expect(stateKind).toBe('rolled-for-start')
    // expect(board).toBeDefined()
    // expect(cube).toBeDefined()
    // expect(winner).toBeUndefined()
  })

  // it('should roll for start correctly', () => {
  //   expect(gameRolledForStart).toBeDefined()
  //   expect(stateKind).toBe('rolled-for-start')
  //   expect(board).toBeDefined()
  //   expect(cube).toBeDefined()
  //   expect(activeColor).toBeDefined()
  //   expect(activePlay).toBeDefined()
  //   expect(activePlayer).toBeDefined()
  //   expect(inactivePlayer).toBeDefined()
  //   expect(winner).toBeUndefined()
  // })
})
