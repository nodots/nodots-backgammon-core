import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckerContainer,
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonMoveDirection,
  BackgammonMoveSkeleton,
  BackgammonOff,
  BackgammonPlayer,
  BackgammonPlayers,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
} from '@nodots-llc/backgammon-types/dist'
import { Checker, generateId, Player, randomBackgammonColor } from '..'
import { logger } from '../utils/logger'
import { ascii } from './ascii'
import { BOARD_IMPORT_DEFAULT } from './imports'

// Helper function to generate a default GNU position ID for boards created without game context
function generateDefaultGnuPositionId(): string {
  // Return empty string as default - this will be updated when board is used in game context
  return ''
}

export const BOARD_POINT_COUNT = 24

export interface RandomGameSetup {
  board: BackgammonBoard
  players: BackgammonPlayers
  activeColor: BackgammonColor
}

export class Board implements BackgammonBoard {
  id!: string
  gnuPositionId!: string
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
    boardImport?: BackgammonCheckerContainerImport[]
  ): BackgammonBoard {
    if (!boardImport) boardImport = BOARD_IMPORT_DEFAULT
    const board = Board.buildBoard(boardImport)
    if (!board) throw Error('No board found')
    return board
  }

  public static moveChecker(
    board: BackgammonBoard,
    origin: BackgammonPoint | BackgammonBar,
    destination: BackgammonPoint | BackgammonOff,
    direction: BackgammonMoveDirection
  ): BackgammonBoard {
    if (!board) throw Error('No board found')

    const opponentDirection =
      direction === 'clockwise' ? 'counterclockwise' : 'clockwise'

    // Create a deep clone of the board
    const boardClone = JSON.parse(JSON.stringify(board))

    // Get references to the cloned containers
    const originClone = this.getCheckerContainer(boardClone, origin.id)
    const destinationClone = this.getCheckerContainer(
      boardClone,
      destination.id
    )
    const opponentBarClone = boardClone.bar[opponentDirection]

    // Get the checker to move and preserve its color
    const checker = originClone.checkers[originClone.checkers.length - 1]
    if (!checker) throw Error('No checker found')
    const movingCheckerColor = checker.color

    // Remove the checker from origin
    originClone.checkers.pop()

    // Handle hit (only for point-to-point moves)
    if (destination.kind === 'point') {
      if (
        destinationClone.checkers.length === 1 &&
        destinationClone.checkers[0].color !== movingCheckerColor
      ) {
        // Get the hit checker and preserve its color
        const hitChecker = destinationClone.checkers[0]
        const hitCheckerColor = hitChecker.color

        // Move the hit checker to the opponent's bar
        destinationClone.checkers = []
        opponentBarClone.checkers.push({
          id: hitChecker.id,
          color: hitCheckerColor,
          checkercontainerId: opponentBarClone.id,
        })
        // Place the moving checker with its original color
        destinationClone.checkers = [
          {
            id: checker.id,
            color: movingCheckerColor,
            checkercontainerId: destinationClone.id,
          },
        ]
      } else {
        // Append the moving checker to the destination if not a hit
        destinationClone.checkers.push({
          id: checker.id,
          color: movingCheckerColor,
          checkercontainerId: destinationClone.id,
        })
      }
    } else if (destination.kind === 'off') {
      // For off moves, append the checker to the existing checkers array
      destinationClone.checkers.push({
        id: checker.id,
        color: movingCheckerColor,
        checkercontainerId: destinationClone.id,
      })
    }

    return boardClone
  }

  static getCheckers(board: BackgammonBoard): BackgammonChecker[] {
    const checkercontainers = Board.getCheckerContainers(board)
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

  static getCheckerContainers = function getCheckerContainers(
    board: BackgammonBoard
  ): BackgammonCheckerContainer[] {
    const points = Board.getPoints(board) as BackgammonCheckerContainer[]
    const bar = Board.getBars(board) as BackgammonCheckerContainer[]
    const off = Board.getOffs(board) as BackgammonCheckerContainer[]
    return points.concat(...bar).concat(...off)
  }

  static getCheckerContainer = function getCheckerContainer(
    board: BackgammonBoard,
    id: string
  ): BackgammonCheckerContainer {
    const container = Board.getCheckerContainers(board).find(
      function findContainer(c) {
        return c.id === id
      }
    )
    if (!container) {
      throw Error(`No checkercontainer found for ${id}`)
    }
    return container
  }

  public static getPossibleMoves = function getPossibleMoves(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue
  ): BackgammonMoveSkeleton[] {
    const possibleMoves: BackgammonMoveSkeleton[] = []
    const playerPoints = Board.getPoints(board).filter(
      (p: BackgammonPoint) =>
        p.checkers.length > 0 && p.checkers[0].color === player.color
    )
    const playerDirection = player.direction
    const bar = board.bar[playerDirection]

    // If player has no checkers left, return empty array
    if (playerPoints.length === 0 && bar.checkers.length === 0) {
      return possibleMoves
    }

    // If player has checkers on the bar, they must move those first
    if (bar.checkers.length > 0) {
      let reentryPoint: number
      if (playerDirection === 'clockwise') {
        reentryPoint = dieValue
      } else {
        reentryPoint = 25 - dieValue
      }
      const possibleDestination = Board.getPoints(board).find(
        (p: BackgammonPoint) =>
          // Point is not blocked by 2+ opponent checkers
          (p.checkers.length < 2 || p.checkers[0].color === player.color) &&
          // Point must match the reentry point for the player's direction
          p.position[playerDirection] === reentryPoint
      )
      if (possibleDestination) {
        possibleMoves.push({
          origin: bar,
          destination: possibleDestination,
          dieValue,
          direction: playerDirection,
        })
      }
      return possibleMoves
    }

    // Handle regular point-to-point moves
    playerPoints.forEach(function mapPlayerPoints(point) {
      const destinationPoint =
        playerDirection === 'clockwise'
          ? point.position.clockwise + dieValue // Clockwise player moves from 1→24, so add
          : point.position.clockwise - dieValue // Counterclockwise player moves from 24→1, so subtract (using clockwise position)

      // Skip if destination point is out of bounds
      if (destinationPoint < 1 || destinationPoint > 24) {
        return
      }

      const possibleDestination = Board.getPoints(board).find(
        (p: BackgammonPoint) =>
          // Point must be empty, have only one opponent checker (hit), or have player's own checkers (stacking)
          (p.checkers.length === 0 ||
            (p.checkers.length === 1 && p.checkers[0].color !== player.color) ||
            (p.checkers.length > 0 && p.checkers[0].color === player.color)) &&
          // Point must match the destination point using clockwise position for both players
          p.position.clockwise === destinationPoint
      )

      if (possibleDestination) {
        possibleMoves.push({
          origin: point,
          destination: possibleDestination,
          dieValue,
          direction: playerDirection,
        })
      }
    })

    // Bear-off logic: allow bearing off if all checkers are in the home board
    // Home board is positions 19-24 for clockwise, 1-6 for counterclockwise
    const homeBoardPoints = Board.getPoints(board).filter((p) => {
      const pos = p.position[playerDirection]
      return playerDirection === 'clockwise'
        ? pos >= 19 && pos <= 24
        : pos >= 1 && pos <= 6
    })
    const allCheckersInHome = playerPoints.every((p) =>
      homeBoardPoints.includes(p)
    )
    if (allCheckersInHome) {
      // For each point in the home board, check if a checker can bear off
      homeBoardPoints.forEach((point) => {
        if (
          point.checkers.length > 0 &&
          point.checkers[0].color === player.color
        ) {
          const position = point.position[playerDirection]
          // Calculate distance to bear off (same logic as BearOff.move)
          // For clockwise: distance = 25 - position
          // For counterclockwise: distance = position
          const distanceToBearOff =
            playerDirection === 'clockwise' ? 25 - position : position

          // Can bear off if die matches the distance
          if (distanceToBearOff === dieValue) {
            const off = board.off[playerDirection]
            possibleMoves.push({
              origin: point,
              destination: off,
              dieValue,
              direction: playerDirection,
            })
          }
          // Can bear off with a higher die if no checker on higher points
          // "Higher points" means points closer to the end of the board
          // For clockwise: higher points are 24, 23, 22, etc. (higher position values)
          // For counterclockwise: higher points are 6, 5, 4, etc. (higher position values)
          if (dieValue > distanceToBearOff) {
            const higherPoints = homeBoardPoints.filter(
              (p2) => p2.position[playerDirection] > position
            )
            const hasCheckerOnHigher = higherPoints.some((p2) =>
              p2.checkers.some((c) => c.color === player.color)
            )
            if (!hasCheckerOnHigher) {
              const off = board.off[playerDirection]
              possibleMoves.push({
                origin: point,
                destination: off,
                dieValue,
                direction: playerDirection,
              })
            }
          }
        }
      })
    }

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
    boardImport: BackgammonCheckerContainerImport[]
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

    points.map(function mapPoints(point: BackgammonPoint) {
      const pointSpecs = boardImport.filter(function findPointSpec(cc) {
        if (typeof cc.position === 'object' && 'clockwise' in cc.position) {
          return (
            cc.position.clockwise === point.position.clockwise &&
            cc.position.counterclockwise === point.position.counterclockwise
          )
        }
        return false
      })

      if (pointSpecs.length > 0) {
        pointSpecs.forEach((pointSpec) => {
          if (pointSpec.checkers) {
            const checkers = Checker.buildCheckersForCheckerContainerId(
              point.id,
              pointSpec.checkers.color,
              pointSpec.checkers.qty
            )
            point.checkers.push(...checkers)
          }
        })
      }
    })

    const bar = this.buildBar(boardImport)
    const off = this.buildOff(boardImport)

    const board: BackgammonBoard = {
      id: generateId(),
      gnuPositionId: generateDefaultGnuPositionId(),
      points: points,
      bar,
      off,
    }

    return board
  }

  private static buildBar = function buildBar(
    boardImport: BackgammonCheckerContainerImport[]
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
        ...Checker.buildCheckersForCheckerContainerId(
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
        ...Checker.buildCheckersForCheckerContainerId(
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
    boardImport: BackgammonCheckerContainerImport[]
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
          ...Checker.buildCheckersForCheckerContainerId(
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
          ...Checker.buildCheckersForCheckerContainerId(
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

  /**
   * Generates a random board with random players and active color
   * @deprecated Use generateRandomGameSetup() for more explicit return type
   */
  public static generateRandomBoard = (): BackgammonBoard & {
    players: BackgammonPlayers
    activeColor: BackgammonColor
  } => {
    const setup = Board.generateRandomGameSetup()
    return {
      ...setup.board,
      players: setup.players,
      activeColor: setup.activeColor,
    }
  }

  /**
   * Generates only a random board configuration (original behavior)
   */
  public static generateRandomBoardOnly = (): BackgammonBoard => {
    const boardImport: BackgammonCheckerContainerImport[] = []

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
        position: 'off',
        direction: 'clockwise',
        checkers: {
          color: 'black',
          qty: blackOffQty,
        },
      })
    }

    if (totalWhiteCheckers < 15) {
      const whiteOffQty = 15 - totalWhiteCheckers
      boardImport.push({
        position: 'off',
        direction: 'counterclockwise',
        checkers: {
          color: 'white',
          qty: whiteOffQty,
        },
      })
    }

    return Board.buildBoard(boardImport)
  }

  /**
   * Generates a complete random game setup with board, players, and active color
   */
  public static generateRandomGameSetup = (): RandomGameSetup => {
    // Generate random board
    const board = Board.generateRandomBoardOnly()

    // Generate random colors and directions for players
    const activeColor = randomBackgammonColor()
    const inactiveColor = activeColor === 'black' ? 'white' : 'black'

    // Randomly assign directions
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'

    // Create players with random assignments
    const players: BackgammonPlayers = [
      Player.initialize(
        clockwiseColor,
        'clockwise',
        undefined,
        undefined,
        clockwiseColor === activeColor ? 'rolling' : 'inactive',
        true
      ),
      Player.initialize(
        counterclockwiseColor,
        'counterclockwise',
        undefined,
        undefined,
        counterclockwiseColor === activeColor ? 'rolling' : 'inactive',
        true
      ),
    ]

    return {
      board,
      players,
      activeColor,
    }
  }

  public static getAsciiBoard = (
    board: BackgammonBoard,
    players?: BackgammonPlayers,
    activePlayer?: BackgammonPlayer,
    moveNotation?: string
  ): string => ascii(board, players, activePlayer, moveNotation)

  public static getAsciiGameBoard = (
    board: BackgammonBoard,
    players?: BackgammonPlayers,
    activeColor?: BackgammonColor,
    gameStateKind?: string,
    moveNotation?: string
  ): string => {
    const activePlayer = players?.find((p) => p.color === activeColor)
    const baseAscii = ascii(board, players, activePlayer, moveNotation)

    // Add game state information
    let gameInfo = '\n'

    if (gameStateKind) {
      gameInfo += `GAME STATE: ${gameStateKind.toUpperCase()}\n`
    }

    if (activeColor && players) {
      if (activePlayer) {
        gameInfo += `ACTIVE PLAYER: ${activeColor.toUpperCase()} (${
          activeColor === 'black' ? 'X' : 'O'
        }) [${activePlayer.direction}]\n`

        // Show dice roll if available
        if (activePlayer.dice && activePlayer.dice.currentRoll) {
          gameInfo += `DICE ROLL: [${activePlayer.dice.currentRoll.join(
            ', '
          )}] (Total: ${activePlayer.dice.total || 'Unknown'})\n`
        } else if (activePlayer.dice && activePlayer.dice.stateKind) {
          gameInfo += `DICE STATE: ${activePlayer.dice.stateKind.toUpperCase()}\n`
        }
      }
    }

    return baseAscii + gameInfo
  }

  public static displayAsciiBoard = (
    board: BackgammonBoard | undefined
  ): void => {
    if (board) {
      logger.info('[Board] Displaying ASCII board:', {
        boardId: board.id,
        asciiBoard: ascii(board),
      })
    } else {
      logger.error('[Board] No board found for display')
    }
  }

  /**
   * Creates a board setup that matches the given player color assignments
   * @param clockwiseColor - Color of the player moving clockwise
   * @param counterclockwiseColor - Color of the player moving counterclockwise
   */
  public static createBoardForPlayers = function createBoardForPlayers(
    clockwiseColor: BackgammonColor,
    counterclockwiseColor: BackgammonColor
  ): BackgammonBoard {
    // DEBUG LOGGING
    console.log(
      `[DEBUG] createBoardForPlayers called with clockwiseColor=${clockwiseColor}, counterclockwiseColor=${counterclockwiseColor}`
    )

    // Standard backgammon starting positions
    // Both players start with: 2 on 24, 5 on 13, 3 on 8, 5 on 6
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Clockwise player's starting positions
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: clockwiseColor },
      },
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 5, color: clockwiseColor },
      },
      {
        position: { clockwise: 8, counterclockwise: 17 },
        checkers: { qty: 3, color: clockwiseColor },
      },
      {
        position: { clockwise: 6, counterclockwise: 19 },
        checkers: { qty: 5, color: clockwiseColor },
      },
      // Counterclockwise player's starting positions
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 2, color: counterclockwiseColor },
      },
      {
        position: { clockwise: 12, counterclockwise: 13 },
        checkers: { qty: 5, color: counterclockwiseColor },
      },
      {
        position: { clockwise: 17, counterclockwise: 8 },
        checkers: { qty: 3, color: counterclockwiseColor },
      },
      {
        position: { clockwise: 19, counterclockwise: 6 },
        checkers: { qty: 5, color: counterclockwiseColor },
      },
    ]

    return Board.buildBoard(boardImport)
  }
}
