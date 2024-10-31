import { NodotsLocaleCode } from '.'
import { NodotsColor, NodotsMoveDirection } from './game'

/**
 * These are types because they are idiosyncratic to this way of
 * tracking move direction and representation of that direction.
 * They are explicitly NOT exported from the player module.
 */
type _Player = {
  kind: NodotsPlayerKind
  isSeekingGame: boolean
  isLoggedIn: boolean
  id?: string
  email?: string
  source?: string
  externalId?: string
  preferences?: NodotsPlayerPreferences
}
export type NodotsPlayerKind =
  | 'initializing'
  | 'initialized'
  | 'ready'
  | 'playing'

export interface NodotsPlayerPreferences {
  username?: string
  givenName?: string
  familyName?: string
  avatar?: string
  color?: NodotsColor
  direction?: NodotsMoveDirection
  locale?: NodotsLocaleCode
  automation?: {
    roll: boolean
    move: boolean
  }
}

export interface NodotsPlayerInitializing extends _Player {
  kind: 'initializing'
  isLoggedIn: false
  isSeekingGame: false
  email?: string
  source?: string
  externalId?: string
  preferences?: NodotsPlayerPreferences
}

export interface NodotsPlayerInitialized extends _Player {
  kind: 'initialized'
  isLoggedIn: boolean
  isSeekingGame: boolean
  email: string
  source: string
  externalId: string
  preferences: NodotsPlayerPreferences
}

export interface NodotsPlayerReady extends _Player {
  id: string
  kind: 'ready'
  source: string
  externalId: string
  email: string
  isSeekingGame: boolean
  isLoggedIn: true
}

export interface NodotsPlayerPlaying extends _Player {
  id: string
  kind: 'playing'
  source: string
  externalId: string
  email: string
  isSeekingGame: boolean
  isLoggedIn: true
}

export type NodotsPlayer =
  | NodotsPlayerInitializing
  | NodotsPlayerInitialized
  | NodotsPlayerReady
  | NodotsPlayerPlaying
