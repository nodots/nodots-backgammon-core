import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolledForStart,
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
  activePlay!: Play
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

  // The initializer is designed to create an instance of a Game from any of its starting states.
  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: Play,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return Game.rollForStart({
          id,
          stateKind: 'rolling-for-start',
          players,
          board,
          cube,
        })
      case 'rolled-for-start':
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
        return Game.roll({
          id,
          stateKind: 'rolling',
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling)
      case 'moving':
        if (!activePlay) throw new Error('Active play must be provided')
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!board) throw new Error('Board must be provided')
        if (!cube) throw new Error('Cube must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        if (!origin) throw new Error('Origin must be provided')
        stateKind = 'moving'

        return Game.move(
          {
            id,
            stateKind,
            players,
            board,
            cube,
            activeColor,
            activePlayer,
            inactivePlayer,
            activePlay,
          } as BackgammonGameMoving,
          activePlay,
          origin
        )

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
    game: BackgammonGameRolling
  ): BackgammonGameMoving {
    const { id, players, board, cube, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    let activePlayer = activePlayerForColor as BackgammonPlayerRolling
    if (!activePlayer) throw new Error('Active player not found')
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const activePlay = Play.roll({
      player: activePlayer,
      stateKind: 'rolling',
    })
    const movingPlayer = activePlay.player
    return {
      id,
      stateKind: 'moving',
      players,
      board,
      cube,
      activeColor,
      activePlayer: movingPlayer,
      activePlay,
    } as BackgammonGameMoving
  }

  private static move = function move(
    game: BackgammonGameMoving,
    play: Play,
    origin: BackgammonMoveOrigin
  ): BackgammonGameMoving {
    const { id, players, cube, activeColor, activePlayer } = game
    let board = game.board
    let activePlay = game.activePlay
    if (!activeColor) throw new Error('Active color must be provided')
    if (!activePlayer) throw new Error('Active player must be provided')
    const playResult = Play.move(board, play as BackgammonPlayMoving, origin)
    board = playResult.board
    activePlay = playResult.play

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
}
