import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  dbGetPlayerById,
  dbGetPlayers,
  dbGetPlayersSeekingGame,
  dbUpdatePlayerPreferences,
  dbCreatePlayer,
} from './db'
import {
  NodotsPlayerInitialized,
  NodotsPlayerPreferences,
} from '../../backgammon-types'

export const getPlayerById = async (playerId: string, db: NodePgDatabase) =>
  await dbGetPlayerById(playerId, db)

export const getAllPlayers = async (
  db: NodePgDatabase<Record<string, never>>
) => await dbGetPlayers(db)

export const getPlayersSeekingGame = async (
  db: NodePgDatabase<Record<string, never>>
) => await dbGetPlayersSeekingGame(db)

export type UpdatedPlayerPreferences = Partial<NodotsPlayerPreferences>

export const updatePlayerPreferences = async (
  id: string,
  preferences: UpdatedPlayerPreferences,
  db: NodePgDatabase<Record<string, never>>
) => await dbUpdatePlayerPreferences(id, preferences, db)

export const createPlayerFromPlayerInitialized = async (
  player: NodotsPlayerInitialized,
  db: NodePgDatabase<Record<string, never>>
) => {
  console.log('[PlayerAPI] createPlayerFromPlayerInitialized player:', player)
  try {
    const playerInitialized: NodotsPlayerInitialized = {
      source: player.source,
      externalId: player.externalId,
      email: player.email,
      kind: 'initialized',
      isLoggedIn: true,
      isSeekingGame: false,
      preferences: player.preferences,
    }
    console.log(
      '[PlayerAPI] createPlayerFromAuthOUser playerInitialized:',
      playerInitialized
    )
    const result = await dbCreatePlayer(playerInitialized, db)
    console.log('[PlayerAPI] createPlayerFromAuthOUser result:', result)
    return result
  } catch (error) {
    console.error('Error creating player from Auth0 user:', error)
    return null
  }
}
