import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq, and } from 'drizzle-orm'
import { generateId } from '..'

import { jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { PlayInitializing } from '../../backgammon-types'

export const PlayTypeEnum = pgEnum('play-kind', [
  'play-initializing',
  'play-initialized',
  'play-rolling',
  'play-dice-switched',
  'play-moving',
  'play-doubling',
  'play-confirming',
  'play-completed',
])

export const PlaysTable = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  kind: PlayTypeEnum('kind'),
  gameId: uuid('gameId').notNull(),
  playerId: uuid('playerId').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const dbCreatePlay = async (
  play: PlayInitializing,
  db: NodePgDatabase<Record<string, never>>
) => {
  console.log('dbCreatePlay', play)
}
// export const getAll = async (db: NodePgDatabase<Record<string, never>>) =>
//   await db.select().from(GamesTable)
