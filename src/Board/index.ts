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
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonOff,
  BackgammonPlayer,
  BackgammonPlayers,
  BackgammonPoint,
  BackgammonPoints,
  BackgammonPointValue,
} from '@nodots-llc/backgammon-types/dist'
import { Checker, generateId, Player, randomBackgammonColor } from '..'
// PositionAnalyzer moved to @nodots-llc/backgammon-robots package
import { debug, logger } from '../utils/logger'
import { ascii } from './ascii'
import { BOARD_IMPORT_DEFAULT } from './imports'
export { exportToGnuPositionId } from './gnuPositionId'

export const BOARD_POINT_COUNT = 24

export interface RandomGameSetup {
  board: BackgammonBoard
  players: BackgammonPlayers
  activeColor: BackgammonColor
}

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
    boardImport?: BackgammonCheckerContainerImport[]
  ): BackgammonBoard {
    const board = Board.buildBoard(boardImport || BOARD_IMPORT_DEFAULT)
    const bar = Board.buildBar(boardImport || BOARD_IMPORT_DEFAULT)
    const off = Board.buildOff(boardImport || BOARD_IMPORT_DEFAULT)

    return {
      id: generateId(),
      points: board.points,
      bar,
      off,
    }
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

    // CRITICAL FIX: Validate that the move is still valid at execution time
    // This prevents the "No checker found" error from stale move references
    if (!originClone.checkers || originClone.checkers.length === 0) {
      debug('Board.moveChecker: No checkers at origin point', {
        originId: origin.id,
        originKind: origin.kind,
        checkerCount: originClone.checkers?.length || 0,
        boardId: board.id,
      })
      throw Error(`No checker found at origin (stale move reference)`)
    }

    // Get the checker to move and preserve its color
    const checker = originClone.checkers[originClone.checkers.length - 1]
    if (!checker) {
      debug('Board.moveChecker: Checker is null/undefined', {
        originId: origin.id,
        checkerCount: originClone.checkers.length,
        checkers: originClone.checkers,
      })
      throw Error('No checker found (empty array)')
    }
    const movingCheckerColor = checker.color

    // ADDITIONAL VALIDATION: Ensure the checker color is valid
    if (
      !movingCheckerColor ||
      (movingCheckerColor !== 'black' && movingCheckerColor !== 'white')
    ) {
      debug('Board.moveChecker: Invalid checker color', {
        originId: origin.id,
        checker: checker,
        checkerColor: movingCheckerColor,
      })
      throw Error(`Invalid checker color: ${movingCheckerColor}`)
    }

    debug('Board.moveChecker: Moving checker', {
      originId: origin.id,
      destinationId: destination.id,
      checkerColor: movingCheckerColor,
      direction: direction,
    })

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

        // FIXED: Send hit checker to its own bar based on its direction
        // Since moving player has 'direction', hit checker (opposite color) has opposite direction
        const hitCheckerDirection =
          direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
        const hitCheckerBar = boardClone.bar[hitCheckerDirection]

        destinationClone.checkers = []
        hitCheckerBar.checkers.push({
          id: hitChecker.id,
          color: hitCheckerColor,
          checkercontainerId: hitCheckerBar.id,
        })
        // Place the moving checker with its original color
        destinationClone.checkers = [
          {
            id: checker.id,
            color: movingCheckerColor,
            checkercontainerId: destinationClone.id,
            isMovable: false,
          },
        ]
      } else {
        // Append the moving checker to the destination if not a hit
        destinationClone.checkers.push({
          id: checker.id,
          color: movingCheckerColor,
          checkercontainerId: destinationClone.id,
          isMovable: false,
        })
      }
    } else if (destination.kind === 'off') {
      // For off moves, append the checker to the existing checkers array
      destinationClone.checkers.push({
        id: checker.id,
        color: movingCheckerColor,
        checkercontainerId: destinationClone.id,
        isMovable: false,
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
      const reentryPoint = 25 - dieValue
      const possibleDestination = Board.getPoints(board).find(
        (p: BackgammonPoint) =>
          // Point must be empty, have only one opponent checker (hit), or have player's own checkers (stacking)
          (p.checkers.length === 0 ||
            (p.checkers.length === 1 && p.checkers[0].color !== player.color) ||
            (p.checkers.length > 0 && p.checkers[0].color === player.color)) &&
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
      const originPosition = point.position[playerDirection]
      const destinationPosition = originPosition - dieValue

      // Skip if destination point is out of bounds
      if (destinationPosition < 1 || destinationPosition > 24) {
        return
      }

      const possibleDestination = Board.getPoints(board).find(
        (p: BackgammonPoint) =>
          // Point must be empty, have only one opponent checker (hit), or have player's own checkers (stacking)
          (p.checkers.length === 0 ||
            (p.checkers.length === 1 && p.checkers[0].color !== player.color) ||
            (p.checkers.length > 0 && p.checkers[0].color === player.color)) &&
          // Point must match the destination position using the player's direction
          p.position[playerDirection] === destinationPosition
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
    // GOLDEN RULE: Home board is always positions 1-6 relative to the player's direction
    const homeBoardPoints = Board.getPoints(board).filter((p) => {
      const pos = p.position[playerDirection]
      return pos >= 1 && pos <= 6
    })
    // CRITICAL FIX: Use point IDs for comparison, not object references
    const homeBoardPointIds = new Set(homeBoardPoints.map((p) => p.id))
    const allCheckersInHome = playerPoints.every((p) =>
      homeBoardPointIds.has(p.id)
    )

    if (allCheckersInHome) {
      // CRITICAL FIX: Proper implementation of bear-off higher die rule

      // Step 1: Find all occupied positions in home board for this player
      const occupiedPositions = homeBoardPoints
        .filter(
          (point) =>
            point.checkers.length > 0 &&
            point.checkers[0].color === player.color
        )
        .map((point) => ({
          point,
          position: point.position[playerDirection],
        }))
        .sort((a, b) => b.position - a.position) // Sort by position desc (highest first)

      // Step 2: Check for exact match first
      const exactMatch = occupiedPositions.find(
        (op) => op.position === dieValue
      )
      if (exactMatch) {
        // Direct bear-off: die matches distance exactly
        const off = board.off[playerDirection]
        possibleMoves.push({
          origin: exactMatch.point,
          destination: off,
          dieValue,
          direction: playerDirection,
        })
      } else {
        // Step 3: FIXED Higher die rule - only bear off if NO checkers exist on higher points
        // Find checkers on points higher than the die value
        const checkersOnHigherPoints = occupiedPositions.filter(
          (op) => op.position > dieValue
        )

        if (checkersOnHigherPoints.length === 0) {
          // No checkers on higher points - can use higher die rule
          // Bear off from the highest occupied point (regardless of die value)
          if (occupiedPositions.length > 0) {
            const highestOccupiedPosition = occupiedPositions[0] // Already sorted desc, so first is highest
            const off = board.off[playerDirection]
            possibleMoves.push({
              origin: highestOccupiedPosition.point,
              destination: off,
              dieValue,
              direction: playerDirection,
            })
          }
        }
        // If checkers exist on higher points, no bear-off moves are added
        // The regular point-to-point move logic above will handle moves within home board
      }
    }

    return possibleMoves
  }

  public static getPossibleMovesWithIntelligentDiceSwitching =
    function getPossibleMovesWithIntelligentDiceSwitching(
      board: BackgammonBoard,
      player: BackgammonPlayer,
      dieValue: BackgammonDieValue,
      otherDieValue: BackgammonDieValue
    ): {
      moves: BackgammonMoveSkeleton[];
      usedDieValue: BackgammonDieValue;
      autoSwitched: boolean;
      originalDieValue: BackgammonDieValue;
    } {
      // First try with the original die value
      const originalMoves = Board.getPossibleMoves(board, player, dieValue)

      if (originalMoves.length > 0) {
        // Original die has moves, use it
        return {
          moves: originalMoves,
          usedDieValue: dieValue,
          autoSwitched: false,
          originalDieValue: dieValue
        }
      }

      // Original die has no moves, try the other die value
      const alternativeMoves = Board.getPossibleMoves(
        board,
        player,
        otherDieValue
      )

      if (alternativeMoves.length > 0) {
        // Alternative die has moves, use it (automatic dice switching)
        debug(
          'Board.getPossibleMovesWithIntelligentDiceSwitching: Auto-switching dice',
          {
            originalDie: dieValue,
            switchedToDie: otherDieValue,
            movesFound: alternativeMoves.length,
          }
        )
        return {
          moves: alternativeMoves,
          usedDieValue: otherDieValue,
          autoSwitched: true,
          originalDieValue: dieValue
        }
      }

      // Neither die value has moves, return empty with original die
      return {
        moves: [],
        usedDieValue: dieValue,
        autoSwitched: false,
        originalDieValue: dieValue
      }
    }

  public static getPossibleMovesWithPositionSpecificAutoSwitch =
    function getPossibleMovesWithPositionSpecificAutoSwitch(
      board: BackgammonBoard,
      player: BackgammonPlayer,
      origin: BackgammonMoveOrigin,
      dieValue: BackgammonDieValue,
      otherDieValue: BackgammonDieValue
    ): {
      moves: BackgammonMoveSkeleton[];
      usedDieValue: BackgammonDieValue;
      autoSwitched: boolean;
      originalDieValue: BackgammonDieValue;
    } {
      // Get all possible moves for the original die value
      const originalMoves = Board.getPossibleMoves(board, player, dieValue)

      // Check if the specific origin can move with the original die
      const originCanMoveWithOriginalDie = originalMoves.some(
        move => move.origin.id === origin.id
      )

      if (originCanMoveWithOriginalDie) {
        // Original die can move from this position, use it
        return {
          moves: originalMoves,
          usedDieValue: dieValue,
          autoSwitched: false,
          originalDieValue: dieValue
        }
      }

      // Original die cannot move from this position, try the other die
      const alternativeMoves = Board.getPossibleMoves(
        board,
        player,
        otherDieValue
      )

      // Check if the specific origin can move with the alternative die
      const originCanMoveWithAlternativeDie = alternativeMoves.some(
        move => move.origin.id === origin.id
      )

      if (originCanMoveWithAlternativeDie) {
        // Alternative die can move from this position, auto-switch
        debug(
          'Board.getPossibleMovesWithPositionSpecificAutoSwitch: Auto-switching dice for position',
          {
            originId: origin.id,
            originalDie: dieValue,
            switchedToDie: otherDieValue,
            movesFound: alternativeMoves.length,
          }
        )
        return {
          moves: alternativeMoves,
          usedDieValue: otherDieValue,
          autoSwitched: true,
          originalDieValue: dieValue
        }
      }

      // Neither die can move from this position, return original die with no moves
      return {
        moves: originalMoves,
        usedDieValue: dieValue,
        autoSwitched: false,
        originalDieValue: dieValue
      }
    }

  public static getPipCounts = function getPipCounts(game: BackgammonGame) {
    const { board, players } = game
    const pipCounts = {
      black: 0,
      white: 0,
    }

    // Calculate actual pip counts for each player
    players.forEach((player) => {
      let pipCount = 0

      // Count pips for checkers on points
      board.points.forEach((point) => {
        const playerCheckers = point.checkers.filter(
          (checker) => checker.color === player.color
        )
        if (playerCheckers.length > 0) {
          // For each checker on the board, determine its position from its owner's direction
          const positionFromOwnerDirection = point.position[player.direction]
          pipCount += playerCheckers.length * positionFromOwnerDirection
        }
      })

      // Bar is 25
      const barCheckers = board.bar[player.direction].checkers.filter(
        (checker) => checker.color === player.color
      )
      pipCount += barCheckers.length * 25

      pipCounts[player.color] = pipCount
    })

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

    const bar = Board.buildBar(boardImport)
    const off = Board.buildOff(boardImport)

    return {
      id: generateId(),
      points,
      bar,
      off,
    }
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
    const clockwiseBarImport = barImport.find(
      function findClockwiseBarImport(b) {
        return b.direction === 'clockwise'
      }
    )

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
    const clockwiseOffImport = offImport.find(
      function findClockwiseOffImport(b) {
        return b.direction === 'clockwise'
      }
    )
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
        counterclockwiseColor === activeColor ? 'rolling' : 'inactive',
        true
      ),
      Player.initialize(
        counterclockwiseColor,
        'counterclockwise',
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
    moveNotation?: string,
    playerModels?: { [playerId: string]: string }
  ): string => {
    try {
      return ascii(board, players, activePlayer, moveNotation, playerModels)
    } catch (error) {
      logger.error('Error generating ASCII board:', error)
      return 'ERROR: Failed to generate ASCII board'
    }
  }

  public static getAsciiGameBoard = (
    board: BackgammonBoard,
    players?: BackgammonPlayers,
    activeColor?: BackgammonColor,
    gameStateKind?: string,
    moveNotation?: string,
    playerModels?: { [playerId: string]: string }
  ): string => {
    try {
      // Find the active player based on activeColor
      const activePlayer = players?.find((p) => p.color === activeColor)

      // Create enhanced move notation that includes game state
      const enhancedMoveNotation = gameStateKind
        ? `${moveNotation || ''} (${gameStateKind})`
        : moveNotation

      return ascii(
        board,
        players,
        activePlayer,
        enhancedMoveNotation,
        playerModels
      )
    } catch (error) {
      logger.error('Error generating ASCII game board:', error)
      return 'ERROR: Failed to generate ASCII game board'
    }
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
    debug('createBoardForPlayers called', {
      clockwiseColor,
      counterclockwiseColor,
    })

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
