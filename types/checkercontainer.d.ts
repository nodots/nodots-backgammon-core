import { NodotsChecker } from './checker'
import { NodotsColor, PointPosition } from './game'

export type NodotsCheckercontainer = {
  id: string
  kind: string
  checkers: NodotsChecker[]
}

export interface Point extends NodotsCheckercontainer {
  kind: 'point'
  position: {
    clockwise: PointPosition
    counterclockwise: PointPosition
  }
}

export interface Bar extends NodotsCheckercontainer {
  kind: 'bar'
  color: NodotsColor
  position: 'bar'
}

export interface Off extends NodotsCheckercontainer {
  kind: 'off'
  color: NodotsColor
  position: 'off'
}
