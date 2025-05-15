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
  BackgammonPlayRolled,
  BackgammonPlayMoving,
} from 'nodots-backgammon-types'
import { generateId, Player, randomBackgammonColor } from '..'
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
      case 'rolled':
        throw new Error('Game cannot be initialized in the rolled state')
      case 'moved':
        throw new Error('Game cannot be initialized in the moved state')
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
      case 'doubling':
        throw new Error('Game cannot be initialized in the doubling state')
      case 'doubled':
        throw new Error('Game cannot be initialized in the doubled state')
    }
    // Exhaustiveness check
    const _exhaustiveCheck: never = stateKind
    throw new Error(`Unhandled stateKind: ${stateKind}`)
  }

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    const activeColor = randomBackgammonColor()
    const rollingPlayers = game.players.map((p) =>
      p.color === activeColor
        ? Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'rolled-for-start'
          )
        : Player.initialize(p.color, p.direction, undefined, p.id, 'inactive')
    ) as BackgammonPlayers
    const activePlayer = rollingPlayers.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerRolledForStart
    const inactivePlayer = rollingPlayers.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive
    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      players: rollingPlayers,
      activePlayer,
      inactivePlayer,
    } as BackgammonGameRolledForStart
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart | BackgammonGameRolling
  ): BackgammonGameRolled {
    if (game.stateKind === 'rolled-for-start') {
      const { players, board, cube, activeColor, activePlayer } = game
      const rollingPlayers = players.map((p) => {
        if (p.color === activeColor) {
          if (p.stateKind === 'rolling') return p
          return Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'rolling'
          )
        }
        return Player.initialize(
          p.color,
          p.direction,
          undefined,
          p.id,
          'inactive'
        )
      }) as BackgammonPlayers
      const newActivePlayer = rollingPlayers.find(
        (p) => p.color === activeColor
      ) as BackgammonPlayerRolling
      const inactivePlayer = rollingPlayers.find(
        (p) => p.color !== activeColor
      ) as BackgammonPlayerInactive
      const rollingGame: BackgammonGameRolling = {
        ...game,
        stateKind: 'rolling',
        players: rollingPlayers,
        activePlayer: newActivePlayer,
        inactivePlayer,
        activeColor: activeColor!,
      }
      return Game.roll(rollingGame)
    }
    const { players, board, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    if (activePlayerForColor.stateKind !== 'rolling') {
      throw new Error('Active player must be in rolling state')
    }
    const activePlayerRolling = activePlayerForColor as BackgammonPlayerRolling
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const playerRolled = Player.roll(activePlayerRolling)
    const activePlay = Play.initialize(board, playerRolled)

    const rolledPlay = {
      ...activePlay,
      stateKind: 'rolled',
      player: playerRolled,
    } as BackgammonPlayRolled

    return {
      ...game,
      stateKind: 'rolled',
      activePlayer: playerRolled,
      activePlay: rolledPlay,
      board,
    } as BackgammonGameRolled
  }

  public static move = function move(
    game: BackgammonGameMoving | BackgammonGameRolled,
    originId: string
  ): BackgammonGameMoving {
    let { activePlay, board } = game

    // If in 'rolled', transition to 'moving'
    if (activePlay.stateKind === 'rolled') {
      // You may need to create a PlayMoving from PlayRolled
      activePlay = Play.startMove(activePlay)
      game = Game.startMove(game as BackgammonGameRolled, activePlay)
    }

    if (activePlay.stateKind !== 'moving') {
      throw new Error('activePlay must be in moving state to make a move')
    }

    const playResult = Player.move(board, activePlay, originId)
    board = playResult.board
    return {
      ...game,
      stateKind: 'moving',
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

  public static startMove = function startMove(
    game: BackgammonGameRolled,
    movingPlay: BackgammonPlayMoving
  ): BackgammonGameMoving {
    return {
      ...game,
      stateKind: 'moving',
      activePlay: movingPlay,
      activePlayer: Player.toMoving(game.activePlayer),
    } as BackgammonGameMoving
  }
}
