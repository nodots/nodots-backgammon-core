import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameInProgress,
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
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
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        activeColor = randomBackgammonColor()
        activePlayer = players.find(
          (p) => p.color === activeColor && p.stateKind !== 'inactive'
        ) as BackgammonPlayerActive
        inactivePlayer = players.find(
          (p) => p.color !== activeColor && p.stateKind !== 'inactive'
        ) as BackgammonPlayerInactive
        return {
          id,
          stateKind,
          players,
          board: Board.initialize(),
          cube: Cube.initialize(),
        } as BackgammonGameRollingForStart
      case 'rolled-for-start':
        activePlayer = players.find(
          (p) => p.color === activeColor
        ) as BackgammonPlayerRolling
        inactivePlayer = players.find(
          (p) => p.color !== activeColor
        ) as BackgammonPlayerInactive

        const activePlay = Play.roll({
          player: activePlayer,
          stateKind: 'rolling',
        })

        return {
          id,
          stateKind: 'in-progress',
          players,
          board,
          cube,
          activeColor,
          activePlay,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameInProgress
      case 'in-progress':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
        } as BackgammonGameInProgress
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
    }
  }

  public static rollForStart = function rollForStartGame(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    const activeColor = randomBackgammonColor()
    const activePlayer = game.players.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerRolledForStart

    const inactivePlayer = game.players.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive

    const activePlay = Play.roll({
      player: activePlayer,
      stateKind: 'rolled',
    })

    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      activePlayer,
      inactivePlayer,
    }
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart
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

    const activePlay = Play.roll({
      player,
      stateKind: 'rolled',
    })

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
}
