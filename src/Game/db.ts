import { eq, sql } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import {
  NodotsGameInitializing,
  NodotsGameRollingForStart,
  isValidUuid,
} from '../../@types'
import { GameStateError } from './errors'

export const ColorEnum = pgEnum('color', ['black', 'white'])
export const DirectionEnum = pgEnum('direction', [
  'clockwise',
  'counterclockwise',
])

const gameKind = ['proposed', 'rolling-for-start', 'rolling', 'moving'] as const

export const GameTypeEnum = pgEnum('game-kind', gameKind)

export const GamesTable = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  kind: GameTypeEnum('kind').notNull(),
  players: jsonb('players').notNull(),
  board: jsonb('board').notNull(),
  cube: jsonb('cube').notNull(),
  dice: jsonb('dice').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dbCreateGame = async (
  gameInitializing: NodotsGameInitializing,
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsGameRollingForStart> => {
  if (gameInitializing.players.length !== 2) {
    throw GameStateError(
      `[Game API DB] dbCreateGame: Invalid number of players ${gameInitializing.players.length}`
    )
  }
  if (
    gameInitializing.players[0].playerId ===
    gameInitializing.players[1].playerId
  ) {
    throw GameStateError(
      `[Game API DB] dbCreateGame: Player1 === Player2 ${gameInitializing.players[0].playerId}`
    )
  }
  const game: typeof GamesTable.$inferInsert = {
    ...gameInitializing,
    kind: 'proposed',
    players: [
      {
        playerId: gameInitializing.players[0].playerId,
        color: gameInitializing.players[0].color,
        direction: gameInitializing.players[0].direction,
        pipCount: gameInitializing.players[0].pipCount,
      },
      {
        playerId: gameInitializing.players[1].playerId,
        color: gameInitializing.players[1].color,
        direction: gameInitializing.players[1].direction,
        pipCount: gameInitializing.players[1].pipCount,
      },
    ],
  }
  const result = await db.insert(GamesTable).values(game).returning()
  if (result.length !== 1) {
    throw GameStateError('[Game API DB] dbCreateGame: Game not created')
  }
  return result[0] as NodotsGameRollingForStart
}

export const dbGetAll = async (db: NodePgDatabase<Record<string, never>>) =>
  await db.select().from(GamesTable)

export const dbGetGame = async (
  gameId: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  if (!isValidUuid(gameId)) {
    return console.error('[Game API DB] dbGetGame Invalid gameId:', gameId)
  }
  const game = await db
    .select()
    .from(GamesTable)
    .where(eq(GamesTable.id, gameId))
    .limit(1)
  if (!game) {
    console.error('No game found')
  }
  return game
}

// '9b311cbb-e0d2-4d7b-ad91-b629aa2c7612'
// ATM players can only have one active game. But this is not enforced in the db
export const dbGetActiveGameByPlayerId = async (
  playerId: string,
  db: NodePgDatabase<Record<string, never>>
) => {
  // FIXME: Not loving using 'sql' but drizzle seems to still have problems w jsonb

  const result = await db.execute(
    sql`SELECT * FROM games WHERE players->0->>'playerId' = ${playerId} OR players->1->>'playerId' = ${playerId}`
  )
  console.log(
    `[Game API Db] dbGetActiveGameByPlayerId ${playerId} result:`,
    result.rows
  )
  return result.rows
}
