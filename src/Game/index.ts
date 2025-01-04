import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonGameStateKind,
  BaseBgGame,
  GameInitializing,
  GameRolling,
} from '../../types'
import { BackgammonPlayers } from '../../types/player'
import { Board } from '../Board'
import { Cube } from '../Cube'

export type PlayerInitializer = BackgammonPlayers
export type GameInitializer = string
export interface GameProps {
  players?: PlayerInitializer
  gameId?: GameInitializer
}

export class Game implements BaseBgGame {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube

  constructor(players: BackgammonPlayers) {
    this.id = generateId()
    this.stateKind = 'initializing'
    this.players = players
    this.board = new Board()
    this.cube = new Cube()
  }

  rollForStart(game: GameInitializing): GameRolling {
    const activeColor = randomBackgammonColor()
    return {
      ...game,
      stateKind: 'rolling',
      activeColor,
    }
  }
}
