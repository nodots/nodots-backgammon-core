import { CheckercontainerPosition } from './game'

export interface NodotsCheckercontainerImport {
  position: CheckercontainerPosition
  checkercount: number
}

export interface NodotsBoardImports {
  clockwise: NodotsCheckercontainerImport[]
  counterclockwise: NodotsCheckercontainerImport[]
}
