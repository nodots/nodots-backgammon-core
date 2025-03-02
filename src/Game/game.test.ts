import { Board, Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGameRolledForStart,
  BackgammonMove,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayerWinner,
} from '../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

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
  let asciiBoard: string | undefined = undefined

  const gameRolledForStart = Game.initialize(
    players
  ) as BackgammonGameRolledForStart
  players = gameRolledForStart.players
  stateKind = gameRolledForStart.stateKind
  board = gameRolledForStart.board
  cube = gameRolledForStart.cube
  activeColor = gameRolledForStart.activeColor
  activePlay = gameRolledForStart.activePlay
  activePlayer = gameRolledForStart.activePlayer
  inactivePlayer = gameRolledForStart.inactivePlayer
  winner = gameRolledForStart.winner

  asciiBoard = Board.getAsciiBoard(board)
  console.log('INITIAL BOARD')
  console.log(asciiBoard)

  it('should initialize the game correctly', () => {
    expect(gameRolledForStart).toBeDefined()
    expect(stateKind).toBe('rolling')
    expect(players).toBeDefined()
    expect(players.length).toBe(2)
    expect(board).toBeDefined()
    expect(cube).toBeDefined()
    expect(activeColor).toBeDefined()
    expect(activePlayer).toBeDefined()
    expect(inactivePlayer).toBeDefined()
    expect(board).toBeDefined()
    expect(cube).toBeDefined()
    expect(winner).toBeUndefined()
  })

  activePlayer = gameRolledForStart.activePlayer
  if (!activePlayer) throw new Error('activePlayer is undefined')
  activePlayer = activePlayer as BackgammonPlayerRolling

  // TODO: test for rolling
  const gameMoving = Game.roll({
    id: gameRolledForStart.id,
    stateKind: 'rolling',
    players,
    board,
    cube,
    activeColor,
    activePlay,
    activePlayer,
    inactivePlayer,
  })

  it('should roll the dice correctly', () => {
    expect(gameMoving).toBeDefined()
    expect(gameMoving.stateKind).toBe('moving')
    expect(gameMoving.activePlayer).toBeDefined()
    expect(gameMoving.activePlayer).toBeDefined()
    expect(gameMoving.board).toBeDefined()
    expect(gameMoving.cube).toBeDefined()
    expect(gameMoving.activePlay).toBeDefined()
    expect(gameMoving.activeColor).toBeDefined()
    expect(gameMoving.activeColor).toBe(activeColor)
    expect(gameMoving.activePlay.moves).toBeDefined()
    if (
      gameMoving.activePlayer.dice.currentRoll[0] ===
      gameMoving.activePlayer.dice.currentRoll[1]
    ) {
      expect(gameMoving.activePlay.moves.length).toBe(4)
    } else {
      expect(gameMoving.activePlay.moves.length).toBe(2)
    }
  })

  const origin = board.points.find(
    (p) => p.position[activePlayer.direction] === 24
  ) as BackgammonMoveOrigin

  activePlay = gameMoving.activePlay

  // TODO: test for moving
  const gameMoved = Game.move(
    {
      id: gameMoving.id,
      stateKind: 'moving',
      players,
      board: gameMoving.board,
      cube: gameMoving.cube,
      activePlay,
      activeColor: gameMoving.activeColor,
      activePlayer: gameMoving.activePlayer,
      inactivePlayer: gameMoving.inactivePlayer,
    },
    activePlay,
    origin as BackgammonMoveOrigin
  )

  it('should move correctly', () => {
    expect(gameMoved).toBeDefined()
    expect(gameMoved.stateKind).toBe('moving')
    expect(gameMoved.activePlayer).toBeDefined()
    expect(gameMoved.board).toBeDefined()
    expect(gameMoved.cube).toBeDefined()
    expect(gameMoved.activePlay).toBeDefined()
    expect(gameMoved.activeColor).toBeDefined()
    expect(gameMoved.activeColor).toBe(activeColor)
    expect(gameMoved.activePlay.moves).toBeDefined()
    if (
      gameMoved.activePlayer.dice.currentRoll[0] ===
      gameMoved.activePlayer.dice.currentRoll[1]
    ) {
      expect(gameMoved.activePlay.moves.length).toBe(4)
    } else {
      expect(gameMoved.activePlay.moves.length).toBe(2)
    }
    asciiBoard = Board.getAsciiBoard(gameMoved.board)
    console.log('MOVED BOARD')
    console.log(asciiBoard)
  })
})
