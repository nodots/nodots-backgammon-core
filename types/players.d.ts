import {
  NodotsPlayerReady,
  NodotsPlayerPlaying,
  NodotsPlayerInitializing,
} from './player'

export interface NodotsPlayersInitializing {
  black: NodotsPlayerInitializing
  white: NodotsPlayerInitializing
}

export interface NodotsPlayersReady {
  black: NodotsPlayerReady
  white: NodotsPlayerReady
}
export interface NodotsPlayersPlaying {
  black: NodotsPlayerPlaying
  white: NodotsPlayerPlaying
}
