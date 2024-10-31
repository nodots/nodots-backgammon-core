import { NodotsColor } from './game'

export type DieValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type DieOrder = 0 | 1
export type NodotsRoll = [DieValue, DieValue]

export type NodotsDiceKind = 'inactive' | 'ready' | 'rolled'

export type NodotsPlayerDice = {
  kind: NodotsDiceKind
  color: NodotsColor
  roll: NodotsRoll
}

export type NodotsDice = {
  white: NodotsPlayerDice
  black: NodotsPlayerDice
}
