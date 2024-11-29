import { BackgammonColor } from './game'
import { BackgammonPlayerCheckers } from './player'

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
