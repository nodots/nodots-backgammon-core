import { generateId, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameInProgress,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonPlayerActive,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayMoving,
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
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize()
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          id,
          stateKind,
          players,
          board: Board.initialize(),
          cube: Cube.initialize(),
        } as BackgammonGameRollingForStart
      case 'in-progress':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
        } as BackgammonGameInProgress
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
    }
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

  public static roll = function roll(
    game: BackgammonGameInProgress
  ): BackgammonGameInProgress {
    let { players } = game
    let player = players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolling'
    ) as BackgammonPlayerRolling
    if (!player) {
      throw new Error('Active player not found')
    }
    let opponent = game.players.find((p) => p.id !== player!.id)
    if (!opponent) {
      throw new Error('Opponent player not found')
    }
    const playerRolled = Player.roll(player)
    players = [playerRolled, opponent]
    const activePlay = Play.initialize(playerRolled)
    return {
      ...game,
      stateKind: 'in-progress',
      activePlay,
      players,
    }
  }

  public static activePlayer = function activePlayer(
    game: BackgammonGame
  ): BackgammonPlayerActive {
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind !== 'inactive'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    return activePlayer as BackgammonPlayerActive // TODO: Fix this
  }
  // public static double = function double(
  //   game: BackgammonGameInProgress,
  //   player: BackgammonPlayerActive,
  //   players: BackgammonPlayers
  // ): BackgammonGameInProgress {
  //   const cube = Cube.double(game.cube, player, players)
  //   return {
  //     ...game,
  //     cube,
  //   }
  // }

  // public static move = function move(
  //   game: BackgammonGameInProgress,
  //   origin: BackgammonMoveOrigin
  // ): BackgammonGameInProgress {
  //   let activePlay = game.activePlay as BackgammonPlayMoving
  //   let board = game.board
  //   if (!activePlay) {
  //     throw new Error('Active play not found')
  //   }
  //   let moves = activePlay.moves
  //   const moveResults = Play.move(board, activePlay, origin)
  //   moves = moveResults.play.moves
  //   board = moveResults.board
  //   activePlay = {
  //     ...activePlay,
  //     moves,
  //   }

  //   return {
  //     ...game,
  //     activePlay,
  //   }
  // }
}
