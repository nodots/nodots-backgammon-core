import { generateId, Player, randomBackgammonColor } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonGameInProgress,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveInProgress,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayMoving,
  BackgammonPlayRolling,
  BackgammonPoint,
} from '../../types'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Play } from '../Play'

export interface GameProps {
  players: BackgammonPlayers
  board?: BackgammonBoard
  cube?: BackgammonCube
}
export class Game {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube

  public static initialize = function initializeGame(
    players: BackgammonPlayers
  ): BackgammonGameRollingForStart {
    const game: BackgammonGameRollingForStart = {
      id: generateId(),
      stateKind: 'rolling-for-start',
      players,
      board: Board.initialize(),
      cube: Cube.initialize(),
    }
    return game
  }

  public static rollForStart = function rollForStartGame(
    game: BackgammonGameRollingForStart
  ): BackgammonGameInProgress {
    const activeColor = randomBackgammonColor()
    let player = game.players.find((p) => p.color === activeColor)
    if (!player) {
      throw new Error('Active player not found')
    }
    if (!player.dice) {
      throw new Error('Active player dice not found')
    }

    const inactivePlayer = game.players.find((p) => p.color !== activeColor)
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }

    const activePlayer: BackgammonPlayerRolling = {
      ...player,
      stateKind: 'rolling',
      dice: {
        ...player.dice,
        stateKind: 'ready',
      },
    }

    return {
      ...game,
      players: [activePlayer, inactivePlayer],
      stateKind: 'in-progress',
      activeColor,
      activePlay: undefined,
    }
  }

  public static roll = function rollGame(
    game: BackgammonGameInProgress
  ): BackgammonGameInProgress {
    let { board, players } = game
    let player = players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolling'
    )
    if (!player) {
      throw new Error('Active player not found')
    }
    let opponent = game.players.find((p) => p.id !== player!.id)
    if (!opponent) {
      throw new Error('Opponent player not found')
    }

    let activePlay: BackgammonPlay = {
      id: generateId(),
      stateKind: 'rolling',
      player,
    }

    activePlay = Play.roll(board, activePlay)
    player = activePlay.player as BackgammonPlayerRolled
    players = [player, opponent]
    return {
      ...game,
      stateKind: 'in-progress',
      activePlay,
      players,
    }
  }

  public static double = function doubleGame(
    game: BackgammonGameInProgress,
    player: BackgammonPlayerActive,
    players: BackgammonPlayers
  ): BackgammonGameInProgress {
    const cube = Cube.double(game.cube, player, players)
    return {
      ...game,
      cube,
    }
  }

  public static move = function moveGame(
    game: BackgammonGameInProgress,
    origin: BackgammonMoveOrigin
  ): BackgammonGameInProgress {
    let activePlay = game.activePlay as BackgammonPlayMoving
    let board = game.board
    if (!activePlay) {
      throw new Error('Active play not found')
    }
    let moves = activePlay.moves
    const moveResults = Play.move(board, activePlay, origin)
    moves = moveResults.play.moves
    board = moveResults.board
    activePlay = {
      ...activePlay,
      moves,
    }

    return {
      ...game,
      activePlay,
    }
  }
}
