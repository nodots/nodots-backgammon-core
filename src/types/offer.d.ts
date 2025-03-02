import { BackgammonPlayerReady } from './player'

interface Offer {
  offeringPlayerId: string
  offeredPlayerId: string
  kind: 'play' | 'double' | 'resign'
}

export interface OfferPlay extends Offer {
  kind: 'play'
  accepted: boolean
}

export interface OfferDouble extends Offer {
  kind: 'double'
  accepted: boolean
}

export interface OfferResign extends Offer {
  kind: 'resign'
  accepted: boolean
}

export type Offer = OfferPlay | OfferDouble | OfferResign
