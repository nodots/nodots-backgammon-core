import { BackgammonChecker } from './checker'
import { BackgammonPoint } from './checkercontainer'
import { BackgammonColor } from './game'

type BarPosition = 'bar'
type OffPosition = 'off'

interface BackgammonPointPosition {
  clockwise: BackgammonPointValue
  counterclockwise: BackgammonPointValue
}

export type CheckercontainerPosition =
  | BackgammonPointPosition
  | BarPosition
  | OffPosition

type CheckerContainerKind = 'point' | 'bar' | 'off'
export type BackgammonCheckercontainer = {
  id: string
  kind: CheckerContainerKind
  position: CheckercontainerPosition
  checkers: BackgammonChecker[]
}

export interface BackgammonPoint extends BackgammonCheckercontainer {
  kind: 'point'
  position: {
    clockwise: BackgammonPointValue
    counterclockwise: BackgammonPointValue
  }
}

export interface BackgammonBar extends BackgammonCheckercontainer {
  kind: 'bar'
  direction: BackgammonMoveDirection
  position: BarPosition
}

export type BackgammonBarContainer = {
  [direction in BackgammonMoveDirection]: BackgammonBar
}
export interface BackgammonOff extends BackgammonCheckercontainer {
  kind: 'off'
  direction: BackgammonMoveDirection
  position: OffPosition
}

export type BackgammonOffContainer = {
  [direction in BackgammonMoveDirection]: BackgammonOff
}

export type BackgammonPointValue =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24

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

export type BackgammonMoveOrigin = BackgammonPoint | BackgammonBar
export type BackgammonMoveDestination = BackgammonPoint | BackgammonOff
