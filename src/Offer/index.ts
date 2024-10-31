import { NodePgDatabase } from 'drizzle-orm/node-postgres'

import {
  dbCreatePlayOffer,
  dbGetPlayOffersForPlayerId,
  dbRespondPlayOffer,
} from './db'
import { NodotsOfferPlay } from '../../backgammon-types'

export const createPlayOffer = async (
  playerId: string,
  opponentId: string,
  db: NodePgDatabase
): Promise<NodotsOfferPlay> => await dbCreatePlayOffer(playerId, opponentId, db)

export const getPlayOffersForPlayerId = async (
  playerId: string,
  db: NodePgDatabase<Record<string, never>>
) => await dbGetPlayOffersForPlayerId(playerId, db)

export const respondToPlayOffer = async (
  offerId: string,
  accepted: boolean,
  db: NodePgDatabase<Record<string, never>>
) => await dbRespondPlayOffer(offerId, accepted, db)
