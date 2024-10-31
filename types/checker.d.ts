import { NodotsColor, PlayerCheckers } from './game'

export interface NodotsChecker {
  id: string
  color: NodotsColor
  checkercontainerId: string
  highlight?: boolean
}

export interface NodotsGameCheckers {
  white: PlayerCheckers
  black: PlayerCheckers
}
