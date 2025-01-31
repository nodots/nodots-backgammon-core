import { generateId, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonGameRollingForStart,
  BackgammonGameInProgress,
  BackgammonGameCompleted,
  BackgammonGameStateKind,
  BackgammonMoveInProgress,
  BackgammonPlayerActive,
  BackgammonPlayerRolled,
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
export class Game {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube

  public static initialize(
    players: BackgammonPlayers
  ): BackgammonGameRollingForStart {
    return {
      id: generateId(),
      stateKind: 'rolling-for-start',
      players,
      board: Board.initialize(),
      cube: Cube.initialize({}),
    }
  }

  public static rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameInProgress {
    const activeColor = randomBackgammonColor()
    let player = game.players.find(
      (p) => p.color === activeColor && p.stateKind === 'inactive'
    )
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

  public static roll(game: BackgammonGameInProgress): BackgammonGameInProgress {
    const playerResult = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolling'
    )
    if (!playerResult) {
      throw new Error('Active player not found')
    }
    const rollingPlayer = playerResult as BackgammonPlayerRolling
    const player = Player.roll(rollingPlayer) as BackgammonPlayerRolled

    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )
    if (!inactivePlayer) {
      throw Error('Inactive player not found')
    }

    const activePlay = Play.initialize({
      player: {
        ...player,
        stateKind: 'moving',
      },
      stateKind: 'rolled',
    })

    return {
      ...game,
      players: [player, inactivePlayer],
      stateKind: 'in-progress',
      activePlay,
    }
  }

  public static move(
    game: BackgammonGameInProgress,
    move: BackgammonMoveInProgress
  ): BackgammonGameInProgress {
    let activePlay = game.activePlay
    const player = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolled'
    ) as BackgammonPlayerActive

    if (!player) {
      throw new Error('Active player not found')
    }

    if (!player.dice) {
      throw new Error('Active player dice not found')
    }

    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )

    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }

    if (!activePlay) {
      throw new Error('Active play not found')
    }

    return {
      ...game,
      stateKind: 'in-progress',
      activePlay,
    }
  }
}
