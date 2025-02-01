import { generateId } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckercontainer,
  BackgammonCheckercontainerImport,
  BackgammonColor,
  BackgammonGame,
  BackgammonOff,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
  OffPosition,
} from '../../types'
import { buildCheckersForCheckercontainerId } from '../Checker'
import { BOARD_IMPORT_DEFAULT } from './imports'

export const BOARD_POINT_COUNT = 24

export class Board implements BackgammonBoard {
  id!: string
  points!: BackgammonPoints
  bar!: {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  }
  off!: {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  }

  public static initialize(
    boardImport?: BackgammonCheckercontainerImport[]
  ): BackgammonBoard {
    if (!boardImport) boardImport = BOARD_IMPORT_DEFAULT
    return Board.buildBoard(boardImport)
  }

  // Note that this does NOT actually update the board. Separate action.
  public static moveChecker(
    board: BackgammonBoard,
    origin: BackgammonPoint | BackgammonBar,
    destination: BackgammonPoint | BackgammonOff // Note that this means that hit has to be a different function
  ): BackgammonBoard {
    const boardClone: BackgammonBoard = JSON.parse(JSON.stringify(board))
    const originClone: BackgammonCheckercontainer = JSON.parse(
      JSON.stringify(origin)
    )
    const destinationClone: BackgammonCheckercontainer = JSON.parse(
      JSON.stringify(destination)
    )

    const checker = originClone.checkers.pop()
    if (!checker) throw Error('No checker found')
    destinationClone.checkers.push(checker)

    this.getCheckercontainers(boardClone).map((cc) => {
      if (cc.id === originClone.id) {
        cc.checkers = originClone.checkers
      }
      if (cc.id === destinationClone.id) {
        cc.checkers = destinationClone.checkers
      }
    })

    return boardClone
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

  static getPipCounts = (game: BackgammonGame) => {
    const { board, players } = game
    const pipCounts = {
      black: 167,
      white: 167,
    }

    return pipCounts
  }

  // public static generateRandomBoard = (): BackgammonBoard => Board.buildBoard()

  // private buildBoard = (): BackgammonBoard => {

  public static buildBoard(
    boardImport: BackgammonCheckercontainerImport[]
  ): BackgammonBoard {
    if (!boardImport) boardImport = BOARD_IMPORT_DEFAULT
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
        checkers: checkers,
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
      id: generateId(),
      points,
      bar,
      off,
    }

    return board
  }

  private static buildBar() {
    const clockwiseId = generateId()
    const counterclockwiseId = generateId()

    const clockwise: BackgammonBar = {
      id: clockwiseId,
      kind: 'bar',
      position: 'bar',
      direction: 'clockwise',
      checkers: [],
    }

    const counterclockwise: BackgammonBar = {
      id: counterclockwiseId,
      kind: 'bar',
      position: 'bar',
      direction: 'counterclockwise',
      checkers: [],
    }

    return {
      clockwise,
      counterclockwise,
    }
  }

  private static buildOff() {
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
