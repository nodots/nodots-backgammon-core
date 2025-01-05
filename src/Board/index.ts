import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckercontainer,
  BackgammonCheckercontainerImport,
  BackgammonColor,
  BackgammonGameActive,
  BackgammonOff,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
  BarPosition,
  CheckercontainerCheckers,
  OffPosition,
} from '../../types'
import { buildCheckersForCheckercontainerId } from '../Checker'
import { BOARD_IMPORT_DEFAULT } from './BOARD_IMPORT_DEFAULT'

export const BOARD_POINT_COUNT = 24
export class Board implements BackgammonBoard {
  points: BackgammonPoints
  bar: {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  }
  off: {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  }

  constructor() {
    const board = this.buildBoard()
    this.points = board.points
    this.off = board.off
    this.bar = board.bar
  }

  static getCheckers(board: BackgammonBoard): BackgammonChecker[] {
    const checkercontainers = Board.getCheckercontainers(board)
    const checkers: BackgammonChecker[] = []

    checkercontainers.map((checkercontainer) =>
      checkers.push(...checkercontainer.checkers)
    )
    return checkers
  }

  static getCheckersForColor(
    board: BackgammonBoard,
    color: BackgammonColor
  ): BackgammonChecker[] {
    return Board.getCheckers(board).filter((checker) => checker.color === color)
  }

  static getPoints = (board: BackgammonBoard): BackgammonPoint[] => board.points
  static getBars = (board: BackgammonBoard): BackgammonBar[] => [
    board.bar.clockwise,
    board.bar.counterclockwise,
  ]

  static getOffs = (board: BackgammonBoard): BackgammonOff[] => [
    board.off.clockwise,
    board.off.counterclockwise,
  ]

  static getCheckercontainers = (
    board: BackgammonBoard
  ): BackgammonCheckercontainer[] => {
    const points = Board.getPoints(board) as BackgammonCheckercontainer[]
    const bar = Board.getBars(board) as BackgammonCheckercontainer[]
    const off = Board.getOffs(board) as BackgammonCheckercontainer[]
    return points.concat(...bar).concat(...off)
  }

  static getCheckercontainer = (
    board: BackgammonBoard,
    id: string
  ): BackgammonCheckercontainer => {
    const container = Board.getCheckercontainers(board).find((c) => c.id === id)
    if (!container) {
      throw Error(`No checkercontainer found for ${id}`)
    }
    return container
  }

  static getPipCounts = (game: BackgammonGameActive) => {
    const { board, players } = game
    const pipCounts = {
      black: 167,
      white: 167,
    }

    return pipCounts
  }

  private buildBoard = (): BackgammonBoard => {
    let boardImport: BackgammonCheckercontainerImport[] = BOARD_IMPORT_DEFAULT
    const tempPoints: BackgammonPoint[] = []

    for (let i = 0; i < BOARD_POINT_COUNT; i++) {
      const pointId = generateId()
      const checkers: BackgammonChecker[] = []

      const clockwisePosition = (i + 1) as BackgammonPointValue
      const counterclockwisePosition = (25 -
        clockwisePosition) as BackgammonPointValue

      const point: BackgammonPoint = {
        id: pointId,
        kind: 'point',
        position: {
          clockwise: clockwisePosition,
          counterclockwise: counterclockwisePosition,
        },
        checkers: checkers as CheckercontainerCheckers,
      }
      tempPoints.push(point)
    }

    if (tempPoints.length !== BOARD_POINT_COUNT)
      throw Error('Invalid tempPoints length')

    const points: BackgammonPoints = tempPoints as BackgammonPoints

    const bar = this.buildBar()
    const clockwiseBarSpec = boardImport.find(
      (cc) => cc.position === 'bar' && cc.direction === 'clockwise'
    )
    if (clockwiseBarSpec) {
      if (clockwiseBarSpec.checkers) {
        const checkers = buildCheckersForCheckercontainerId(
          bar.clockwise.id,
          clockwiseBarSpec.checkers.color,
          clockwiseBarSpec.checkers.qty
        )
        bar.clockwise.checkers = checkers
      }
    }

    const counterclockwiseBarSpec = boardImport.find(
      (cc) => cc.position === 'bar' && cc.direction === 'counterclockwise'
    )
    if (counterclockwiseBarSpec) {
      if (counterclockwiseBarSpec.checkers) {
        const checkers = buildCheckersForCheckercontainerId(
          bar.clockwise.id,
          counterclockwiseBarSpec.checkers.color,
          counterclockwiseBarSpec.checkers.qty
        )
        bar.clockwise.checkers = checkers
      }
    }
    const off = this.buildOff()
    const clockwiseOffSpec = boardImport.find(
      (cc) => cc.position === 'off' && cc.direction === 'clockwise'
    )
    if (clockwiseOffSpec) {
      if (clockwiseOffSpec.checkers) {
        const checkers = buildCheckersForCheckercontainerId(
          off.clockwise.id,
          clockwiseOffSpec.checkers.color,
          clockwiseOffSpec.checkers.qty
        )
        off.clockwise.checkers = checkers
      }
    }

    const counterclockwiseOffSpec = boardImport.find(
      (cc) => cc.position === 'off' && cc.direction === 'counterclockwise'
    )
    if (counterclockwiseOffSpec) {
      if (counterclockwiseOffSpec.checkers) {
        const checkers = buildCheckersForCheckercontainerId(
          off.clockwise.id,
          counterclockwiseOffSpec.checkers.color,
          counterclockwiseOffSpec.checkers.qty
        )
        off.clockwise.checkers = checkers
      }
    }
    points.map((point) => {
      // console.log('[buildBoard] point.position', point.position)
      const pointSpec = boardImport.find(
        (cc) =>
          cc.position.clockwise === point.position.clockwise &&
          cc.position.counterclockwise === point.position.counterclockwise
      )
      if (pointSpec) {
        // console.log('[buildBoard] pointSpec:', pointSpec)
        if (pointSpec.checkers) {
          const checkers = buildCheckersForCheckercontainerId(
            point.id,
            pointSpec.checkers.color,
            pointSpec.checkers.qty
          )
          point.checkers = checkers
        }
      }
    })

    const board: BackgammonBoard = {
      points,
      bar,
      off,
    }

    return board
  }

  private buildBar = (): {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  } => {
    const clockwiseId = generateId()
    const counterclockwiseId = generateId()

    const position: BarPosition = 'bar'

    const clockwise: BackgammonBar = {
      id: clockwiseId,
      kind: 'bar',
      position,
      direction: 'clockwise',
      checkers: [],
    }

    const counterclockwise: BackgammonBar = {
      id: counterclockwiseId,
      kind: 'bar',
      position,
      direction: 'counterclockwise',
      checkers: [],
    }

    return {
      clockwise,
      counterclockwise,
    }
  }

  private buildOff = (): {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  } => {
    const clockwiseId = generateId()
    const counterclockwiseId = generateId()

    const position: OffPosition = 'off'

    const clockwise: BackgammonOff = {
      id: clockwiseId,
      kind: 'off',
      position,
      direction: 'clockwise',
      checkers: [],
    }

    const counterclockwise: BackgammonOff = {
      id: counterclockwiseId,
      kind: 'off',
      position,
      direction: 'counterclockwise',
      checkers: [],
    }

    return {
      clockwise,
      counterclockwise,
    }
  }
}
