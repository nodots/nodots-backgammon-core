import { NodotsPlayerReady } from './player'

interface Offer {
  offeringPlayerId: string
  offeredPlayerId: string
  kind: 'play' | 'double' | 'resign'
}

export interface NodotsOfferPlay extends Offer {
  kind: 'play'
  accepted: boolean
}

export interface NodotsOfferDouble extends Offer {
  kind: 'double'
  accepted: boolean
}

export interface NodotsOfferResign extends Offer {
  kind: 'resign'
  accepted: boolean
}

export type NodotsOffer =
  | NodotsOfferPlay
  | NodotsOfferDouble
  | NodotsOfferResign
