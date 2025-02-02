import { generateId } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckercontainer,
  BackgammonCheckercontainerImport,
  BackgammonColor,
  BackgammonGame,
  BackgammonMoveDirection,
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
    destination: BackgammonPoint | BackgammonOff, // Note that this means that hit has to be a different function
    direction: BackgammonMoveDirection
  ): BackgammonBoard {
    const opponentDirection =
      direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
    const opponentBarClone = JSON.parse(
      JSON.stringify(board.bar[opponentDirection])
    )

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

    // handle hit
    if (
      destination.checkers.length === 1 &&
      destination.checkers[0].color !== origin.checkers[0].color
    ) {
      const hitChecker = destinationClone.checkers.pop()
      if (!hitChecker) throw Error('No hit checker found')
      opponentBarClone.checkers.push(hitChecker)
    }

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

    const bar = this.buildBar(boardImport)
    const off = this.buildOff(boardImport)

    const board: BackgammonBoard = {
      id: generateId(),
      points,
      bar,
      off,
    }

    return board
  }

  private static buildBar(boardImport: BackgammonCheckercontainerImport[]): {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  } {
    const clockwiseId = generateId()
    const counterclockwiseId = generateId()
    const barImport = boardImport.filter((cc) => cc.position === 'bar')
    const clockwiseBarImport = barImport.find(
      (b) => b.direction === 'clockwise'
    )

    let clockwiseCheckerCount = 0
    const clockwiseCheckers = []

    if (clockwiseBarImport) {
      if (clockwiseBarImport.checkers) {
        clockwiseCheckerCount = clockwiseBarImport.checkers.qty
      }
      clockwiseCheckers.push(
        ...buildCheckersForCheckercontainerId(
          clockwiseId,
          clockwiseBarImport.checkers.color,
          clockwiseCheckerCount
        )
      )
    }

    const counterclockwiseBarImport = barImport.find(
      (b) => b.direction === 'counterclockwise'
    )

    let counterclockwiseCheckerCount = 0
    const counterclockwiseCheckers = []

    if (counterclockwiseBarImport) {
      if (counterclockwiseBarImport.checkers) {
        counterclockwiseCheckerCount = counterclockwiseBarImport.checkers.qty
      }
      counterclockwiseCheckers.push(
        ...buildCheckersForCheckercontainerId(
          counterclockwiseId,
          counterclockwiseBarImport.checkers.color,
          counterclockwiseCheckerCount
        )
      )
    }

    return {
      clockwise: {
        id: clockwiseId,
        kind: 'bar',
        position: 'bar',
        direction: 'clockwise',
        checkers: clockwiseCheckers,
      },
      counterclockwise: {
        id: counterclockwiseId,
        kind: 'bar',
        position: 'bar',
        direction: 'counterclockwise',
        checkers: counterclockwiseCheckers,
      },
    }
  }

  private static buildOff(boardImport: BackgammonCheckercontainerImport[]): {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  } {
    const offImport = boardImport.filter((cc) => cc.position === 'off')
    const clockwiseOffImport = offImport.find(
      (b) => b.direction === 'clockwise'
    )
    const counterclockwiseOffImport = offImport.find(
      (b) => b.direction === 'counterclockwise'
    )

    const clockwiseCheckers = []
    if (clockwiseOffImport) {
      if (clockwiseOffImport.checkers) {
        const checkerCount = clockwiseOffImport.checkers.qty
        clockwiseCheckers.push(
          ...buildCheckersForCheckercontainerId(
            generateId(),
            clockwiseOffImport.checkers.color,
            checkerCount
          )
        )
      }
    }

    const counterclockwiseCheckers = []
    if (counterclockwiseOffImport) {
      if (counterclockwiseOffImport.checkers) {
        const checkerCount = counterclockwiseOffImport.checkers.qty
        counterclockwiseCheckers.push(
          ...buildCheckersForCheckercontainerId(
            generateId(),
            counterclockwiseOffImport.checkers.color,
            checkerCount
          )
        )
      }
    }

    return {
      clockwise: {
        id: generateId(),
        kind: 'off',
        position: 'off',
        direction: 'clockwise',
        checkers: clockwiseCheckers,
      },
      counterclockwise: {
        id: generateId(),
        kind: 'off',
        position: 'off',
        direction: 'counterclockwise',
        checkers: counterclockwiseCheckers,
      },
    }
  }
}
