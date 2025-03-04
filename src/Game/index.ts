import { generateId, Player, randomBackgammonColor } from '..'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Play } from '../Play'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolled,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayMoving,
} from '../types'
export interface GameProps {
  players: BackgammonPlayers
  board?: BackgammonBoard
  cube?: BackgammonCube
}
/*
 * The Game class is a state machine that can be in one of three states:
 *  - rolling-for-start,
 *  - in-progress
 *  - completed.
 */

export class Game {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube
  activeColor!: BackgammonColor
  activePlay!: BackgammonPlay
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

  // The initializer is designed to create an instance of a Game from any of its starting states.
  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    let game: BackgammonGame = {
      id,
      players,
      board,
      cube,
      stateKind,
    }
    switch (stateKind) {
      case 'rolling-for-start':
        return Game.rollForStart({
          id,
          stateKind: 'rolling-for-start',
          players,
          board,
          cube,
        })
      case 'rolled-for-start': // FIXME: This is probably wrong
        return {
          id,
          stateKind: 'rolling',
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer: inactivePlayer,
        } as BackgammonGameRolling
      case 'rolling':
        activeColor = activeColor as BackgammonColor
        return Game.roll({
          id,
          stateKind: 'rolled-for-start',
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        })
      case 'moving':
        const gameMoving = Game.sanityCheckMovingGame(game)
        origin = origin as BackgammonMoveOrigin
        if (!gameMoving) throw new Error('Game is not in a moving state')
        if (!origin) throw new Error('Origin must be provided')
        return Game.move(gameMoving, origin)
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
    }
  }

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolling {
    const activeColor = randomBackgammonColor()
    const [activePlayerRolledForStart, inactivePlayerRolledForStart] =
      Game.getPlayersForColor(game.players, activeColor)
    const activePlayer =
      activePlayerRolledForStart as BackgammonPlayerRolledForStart
    const inactivePlayer =
      inactivePlayerRolledForStart as BackgammonPlayerInactive
    return {
      ...game,
      stateKind: 'rolling',
      activeColor,
      activePlayer,
      inactivePlayer,
    }
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart
  ): BackgammonGameRolled {
    const { id, players, board, cube, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    let activePlayer = activePlayerForColor as BackgammonPlayerRolling
    if (!activePlayer) throw new Error('Active player not found')
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const playerRolled = Player.roll(activePlayer)
    const activePlay = Play.initialize(board, playerRolled)
    return {
      ...game,
      stateKind: 'rolled',
      activePlayer: playerRolled,
      activePlay,
    } as BackgammonGameRolled
  }

  public static move = function move(
    game: BackgammonGameMoving | BackgammonGameRolled,
    origin: BackgammonMoveOrigin
  ): BackgammonGameMoving {
    const { id, players, cube, activeColor, activePlay } = game
    let board = game.board
    const activePlayer = Game.activePlayer(game)
    const playResult = Player.move(board, activePlay, origin)
    board = playResult.board

    return {
      id,
      stateKind: 'moving',
      players,
      board,
      cube,
      activePlay,
      activeColor,
      activePlayer,
    } as BackgammonGameMoving
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

  public static inactivePlayer = function inactivePlayer(
    game: BackgammonGame
  ): BackgammonPlayerInactive {
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor && p.stateKind !== 'inactive'
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return inactivePlayer as BackgammonPlayerInactive // TODO: Fix this
  }

  private static getPlayersForColor = function getPlayersForColor(
    players: BackgammonPlayers,
    color: BackgammonColor
  ): [
    activePlayerForColor: BackgammonPlayerActive,
    inactivePlayerForColor: BackgammonPlayerInactive
  ] {
    const activePlayer = players.find(
      (p) => p.color === color
    ) as BackgammonPlayerActive
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    const inactivePlayer = players.find(
      (p) => p.color !== color
    ) as BackgammonPlayerInactive
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return [activePlayer, inactivePlayer]
  }

  private static sanityCheckMovingGame = (
    game: BackgammonGame
  ): BackgammonGameMoving | false => {
    if (!game.activeColor) return false
    if (!game.activePlayer) return false
    if (!game.activePlay) return false
    if (!game.board) return false
    return game as BackgammonGameMoving
  }
}
