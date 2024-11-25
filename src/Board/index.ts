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

const buildBar = (
  barImport: [
    BackgammonCheckercontainerImport,
    BackgammonCheckercontainerImport
  ],
  players: BackgammonPlayers
): { clockwise: BackgammonBar; counterclockwise: BackgammonBar } => {
  const clockwiseId = generateId()
  const counterclockwiseId = generateId()

  const clockwiseCheckerSpec = barImport.find(
    (b) => b.position === 'bar'
  )?.checkers
  const counterclockwiseCheckerSpec = barImport.find(
    (b) => b.position === 'bar'
  )?.checkers

  const clockwiseCheckers = buildCheckersForCheckercontainerId(
    clockwiseCheckerSpec
      ? clockwiseCheckerSpec.color
      : players.find((p) => p.direction === 'clockwise')?.color,
    clockwiseId,
    clockwiseCheckerSpec ? clockwiseCheckerSpec.qty : 0
  )

  const counterclockwiseCheckers = buildCheckersForCheckercontainerId(
    counterclockwiseCheckerSpec?.color
      ? clockwiseCheckerSpec?.color
      : players.find((p) => p.direction === 'counterclockwise')?.color,
    counterclockwiseId,
    counterclockwiseCheckerSpec?.qty ? counterclockwiseCheckerSpec.qty : 0
  )

  const position: BarPosition = 'bar'

  const clockwise: BackgammonBar = {
    id: clockwiseId,
    kind: 'bar',
    position,
    direction: 'clockwise',
    checkers: clockwiseCheckers ? clockwiseCheckers : [],
  }

  const counterclockwise: BackgammonBar = {
    id: counterclockwiseId,
    kind: 'bar',
    position,
    direction: 'counterclockwise',
    checkers: counterclockwiseCheckers ? counterclockwiseCheckers : [],
  }

  return {
    clockwise,
    counterclockwise,
  }
}

const buildOff = (
  barImport: [
    BackgammonCheckercontainerImport,
    BackgammonCheckercontainerImport
  ],
  players: BackgammonPlayers
): { clockwise: BackgammonOff; counterclockwise: BackgammonOff } => {
  const clockwiseId = generateId()
  const counterclockwiseId = generateId()

  const clockwiseCheckerSpec = barImport.find(
    (b) => b.position === 'bar'
  )?.checkers
  const counterclockwiseCheckerSpec = barImport.find(
    (b) => b.position === 'bar'
  )?.checkers

  const clockwiseCheckers = buildCheckersForCheckercontainerId(
    clockwiseCheckerSpec
      ? clockwiseCheckerSpec.color
      : players.find((p) => p.direction === 'clockwise')?.color,
    clockwiseId,
    clockwiseCheckerSpec ? clockwiseCheckerSpec.qty : 0
  )

  const counterclockwiseCheckers = buildCheckersForCheckercontainerId(
    counterclockwiseCheckerSpec?.color
      ? clockwiseCheckerSpec?.color
      : players.find((p) => p.direction === 'counterclockwise')?.color,
    counterclockwiseId,
    counterclockwiseCheckerSpec?.qty ? counterclockwiseCheckerSpec.qty : 0
  )

  const position: OffPosition = 'off'

  const clockwise: BackgammonOff = {
    id: clockwiseId,
    kind: 'off',
    position,
    direction: 'clockwise',
    checkers: clockwiseCheckers ? clockwiseCheckers : [],
  }

  const counterclockwise: BackgammonOff = {
    id: counterclockwiseId,
    kind: 'off',
    position,
    direction: 'counterclockwise',
    checkers: counterclockwiseCheckers ? counterclockwiseCheckers : [],
  }

  return {
    clockwise,
    counterclockwise,
  }
}

const defaultClockwiseColor = randomBackgammonColor()
const defaultCounterclockwiseColor =
  defaultClockwiseColor === 'black' ? 'white' : 'black'

const BOARD_IMPORT_DEFAULT: BackgammonCheckercontainerImport[] = [
  {
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: {
      qty: 2,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 24,
      counterclockwise: 1,
    },
    checkers: {
      qty: 2,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 13,
      counterclockwise: 12,
    },
    checkers: {
      qty: 5,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 12,
      counterclockwise: 13,
    },
    checkers: {
      qty: 5,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 8,
      counterclockwise: 17,
    },
    checkers: {
      qty: 3,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 17,
      counterclockwise: 8,
    },
    checkers: {
      qty: 3,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 6,
      counterclockwise: 19,
    },
    checkers: {
      qty: 5,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 19,
      counterclockwise: 6,
    },
    checkers: {
      qty: 5,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 24,
      counterclockwise: 1,
    },
    checkers: {
      qty: 2,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: {
      qty: 2,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 13,
      counterclockwise: 12,
    },
    checkers: {
      qty: 5,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 12,
      counterclockwise: 13,
    },
    checkers: {
      qty: 5,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 8,
      counterclockwise: 17,
    },
    checkers: {
      qty: 3,
      color: defaultCounterclockwiseColor,
    },
  },
]

export const buildBoard = (players: BackgammonPlayers): BackgammonBoard => {
  let boardImport: BackgammonCheckercontainerImport[] = BOARD_IMPORT_DEFAULT

  const tempPoints: BackgammonPoint[] = []
  // console.log('[Board] buildBoard boardImport:', boardImport)
  const clockwiseColor = players.find((p) => p.direction === 'clockwise')?.color
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

  for (let i = 0; i < 24; i++) {
    const pointId = generateId()
    const checkers: BackgammonChecker[] = []

    const clockwisePosition = (i + 1) as BackgammonPointValue
    const counterclockwisePosition = (25 -
      clockwisePosition) as BackgammonPointValue

    const clockwiseColor = players.find(
      (p) => p.direction === 'clockwise'
    )?.color
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

    boardImport.map((checkerbox) => {
      if (
        checkerbox.position.clockwise === clockwisePosition &&
        checkerbox.checkers.color === clockwiseColor
      ) {
        const checkercount = checkerbox.checkers.qty
        checkers.push(
          ...buildCheckersForCheckercontainerId(
            clockwiseColor,
            pointId,
            checkercount
          )
        )
      } else if (
        checkerbox.position.counterclockwise === counterclockwisePosition &&
        checkerbox.checkers.color === counterclockwiseColor
      ) {
        const checkercount = checkerbox.checkers.qty
        checkers.push(
          ...buildCheckersForCheckercontainerId(
            counterclockwiseColor,
            pointId,
            checkercount
          )
        )
      }
    })

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

  if (tempPoints.length === 24) {
    const points: BackgammonPoints = tempPoints as BackgammonPoints

    const barImports: [
      BackgammonCheckercontainerImport,
      BackgammonCheckercontainerImport
    ] = [
      {
        position: 'bar',
        checkers: {
          qty: 0,
          color: clockwiseColor,
        },
      },
      {
        position: 'bar',
        checkers: {
          qty: 0,
          color: counterclockwiseColor,
        },
      },
    ]

    const offImports: [
      BackgammonCheckercontainerImport,
      BackgammonCheckercontainerImport
    ] = [
      {
        position: 'off',
        checkers: {
          qty: 0,
          color: clockwiseColor,
        },
      },
      {
        position: 'off',
        checkers: {
          qty: 0,
          color: counterclockwiseColor,
        },
      },
    ]
    const bar = buildBar(barImports, players)
    const off = buildOff(offImports, players)
    return {
      points,
      bar,
      off,
    }
  } else {
    throw Error(`invalid tempPoints length ${tempPoints.length}`)
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
