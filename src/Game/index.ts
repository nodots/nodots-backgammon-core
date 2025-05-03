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
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
} from 'nodots-backgammon-types'

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
  activeColor!: BackgammonColor
  activePlay!: BackgammonPlay
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

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
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
        } as BackgammonGameRollingForStart
      case 'rolled-for-start':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      case 'rolling':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling
      case 'moving':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGameMoving
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
  ): BackgammonGameMoving {
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

    // Convert the play state to moving
    const movingPlay = {
      ...activePlay,
      stateKind: 'moving',
      player: {
        ...playerRolled,
        stateKind: 'moving',
      } as BackgammonPlayerMoving,
    } as BackgammonPlayMoving

    return {
      ...game,
      stateKind: 'moving',
      activePlayer: playerRolled,
      activePlay: movingPlay,
      board,
    } as BackgammonGameMoving
  }

  public static move = function move(
    game: BackgammonGameMoving,
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
    return activePlayer as BackgammonPlayerActive
  }

  public static inactivePlayer = function inactivePlayer(
    game: BackgammonGame
  ): BackgammonPlayerInactive {
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor && p.stateKind === 'inactive'
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return inactivePlayer as BackgammonPlayerInactive
  }

  public static getPlayersForColor = function getPlayersForColor(
    players: BackgammonPlayers,
    color: BackgammonColor
  ): [
    activePlayerForColor: BackgammonPlayerActive,
    inactivePlayerForColor: BackgammonPlayerInactive
  ] {
    const activePlayerForColor = players.find((p) => p.color === color)
    const inactivePlayerForColor = players.find((p) => p.color !== color)
    if (!activePlayerForColor || !inactivePlayerForColor) {
      throw new Error('Players not found')
    }
    return [
      activePlayerForColor as BackgammonPlayerActive,
      inactivePlayerForColor as BackgammonPlayerInactive,
    ]
  }

  private static sanityCheckMovingGame = (
    game: BackgammonGame
  ): BackgammonGameMoving | false => {
    if (game.stateKind !== 'moving') return false
    return game as BackgammonGameMoving
  }
}
