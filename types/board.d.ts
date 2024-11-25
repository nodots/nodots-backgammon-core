import { BackgammonCheckercontainerPosition } from './game'
import { BackgammonChecker } from './checker'
import {
  BackgammonBar,
  BackgammonOff,
  BackgammonPoint,
} from './checkercontainer'

export type Latitude = 'north' | 'south'
export type Longitude = 'east' | 'west'

export type BackgammonPoints = [
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint,
  BackgammonPoint
]

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
