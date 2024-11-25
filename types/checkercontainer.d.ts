import { BackgammonChecker } from './checker'
import { BackgammonColor, BackgammonPointValue } from './game'

type BarPosition = 'bar'
type OffPosition = 'off'

interface BackgammonPointPosition {
  clockwise: BackgammonPointValue
  counterclockwise: BackgammonPointValue
}

export type CheckercontainerCheckers =
  | []
  | [BackgammonChecker]
  | [BackgammonChecker, BackgammonChecker]
  | [BackgammonChecker, BackgammonChecker, BackgammonChecker]
  | [BackgammonChecker, BackgammonChecker, BackgammonChecker, BackgammonChecker]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]
  | [
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker,
      BackgammonChecker
    ]

export type CheckercontainerPosition =
  | BackgammonPointPosition
  | BarPosition
  | OffPosition

type CheckerContainerKind = 'point' | 'bar' | 'off'
export type BackgammonCheckercontainer = {
  id: string
  kind: CheckerContainerKind
  position: CheckercontainerPosition
  checkers: CheckercontainerCheckers
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
  direction: BackgammonDirection
  position: BarPosition
}

export interface BackgammonBarContainer {
  clockwise: BackgammonBar
  counterclockwise: BackgammonBar
}

export interface BackgammonOff extends BackgammonCheckercontainer {
  kind: 'off'
  direction: BackgammonDirection
  position: OffPosition
}

export interface BackgammonOffContainer {
  clockwise: BackgammonOff
  counterclockwise: BackgammonOff
}
