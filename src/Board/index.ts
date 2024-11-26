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
  BackgammonPlayers,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
  BarPosition,
  CheckercontainerCheckers,
  OffPosition,
} from '../../types'
import { buildCheckersForCheckercontainerId } from '../Checker'
import { BOARD_IMPORT_DEFAULT } from './BOARD_IMPORT_DEFAULT'

export const defaultClockwiseColor = randomBackgammonColor()
export const defaultCounterclockwiseColor =
  defaultClockwiseColor === 'black' ? 'white' : 'black'

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
  constructor(players: BackgammonPlayers) {
    const board = this.buildBoard(players)
    this.points = board.points
    this.off = board.off
    this.bar = board.bar
  }

  private buildBoard = (players: BackgammonPlayers): BackgammonBoard => {
    let boardImport: BackgammonCheckercontainerImport[] = BOARD_IMPORT_DEFAULT
    const clockwiseColor = players.find(
      (p) => p.direction === 'clockwise'
    )?.color
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
    const tempPoints: BackgammonPoint[] = []

    for (let i = 0; i < 24; i++) {
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

    if (tempPoints.length !== 24) throw Error('Invalid tempPoints length')

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

  buildBar = (): {
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

  buildOff = (): {
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

export const getCheckers = (board: BackgammonBoard): BackgammonChecker[] => {
  const checkercontainers = getCheckercontainers(board)
  const checkers: BackgammonChecker[] = []

  checkercontainers.map((checkercontainer) =>
    checkers.push(...checkercontainer.checkers)
  )
  return checkers
}

export const getCheckersForColor = (
  board: BackgammonBoard,
  color: BackgammonColor
): BackgammonChecker[] =>
  getCheckers(board).filter((checker) => checker.color === color)

export const getPoints = (board: BackgammonBoard): BackgammonPoint[] =>
  board.points
export const getBars = (board: BackgammonBoard): BackgammonBar[] => [
  board.bar.clockwise,
  board.bar.counterclockwise,
]

export const getOffs = (board: BackgammonBoard): BackgammonOff[] => [
  board.off.clockwise,
  board.off.counterclockwise,
]

export const getCheckercontainers = (
  board: BackgammonBoard
): BackgammonCheckercontainer[] => {
  const points = getPoints(board) as BackgammonCheckercontainer[]
  const bar = getBars(board) as BackgammonCheckercontainer[]
  const off = getOffs(board) as BackgammonCheckercontainer[]
  return points.concat(...bar).concat(...off)
}

export const getCheckercontainer = (
  board: BackgammonBoard,
  id: string
): BackgammonCheckercontainer => {
  const container = getCheckercontainers(board).find((c) => c.id === id)
  if (!container) {
    throw Error(`No checkercontainer found for ${id}`)
  }
  return container
}

export const getPipCounts = (game: BackgammonGameActive) => {
  const { board, players } = game
  const pipCounts = {
    black: 167,
    white: 167,
  }

  return pipCounts
}
