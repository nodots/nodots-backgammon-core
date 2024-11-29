import { generateId, randomBackgammonColor } from '..'
import {
  _Game,
  BackgammonChecker,
  BackgammonGameStateKind,
  BackgammonMove,
  GameInitializing,
  GameMoving,
  GameRolling,
  MoveMoving,
} from '../../types/index.d' // FIXME: import from ../types
import { BackgammonPlayers, PlayerReady } from '../../types/player'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { _buildMoves, getDestinationForOrigin } from '../Move'
import { GameStateError } from './error'

export type PlayerInitializer = BackgammonPlayers
export type GameInitializer = string
export interface GameProps {
  players?: PlayerInitializer
  gameId?: GameInitializer
  getGame: (gameId: GameInitializer) => Game
}

export class Game implements _Game {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube
  getGame!: (gameId: string) => Game

  constructor({ players, gameId, getGame }: GameProps) {
    if (!players && !gameId) throw GameStateError('Invalid state')
    if (players) {
      this.initialize(players)
      this.getGame = getGame
    } else {
      throw GameStateError('Unimplemented initialization signature for game')
    }
  }

  initialize(players: BackgammonPlayers): void {
    this.id = generateId()
    this.stateKind = 'initializing'
    this.players = players
    this.board = new Board(players)
    this.cube = new Cube()
  }

  rollForStart(game: GameInitializing): GameRolling {
    const activeColor = randomBackgammonColor()
    const player = game.players.find(
      (p) => p.color === activeColor
    ) as PlayerReady
    return {
      ...game,
      stateKind: 'rolling',
      activeColor,
    }
  }

  roll(game: GameRolling): GameMoving {
    const { activeColor, players } = game
    const player = players.find((p) => p.color === activeColor) as PlayerReady
    const roll = player.dice.roll()
    return {
      ...game,
      stateKind: 'moving',
      activePlay: {
        roll,
        moves: _buildMoves(player, roll),
      },
    }
  }

  move(game: GameMoving, checker: BackgammonChecker): GameMoving | GameRolling {
    const { activePlay, players, board } = game
    const { roll, moves } = activePlay
    const player = players.find((p) => p.color === checker.color) as PlayerReady

    const activeMove = game.activePlay.moves.find((m: BackgammonMove) =>
      m.origin ? m : null
    )
    if (!activeMove) {
      return {
        ...game,
        stateKind: 'rolling',
      }
    } else {
      const move = activeMove as MoveMoving
      const checkercontainers: Array<{ checkers: BackgammonChecker[] }> = [
        ...game.board.points,
        game.board.bar.clockwise,
        game.board.bar.counterclockwise,
        game.board.off.clockwise,
        game.board.off.counterclockwise,
      ]
      const origin = checkercontainers.find((cc) =>
        cc.checkers.includes(checker)
      )
      activeMove.origin = origin
      activeMove.destination = getDestinationForOrigin(
        board,
        activeMove.origin,
        move
      )

      const updatedMoves = moves.map((m: BackgammonMove) =>
        m.id === activeMove.id ? activeMove : m
      )

      return {
        ...game,
        stateKind: 'moving',
        activePlay: {
          roll,
          moves: updatedMoves,
        },
      }
    }
  }
}
