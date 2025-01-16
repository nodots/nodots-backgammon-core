import { Dice, generateId, randomBackgammonColor } from '..'
import {
  BackgammonChecker,
  BackgammonGameStateKind,
  BackgammonRoll,
  BaseBgGame,
  GameMoving,
  GameRolled,
  GameRolling,
  GameRollingForStart,
  MoveMoving,
  PlayMoving,
  PlayRolled,
} from '../../types'
import {
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerReady,
  BackgammonPlayerRolling,
  BackgammonPlayers,
} from '../../types/player'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Move } from '../Move'
import { Play } from '../Play'

export class Game implements BaseBgGame {
  id: string | undefined
  stateKind: BackgammonGameStateKind | undefined = undefined
  players: BackgammonPlayers | undefined = undefined
  board: Board | undefined = undefined
  cube: Cube | undefined = undefined
  rollForStart!: (game: GameRollingForStart) => GameRolling

  public static initialize(players: BackgammonPlayers): GameRollingForStart {
    return {
      id: generateId(),
      stateKind: 'rolling-for-start',
      players,
      board: Board.initialize(),
      cube: new Cube(),
    }
  }

  public static rollForStart(game: GameRollingForStart): GameRolling {
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

  public static roll(game: GameRolling): GameRolled {
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind === 'ready'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    const player = activePlayer as BackgammonPlayerReady
    if (!player.dice) {
      throw new Error('Active player dice not found')
    }
    const rollingPlayer: BackgammonPlayerRolling = {
      ...player,
      stateKind: 'rolling',
    }
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }

    const rollResult = Dice.roll(rollingPlayer.dice)
    const roll = rollResult.currentRoll as BackgammonRoll //FIXME

    const activePlay = Play.initialize(rollingPlayer, roll)

    return {
      ...game,
      players: [activePlayer, inactivePlayer],
      stateKind: 'rolled',
      activePlay,
    }
  }

  public static switchDice(game: GameRolled): GameRolled {
    const { activePlay } = game
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

    const updatedPlay: PlayRolled = {
      ...activePlay,
      stateKind: 'rolled',
      player: activePlayer as BackgammonPlayerRolling,
      roll: [activePlay.roll[1], activePlay.roll[0]],
    }
    return {
      ...game,
      players: [inactivePlayer, activePlayer],
      activeColor: inactivePlayer.color,
      activePlay: updatedPlay,
    }
  }

  public static move(
    game: GameRolled | GameMoving,
    move: MoveMoving
  ): GameMoving {
    const { activePlay } = game
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

    const updatedPlay: PlayMoving = {
      ...activePlay,
      stateKind: 'moving',
      player: activePlayer as BackgammonPlayerMoving,
    }
    return {
      ...game,
      stateKind: 'moving',
      activePlay: updatedPlay,
    }
  }
}
