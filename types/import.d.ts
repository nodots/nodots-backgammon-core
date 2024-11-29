import { BackgammonCheckercontainerPosition } from './game'
import { BackgammonPlayerCheckers } from './player'

export interface BackgammonCheckercontainerImport {
  position: BackgammonCheckercontainerPosition
  direction?: 'clockwise' | 'counterclockwise'
  checkers: {
    qty: number
    color: BackgammonColor
  }
}

export interface BackgammonBoardImports {
  clockwise: BackgammonCheckercontainerImport[]
  counterclockwise: BackgammonCheckercontainerImport[]
}
