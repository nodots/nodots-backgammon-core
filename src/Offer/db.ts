import { boolean, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { NodotsOfferPlay } from '../../@types'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq, or } from 'drizzle-orm'
export type OfferKind = 'play' | 'double' | 'resign'

const offerKinds = ['play', 'double', 'resign'] as const

export const OfferTypeEnum = pgEnum('offer-kind', offerKinds)

export interface OfferRecord {
  id: string
  kind: OfferKind
  offeringPlayerId: string
  offeredPlayerId: string
  accepted: boolean
}

export const OffersTable = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  kind: OfferTypeEnum('kind').notNull(),
  offeringPlayerId: uuid('offering_player_id').notNull(),
  offeredPlayerId: uuid('offered_player_id').notNull(),
  accepted: boolean('accepted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dbCreatePlayOffer = async (
  offeringPlayerId: string,
  offeredPlayerId: string,
  db: NodePgDatabase<Record<string, never>>
): Promise<NodotsOfferPlay> => {
  const offer: NodotsOfferPlay = {
    kind: 'play',
    offeringPlayerId: offeringPlayerId,
    offeredPlayerId: offeredPlayerId,
    accepted: false,
  }
  const result = (await db
    .insert(OffersTable)
    .values(offer)
    .returning()) as unknown as NodotsOfferPlay
  return result
}

export const dbGetPlayOffersForPlayerId = async (
  playerId: string,
  db: any
): Promise<NodotsOfferPlay[]> => {
  const offers = (await db
    .select()
    .from(OffersTable)
    .where(eq(OffersTable.kind, 'play'))
    .where(
      or(
        eq(OffersTable.offeredPlayerId, playerId),
        eq(OffersTable.offeringPlayerId, playerId)
      )
    )) as unknown as NodotsOfferPlay[]
  console.log(offers)
  return offers
}

export const dbRespondPlayOffer = async (
  id: string,
  accepted: boolean,
  db: NodePgDatabase<Record<string, never>>
) =>
  await db
    .update(OffersTable)
    .set({
      accepted,
    })
    .where(eq(OffersTable.id, id))
    .returning()
