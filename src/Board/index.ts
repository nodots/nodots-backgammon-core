import {
  Checker,
  generateId,
  Player,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckercontainer,
  BackgammonCheckercontainerImport,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonMoveDestination,
  BackgammonMoveDirection,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonOff,
  BackgammonPlayer,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
  BackgammonRoll,
} from '../types'
import { ascii } from './ascii'
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
    origin: BackgammonMoveOrigin,
    destination: BackgammonMoveDestination, // Note that this means that hit has to be a different function
    direction: BackgammonMoveDirection
  ): BackgammonBoard {
    const opponentDirection =
      direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
    const opponentBar = board.bar[opponentDirection]
    const opponentBarClone: BackgammonCheckercontainer = JSON.parse(
      JSON.stringify(opponentBar)
    )
    const boardClone: BackgammonBoard = JSON.parse(JSON.stringify(board))
    const originClone: BackgammonCheckercontainer = JSON.parse(
      JSON.stringify(origin)
    )
    const destinationClone: BackgammonCheckercontainer = JSON.parse(
      JSON.stringify(destination)
    )

    // handle hit
    if (
      destinationClone.checkers.length === 1 &&
      destinationClone.checkers[0].color !== originClone.checkers[0].color
    ) {
      const hitChecker = destinationClone.checkers.pop()
      if (!hitChecker) throw Error('No checker found')
      opponentBarClone.checkers.push(hitChecker)
    }

    const checker = originClone.checkers.pop()
    if (!checker) throw Error('No checker found')
    destinationClone.checkers.push(checker)

    this.getCheckercontainers(boardClone).forEach(
      function updateCheckerContainers(cc) {
        if (cc.id === originClone.id) {
          cc.checkers = originClone.checkers
        }
        if (cc.id === destinationClone.id) {
          cc.checkers = destinationClone.checkers
        }
        if (cc.id === opponentBarClone.id) {
          cc.checkers = opponentBarClone.checkers
        }
      }
    )

    return boardClone
  }

  static getCheckers(board: BackgammonBoard): BackgammonChecker[] {
    const checkercontainers = Board.getCheckercontainers(board)
    const checkers: BackgammonChecker[] = []

    checkercontainers.map(function pushCheckers(checkercontainer) {
      checkers.push(...checkercontainer.checkers)
    })
    return checkers
  }

  static getCheckersForColor(
    board: BackgammonBoard,
    color: BackgammonColor
  ): BackgammonChecker[] {
    return Board.getCheckers(board).filter(function filterCheckers(checker) {
      return checker.color === color
    })
  }

  static getPoints = function getPoints(
    board: BackgammonBoard
  ): BackgammonPoint[] {
    return board.points
  }

  static getBars = function getBars(board: BackgammonBoard): BackgammonBar[] {
    return [board.bar.clockwise, board.bar.counterclockwise]
  }

  static getOffs = function getOffs(board: BackgammonBoard): BackgammonOff[] {
    return [board.off.clockwise, board.off.counterclockwise]
  }

  static getCheckercontainers = function getCheckercontainers(
    board: BackgammonBoard
  ): BackgammonCheckercontainer[] {
    const points = Board.getPoints(board) as BackgammonCheckercontainer[]
    const bar = Board.getBars(board) as BackgammonCheckercontainer[]
    const off = Board.getOffs(board) as BackgammonCheckercontainer[]
    return points.concat(...bar).concat(...off)
  }

  static getCheckercontainer = function getCheckercontainer(
    board: BackgammonBoard,
    id: string
  ): BackgammonCheckercontainer {
    const container = Board.getCheckercontainers(board).find(
      function findContainer(c) {
        return c.id === id
      }
    )
    if (!container) {
      throw Error(`No checkercontainer found for ${id}`)
    }
    return container
  }

  private static getPossibleReenterMoves = function getPossibleReenterMoves(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue
  ): BackgammonMoveSkeleton[] {
    const bar = board.bar[player.direction]
    const possibleMoves: BackgammonMoveSkeleton[] = []
    if (bar.checkers.length === 0) return possibleMoves
    const possibleDestinations = board.points.filter((p) => {
      const destinationPosition = 25 - dieValue
      return p.position[player.direction] === destinationPosition
    })
    possibleDestinations.forEach((destination) => {
      possibleMoves.push({
        origin: bar,
        destination,
        dieValue,
        direction: player.direction,
      })
    })
    return possibleMoves
  }

  private static getPossibleBearOffMoves = function getPossibleReenterMoves(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue
  ): BackgammonMoveSkeleton[] {
    const possibleMoves: BackgammonMoveSkeleton[] = []
    if (board.bar[player.direction].checkers.length > 0) return possibleMoves
    const playerPoints = Board.getPoints(board).filter(
      (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
    )
    const off = board.off[player.direction]
    if (off.checkers.length === 15) return possibleMoves
    const possibleOrigins = playerPoints.filter((p) => {
      const originPosition = p.position[player.direction]
      return originPosition - dieValue <= 0
    })
    possibleOrigins.forEach((origin) => {
      possibleMoves.push({
        origin,
        destination: off,
        dieValue,
        direction: player.direction,
      })
    })
    return possibleMoves
  }

  private static getPossiblePointToPointMoves =
    function getPossiblePointToPointMoves(
      board: BackgammonBoard,
      player: BackgammonPlayer,
      dieValue: BackgammonDieValue
    ): BackgammonMoveSkeleton[] {
      const possibleMoves: BackgammonMoveSkeleton[] = []
      const playerPoints = Board.getPoints(board).filter(
        (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
      )
      playerPoints.map((p) => {
        const possibleDestination = Board.getPoints(board).find(
          (p) =>
            (p.checkers.length < 2 || p.checkers[0].color === player.color) &&
            p.position[player.direction] ===
              p.position[player.direction] - dieValue
        )
        if (possibleDestination) {
          possibleMoves.push({
            origin: p,
            destination: possibleDestination,
            dieValue,
            direction: player.direction,
          })
        }
      })
      return possibleMoves
    }

  public static getPossibleMoves = function getPossibleMoves(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue
  ): BackgammonMoveSkeleton[] {
    const possibleMoves: BackgammonMoveSkeleton[] = []
    const playerPoints = Board.getPoints(board).filter(
      (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
    )
    const playerDirection = player.direction
    const bar = board.bar[playerDirection]
    const off = board.off[playerDirection]

    // player is the winner! Need to do more here
    if (
      playerPoints.length === 0 &&
      bar.checkers.length === 0 &&
      off.checkers.length === 15
    ) {
      return possibleMoves
    }

    if (bar.checkers.length > 0) {
      return Board.getPossibleReenterMoves(board, player, dieValue)
    } else {
      const getPossiblePointToPointMoves = Board.getPossiblePointToPointMoves(
        board,
        player,
        dieValue
      )
      const getPossibleBearOffMoves = Board.getPossibleBearOffMoves(
        board,
        player,
        dieValue
      )
      possibleMoves.push(...getPossiblePointToPointMoves)
      possibleMoves.push(...getPossibleBearOffMoves)
    }
    possibleMoves.map((move) => {
      const { origin, destination, dieValue } = move
      const originPosition =
        origin.kind === 'point'
          ? origin.position[player.direction]
          : origin.position
      const destinationPosition =
        destination.kind === 'point'
          ? destination.position[player.direction]
          : destination.position
      console.log(
        'POSSIBLE MOVE:',
        ` DieValue: ${move.dieValue}`,
        ` Direction: ${move.direction}`,
        ` Origin Position: ${originPosition}`,
        ` Destination Position: ${destinationPosition}`
      )
    })

    return possibleMoves
  }

  public static getPipCounts = function getPipCounts(game: BackgammonGame) {
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

    points.map(function mapPoints(point) {
      // console.log('[buildBoard] point.position', point.position)
      const pointSpec = boardImport.find(function findPointSpec(cc) {
        return (
          cc.position.clockwise === point.position.clockwise &&
          cc.position.counterclockwise === point.position.counterclockwise
        )
      })
      if (pointSpec) {
        // console.log('[buildBoard] pointSpec:', pointSpec)
        if (pointSpec.checkers) {
          const checkers = Checker.buildCheckersForCheckercontainerId(
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

  private static buildBar = function buildBar(
    boardImport: BackgammonCheckercontainerImport[]
  ): {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  } {
    const clockwiseId = generateId()
    const counterclockwiseId = generateId()
    const barImport = boardImport.filter(function filterBarImport(cc) {
      return cc.position === 'bar'
    })
    const clockwiseBarImport = barImport.find(function findClockwiseBarImport(
      b
    ) {
      return b.direction === 'clockwise'
    })

    let clockwiseCheckerCount = 0
    const clockwiseCheckers = []

    if (clockwiseBarImport) {
      if (clockwiseBarImport.checkers) {
        clockwiseCheckerCount = clockwiseBarImport.checkers.qty
      }
      clockwiseCheckers.push(
        ...Checker.buildCheckersForCheckercontainerId(
          clockwiseId,
          clockwiseBarImport.checkers.color,
          clockwiseCheckerCount
        )
      )
    }

    const counterclockwiseBarImport = barImport.find(
      function findCounterclockwiseBarImport(b) {
        return b.direction === 'counterclockwise'
      }
    )

    let counterclockwiseCheckerCount = 0
    const counterclockwiseCheckers = []

    if (counterclockwiseBarImport) {
      if (counterclockwiseBarImport.checkers) {
        counterclockwiseCheckerCount = counterclockwiseBarImport.checkers.qty
      }
      counterclockwiseCheckers.push(
        ...Checker.buildCheckersForCheckercontainerId(
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

  private static buildOff = function buildOff(
    boardImport: BackgammonCheckercontainerImport[]
  ): {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  } {
    const offImport = boardImport.filter(function filterOffImport(cc) {
      return cc.position === 'off'
    })
    const clockwiseOffImport = offImport.find(function findClockwiseOffImport(
      b
    ) {
      return b.direction === 'clockwise'
    })
    const counterclockwiseOffImport = offImport.find(
      function findCounterclockwiseOffImport(b) {
        return b.direction === 'counterclockwise'
      }
    )

    const clockwiseCheckers = []
    if (clockwiseOffImport) {
      if (clockwiseOffImport.checkers) {
        const checkerCount = clockwiseOffImport.checkers.qty
        clockwiseCheckers.push(
          ...Checker.buildCheckersForCheckercontainerId(
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
          ...Checker.buildCheckersForCheckercontainerId(
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
  public static generateRandomBoard = (): BackgammonBoard => {
    const boardImport: BackgammonCheckercontainerImport[] = []

    const addCheckersToImport = (
      color: BackgammonColor,
      positions: number[]
    ) => {
      let checkerCount = 0
      positions.forEach((position) => {
        let positionCheckerCount = Math.floor(Math.random() * 5) + 1
        if (checkerCount + positionCheckerCount > 15) {
          positionCheckerCount = 15 - checkerCount
        }
        checkerCount += positionCheckerCount

        if (checkerCount <= 15) {
          boardImport.push({
            position: {
              clockwise: position as BackgammonPointValue,
              counterclockwise: (25 - position) as BackgammonPointValue,
            },
            checkers: {
              color,
              qty: positionCheckerCount,
            },
          })
        }
      })
    }

    const generateRandomPositions = (count: number): number[] => {
      const positions: Set<number> = new Set()
      while (positions.size < count) {
        const position = Math.floor(Math.random() * 24) + 1
        positions.add(position)
      }
      return Array.from(positions)
    }

    let blackPositions = generateRandomPositions(5)
    let whitePositions = generateRandomPositions(5)

    // Ensure black and white positions do not overlap
    while (blackPositions.some((pos) => whitePositions.includes(pos))) {
      blackPositions = generateRandomPositions(5)
      whitePositions = generateRandomPositions(5)
    }

    // Ensure some points have more than one checker
    addCheckersToImport('black', blackPositions)
    addCheckersToImport('white', whitePositions)

    const totalBlackCheckers = boardImport.reduce((acc, cc) => {
      if (cc.checkers?.color === 'black') {
        acc += cc.checkers.qty
      }
      return acc
    }, 0)
    const totalWhiteCheckers = boardImport.reduce((acc, cc) => {
      if (cc.checkers?.color === 'white') {
        acc += cc.checkers.qty
      }
      return acc
    }, 0)

    if (totalBlackCheckers < 15) {
      const blackOffQty = 15 - totalBlackCheckers
      boardImport.push({
        position: {
          clockwise: 0,
          counterclockwise: 0,
        },
        checkers: {
          color: 'black',
          qty: blackOffQty,
        },
      })
    }

    if (totalWhiteCheckers < 15) {
      const whiteOffQty = 15 - totalWhiteCheckers
      boardImport.push({
        position: {
          clockwise: 0,
          counterclockwise: 0,
        },
        checkers: {
          color: 'white',
          qty: whiteOffQty,
        },
      })
    }

    return Board.buildBoard(boardImport)
  }

  public static getAsciiBoard = (board: BackgammonBoard): string => ascii(board)

  public static displayAsciiBoard = (board: BackgammonBoard): void => {
    console.log(ascii(board))
  }
}
