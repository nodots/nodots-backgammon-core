import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonGameStateKind,
  BaseBgGame,
  GameRolling,
  GameRollingForStart,
} from '../../types'
import { BackgammonPlayers } from '../../types/player'
import { Board } from '../Board'
import { Cube } from '../Cube'

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
      board: new Board(),
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
    }
  }
}
