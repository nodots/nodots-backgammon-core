import { and, eq, ne } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { UpdatedPlayerPreferences } from '.'
import {
  NodotsPlayer,
  NodotsPlayerInitialized,
  NodotsPlayerReady,
} from '../../@types'

export interface ExternalPlayerReference {
  source: string
  externalId: string
}

// FIXME: We should be able to define this via the backgammon-types module
const playerKinds = ['ready', 'playing'] as const
export const PlayerTypeEnum = pgEnum('player-kind', playerKinds)

export const PlayersTable = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  kind: PlayerTypeEnum('kind').notNull(),
  source: text('source'),
  externalId: text('external_id').unique(),
  email: text('email').unique().notNull(),
  isLoggedIn: boolean('is_logged_in').default(false).notNull(),
  isSeekingGame: boolean('is_seeking_game').default(false).notNull(),
  lastLogIn: timestamp('last_log_in'),
  lastLogOut: timestamp('last_log_out'),
  preferences: jsonb('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dbCreatePlayer = async (
  playerInitialized: NodotsPlayerInitialized,
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsPlayerReady> => {
  const player: typeof PlayersTable.$inferInsert = {
    ...playerInitialized,
    kind: 'ready',
  }
  console.log('[dbCreatePlayer] player:', player)
  const result = (await db
    .insert(PlayersTable)
    .values(player)
    .returning()) as unknown as NodotsPlayerReady
  console.log('bgapi> [dbCreatePlayer] result:', result)
  return result
}

export const dbLoginPlayer = async (
  id: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  console.log('bgapi> [dbLoginPlayer] id:', id)
  const result = await db
    .update(PlayersTable)
    .set({
      kind: 'ready',
      isLoggedIn: true,
      lastLogIn: new Date(),
    })
    .where(eq(PlayersTable.id, id))
    .returning()
  return result.length === 1 ? result[0] : null
}

export const dbSetPlayerSeekingGame = async (
  id: string,
  seekingGame: boolean,
  db: NodePgDatabase<Record<string, never>>
) => {
  console.log(
    'bgapi> [dbSetPlayerSeekingGame] id:',
    id,
    'seekingGame:',
    seekingGame
  )
  const result = await db
    .update(PlayersTable)
    .set({
      kind: 'ready',
      isSeekingGame: seekingGame,
      updatedAt: new Date(),
    })
    .where(eq(PlayersTable.id, id))
    .returning()
  console.log('bgapi> [dbSetPlayerSeekingGame] result:', result)
  return result[0] ? result[0] : null
}

export const dbSetPlayerPlaying = async (
  id: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  console.log('bgapi> [dbSetPlayerPlaying] id:', id)
  const result = await db
    .update(PlayersTable)
    .set({
      kind: 'playing',
      updatedAt: new Date(),
    })
    .where(eq(PlayersTable.id, id))
    .returning()
  console.log('bgapi> [dbSetPlayerPlaying] result:', result)
  return result[0] ? result[0] : null
}

export const dbLogoutPlayer = async (
  id: string,
  db: NodePgDatabase<Record<string, never>>
) =>
  await db
    .update(PlayersTable)
    .set({
      kind: 'ready',
      isLoggedIn: false,
      lastLogOut: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(PlayersTable.id, id))
    .returning()

export const dbGetPlayers = async (db: NodePgDatabase<Record<string, never>>) =>
  await db.select().from(PlayersTable)

export const dbGetPlayerById = async (
  id: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  const result = await db
    .select()
    .from(PlayersTable)
    .where(and(eq(PlayersTable.id, id)))
    .limit(1)
  return result?.length === 1 ? result[0] : null
}

export const dbGetPlayersSeekingGame = async (
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsPlayerReady[]> => {
  const result = await db
    .select()
    .from(PlayersTable)
    .where(
      and(
        eq(PlayersTable.kind, 'ready'),
        eq(PlayersTable.isSeekingGame, true),
        eq(PlayersTable.isLoggedIn, true)
      )
    )
  console.log('bgapi> [dbGetPlayersSeekingGame] result:', result)
  return result as NodotsPlayerReady[]
}

export const dbGetOpponents = async (
  playerId: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  const result = await db
    .select()
    .from(PlayersTable)
    .where(
      and(
        ne(PlayersTable.id, playerId),
        eq(PlayersTable.kind, 'ready'),
        eq(PlayersTable.isLoggedIn, true),
        eq(PlayersTable.isSeekingGame, true)
      )
    )
  console.log('bgapi> [dbGetOpponents] result:', result)
  return result as NodotsPlayerReady[]
}

export const dbGetPlayerByExternalSource = async (
  reference: ExternalPlayerReference,
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsPlayer | null> => {
  const { source, externalId } = reference
  const result = (await db
    .select()
    .from(PlayersTable)
    .where(
      and(
        eq(PlayersTable.source, source),
        eq(PlayersTable.externalId, externalId)
      )
    )
    .limit(1)) as NodotsPlayer[]

  return result.length === 1 ? result[0] : null
}

export const dbUpdatePlayerPreferences = async (
  id: string,
  preferences: UpdatedPlayerPreferences,
  db: NodePgDatabase<Record<string, never>>
) => {
  return await db
    .update(PlayersTable)
    .set({
      preferences,
      updatedAt: new Date(),
    })
    .where(eq(PlayersTable.id, id))
    .returning()
}
