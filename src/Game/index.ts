import { randomBackgammonColor, generateId } from '..'
import { buildBoard } from '../Board'
import { buildCube } from '../Cube'
import { buildDice } from '../Dice'
import { GameRollingForStart, MAX_PIP_COUNT } from '../../types/index.d' // FIXME: import from ../types
import { BackgammonPlayers } from '../../types/player'
import { GameStateError } from './error'

export const startGame = (
  player1Id: string,
  player2Id: string
): GameRollingForStart => {
  if (player1Id === player2Id) throw GameStateError('Player1 === Player2')

  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  const id = generateId()
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

  const board = buildBoard(players)
  const cube = buildCube()
  const dice = buildDice()

  const game: GameRollingForStart = {
    id,
    kind: 'rolling-for-start',
    players,
    board,
    cube,
    dice,
  }

  console.log('[nodots-backgammon-core]: startGame:', game.board.points)

  return game
}
