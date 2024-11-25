import { BackgammonColor, BackgammonPlayerCheckers } from './game'

export interface BackgammonChecker {
  id: string
  color: BackgammonColor
  checkercontainerId: string
  highlight?: boolean
}

export interface BackgammonCheckers {
  white: BackgammonPlayerCheckers
  black: BackgammonPlayerCheckers
}
