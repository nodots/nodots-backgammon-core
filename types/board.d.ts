import { BackgammonCheckercontainerPosition } from './game'
import { BackgammonChecker } from './checker'
import {
  BackgammonBar,
  BackgammonOff,
  BackgammonPoints,
} from './checkercontainer'

export interface BackgammonBoard {
  points: BackgammonPoints
  bar: {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  }
  off: {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  }
}
