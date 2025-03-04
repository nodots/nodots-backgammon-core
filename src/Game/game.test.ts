import { Board, Game, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGameMoving,
  BackgammonGameRolled,
  BackgammonGameRolledForStart,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
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

  // const gameRolled = Game.roll(gameRolledForStart)

  // it('should roll the dice correctly', () => {
  //   expect(gameMoving).toBeDefined()
  //   expect(gameMoving.stateKind).toBe('moving')
  // })

  // const origin = board.points.find(
  //   (p) => p.position[activePlayer.direction] === 24
  // ) as BackgammonMoveOrigin

  // activePlay = gameMoving.activePlay as BackgammonPlayMoving

  // // TODO: test for moving
  // const gameMoved = Game.move(
  //   {
  //     id: gameMoving.id,
  //     stateKind: 'moving',
  //     players,
  //     board: gameMoving.board,
  //     cube: gameMoving.cube,
  //     activePlay,
  //     activeColor: gameMoving.activeColor,
  //     activePlayer: gameMoving.activePlayer,
  //     inactivePlayer: gameMoving.inactivePlayer,
  //   },
  //   origin
  // )

  // it('should move correctly', () => {
  //   expect(gameMoved).toBeDefined()
  //   expect(gameMoved.stateKind).toBe('moving')
  //   expect(gameMoved.activePlayer).toBeDefined()
  //   expect(gameMoved.board).toBeDefined()
  //   expect(gameMoved.cube).toBeDefined()
  //   expect(gameMoved.activePlay).toBeDefined()
  //   expect(gameMoved.activeColor).toBeDefined()
  //   expect(gameMoved.activeColor).toBe(activeColor)
  //   expect(gameMoved.activePlay.moves).toBeDefined()
  //   if (
  //     gameMoved.activePlayer.dice.currentRoll[0] ===
  //     gameMoved.activePlayer.dice.currentRoll[1]
  //   ) {
  //     expect(gameMoved.activePlay.moves.length).toBe(4)
  //   } else {
  //     expect(gameMoved.activePlay.moves.length).toBe(2)
  //   }
  //   asciiBoard = Board.getAsciiBoard(gameMoved.board)
  //   // console.log('MOVED BOARD')
  //   // console.log(asciiBoard)
  // })
})
