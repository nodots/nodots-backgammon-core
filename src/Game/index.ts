import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { buildBoard } from '../Board'
import { buildCube } from '../Cube'
import { buildDice } from '../Dice'
import { getPlayerById } from '../Player'
import {
  dbCreateGame,
  dbGetActiveGameByPlayerId,
  dbGetAll,
  dbGetGame,
} from './db'
import { GameStateError } from './errors'

import {
  NodotsGameInitializing,
  NodotsGameRollingForStart,
  NodotsPlayerReady,
  NodotsPlayers,
} from '../../@types'
import { dbSetPlayerPlaying } from '../Player/db'

// State transitions
export const startGame = async (
  player1Id: string,
  player2Id: string,
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsGameRollingForStart> => {
  if (player1Id === player2Id) throw GameStateError('Player1 === Player2')

  const player1 = (await getPlayerById(player1Id, db)) as NodotsPlayerReady
  const player2 = (await getPlayerById(player2Id, db)) as NodotsPlayerReady

  if (!player1 || !player2) {
    throw GameStateError('Player not found')
  }

  const board = buildBoard()
  const cube = buildCube()
  const dice = buildDice()
  const players: NodotsPlayers = [
    {
      playerId: player1Id,
      color: 'black',
      direction: 'counterclockwise',
      pipCount: 167,
    },
    {
      playerId: player2Id,
      color: 'white',
      direction: 'clockwise',
      pipCount: 167,
    },
  ]

  const gameInitializing: NodotsGameInitializing = {
    kind: 'initializing',
    players,
    board,
    cube,
    dice,
  }

  try {
    await dbSetPlayerPlaying(player1Id, db)
    await dbSetPlayerPlaying(player2Id, db)
    return await dbCreateGame(gameInitializing, db)
  } catch (e: any) {
    throw GameStateError(e.message)
  }
}

// Getters
export const getGames = async (db: NodePgDatabase<Record<string, never>>) =>
  await dbGetAll(db)

export const getGame = async (
  gameId: string,
  db: NodePgDatabase<Record<string, never>>
) => await dbGetGame(gameId, db)

export const getActiveGameByPlayerId = async (
  playerId: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  // console.log(
  //   '[Backgammon Game API] getActiveGameByPlayerId playerId:',
  //   playerId
  // )
  const result = await dbGetActiveGameByPlayerId(playerId, db)
  console.log('[Backgammon Game API] getActiveGameByPlayerId result:', result)
  return result
}
