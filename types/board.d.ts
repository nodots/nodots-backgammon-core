import {
  BackgammonBar,
  BackgammonOff,
  BackgammonPoints,
} from './checkercontainer'

export interface BackgammonBoard {
  id: string
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

export type Quadrant = [Point, Point, Point, Point, Point, Point]

export interface HomeBoard {
  points: Quadrant
}
