import {
  BackgammonBar,
  BackgammonOff,
  BackgammonPoints,
  BackgammonCheckercontainer,
  BackgammonCheckercontainerImport,
  BackgammonChecker,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonMoveDirection,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
  BackgammonPoint,
  BackgammonPointValue,
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

export interface BoardClass {
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

  initialize: (
    boardImport?: BackgammonCheckercontainerImport[]
  ) => BackgammonBoard
  moveChecker: (
    board: BackgammonBoard,
    origin: BackgammonPoint | BackgammonBar,
    destination: BackgammonPoint | BackgammonOff,
    direction: BackgammonMoveDirection
  ) => BackgammonBoard
  getCheckers: (board: BackgammonBoard) => BackgammonChecker[]
  getCheckersForColor: (
    board: BackgammonBoard,
    color: BackgammonColor
  ) => BackgammonChecker[]
  getPoints: (board: BackgammonBoard) => BackgammonPoint[]
  getBars: (board: BackgammonBoard) => BackgammonBar[]
  getOffs: (board: BackgammonBoard) => BackgammonOff[]
  getCheckercontainers: (board: BackgammonBoard) => BackgammonCheckercontainer[]
  getCheckercontainer: (
    board: BackgammonBoard,
    id: string
  ) => BackgammonCheckercontainer
  getPossibleMoves: (
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue
  ) => BackgammonMoveSkeleton[]
  getPipCounts: (game: BackgammonGame) => { black: number; white: number }
  buildBoard: (
    boardImport: BackgammonCheckercontainerImport[]
  ) => BackgammonBoard
  generateRandomBoard: () => BackgammonBoard
  getAsciiBoard: (board: BackgammonBoard) => string
  displayAsciiBoard: (board: BackgammonBoard | undefined) => void
}
