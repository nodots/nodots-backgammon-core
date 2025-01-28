import { generateId, Player, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonGameMoving,
  BackgammonGameRolled,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveInProgress,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayers,
} from '../../types'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Move } from '../Move'
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
  ): BackgammonGameRolling {
    const activeColor = randomBackgammonColor()
    const activePlayer = game.players.find((p) => p.color === activeColor)
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    if (!activePlayer.dice) {
      throw new Error('Active player dice not found')
    }
    activePlayer.stateKind = 'rolling'
    activePlayer.dice.stateKind === 'ready'
    const inactivePlayer = game.players.find((p) => p.color !== activeColor)
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return {
      ...game,
      players: [activePlayer, inactivePlayer],
      stateKind: 'rolling',
      activeColor,
      activePlay: undefined,
    }
  }

  public static roll(game: BackgammonGameRolling): BackgammonGameRolled {
    const playerResult = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolling'
    )
    if (!playerResult) {
      throw new Error('Active player not found')
    }
    const rollingPlayer = playerResult as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(rollingPlayer)

    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )
    if (!inactivePlayer) {
      throw Error('Inactive player not found')
    }

    const activePlay = Play.initialize(rolledPlayer)

    return {
      ...game,
      players: [rolledPlayer, inactivePlayer],
      stateKind: 'rolled',
      activePlay,
    }
  }

  public static switchDice(game: BackgammonGameRolled): BackgammonGameRolled {
    let { activePlay } = game
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolling'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    if (!activePlayer.dice) {
      throw new Error('Active player dice not found')
    }
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }

    activePlay = {
      ...activePlay,
      stateKind: 'rolled',
      player: activePlayer as BackgammonPlayerRolling,
      roll: [activePlay.roll[1], activePlay.roll[0]],
    }
    return {
      ...game,
      players: [inactivePlayer, activePlayer],
      activeColor: inactivePlayer.color,
      activePlay,
    }
  }

  public static move(
    game: BackgammonGameRolling | BackgammonGameMoving,
    move: BackgammonMoveInProgress
  ): BackgammonGameMoving {
    let { board, activePlay } = game
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'rolled'
    ) as BackgammonPlayerRolled

    if (!activePlayer) {
      throw new Error('Active player not found')
    }

    if (!activePlayer.dice) {
      throw new Error('Active player dice not found')
    }

    const player = activePlayer as BackgammonPlayerRolling
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )

    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }

    if (!activePlay) {
      activePlay = Play.initialize({ player })
    }

    return {
      ...game,
      stateKind: 'moving',
      activePlay,
    }
  }
}
