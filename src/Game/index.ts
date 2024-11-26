import { randomBackgammonColor, generateId, Dice } from '..'
import { Board } from '../Board'
import { Cube } from '../Cube'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonDice,
  BackgammonGame,
  BackgammonGameState,
} from '../../types/index.d' // FIXME: import from ../types
import { BackgammonPlayers } from '../../types/player'
import { GameStateError } from './error'

export class Game implements BackgammonGame {
  id: string = generateId()
  kind: BackgammonGameState
  board: BackgammonBoard
  players: BackgammonPlayers
  cube: BackgammonCube
  dice: BackgammonDice
  activeColor: BackgammonColor | undefined = undefined

  constructor(player1Id: string, player2Id: string) {
    if (player1Id === player2Id) throw GameStateError('Player1 === Player2')

    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

    const players: BackgammonPlayers = [
      {
        playerId: player1Id,
        color: counterclockwiseColor,
        direction: 'counterclockwise',
        pipCount: 167,
      },
      {
        playerId: player2Id,
        color: clockwiseColor,
        direction: 'clockwise',
        pipCount: 167,
      },
    ]

    this.players = players
    this.kind = 'rolling-for-start'
    this.board = new Board(players)
    this.cube = new Cube()
    this.dice = new Dice()
  }

  rollForStart() {
    if (this.kind !== 'rolling-for-start') throw GameStateError('Invalid state')
    const activeColor = randomBackgammonColor()

    this.kind = 'rolling'
    this.activeColor = activeColor
  }
}
