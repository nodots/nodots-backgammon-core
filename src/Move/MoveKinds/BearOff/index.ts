import {
  BackgammonBoard,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types/dist'
import { Board, Player } from '../../..'
import { logger } from '../../../utils/logger'

export class BearOff {
  public static isA = function isABearOff(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): BackgammonMoveInProgress | false {
    // If there are checkers on the bar, cannot bear off
    const barCheckers = board.bar[player.direction].checkers.filter(
      (c) => c.color === player.color
    ).length
    if (barCheckers > 0) {
      return false
    }

    // Check all points for player's checkers outside home board (distance > 6)
    let outsideHomeBoard = false
    board.BackgammonPoints.forEach((point) => {
      if (point.checkers.length > 0) {
        point.checkers.forEach((checker) => {
          if (checker.color === player.color) {
            const distance =
              player.direction === 'clockwise'
                ? 25 - point.position.clockwise
                : point.position.counterclockwise
            if (distance > 6) {
              outsideHomeBoard = true
            }
          }
        })
      }
    })
    if (outsideHomeBoard) {
      return false
    }

    // Must have at least one checker in play (not all borne off)
    let checkersInPlay = 0
    board.BackgammonPoints.forEach((point) => {
      if (point.checkers.length > 0) {
        point.checkers.forEach((checker) => {
          if (checker.color === player.color) {
            checkersInPlay++
          }
        })
      }
    })
    if (checkersInPlay === 0) {
      return false
    }

    return {
      player,
      moveKind: 'bear-off',
    } as BackgammonMoveInProgress
  }

  public static move = function bearOff(
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    const player = {
      ...move.player,
      stateKind: 'moving',
    } as BackgammonPlayerMoving
    const direction = player.direction
    const { dieValue } = move

    // Verify all checkers are in home board
    if (!BearOff.isA(board, player)) {
      throw Error('Cannot bear off when checkers exist outside home board')
    }

    // Get the origin point
    const origin = move.origin
    if (!origin || origin.checkers.length === 0) {
      throw Error('No checker to bear off')
    }
    if (origin.checkers[0].color !== player.color) {
      throw Error('Invalid checker to bear off')
    }

    // Verify the point is in the home board
    const homeboard = Player.getHomeBoard(board, player)
    if (!homeboard.some((p) => p.id === origin.id)) {
      throw Error('Cannot bear off: selected point is outside the home board')
    }

    // Get the highest point with a checker in the home board
    const highestOccupiedPoint = homeboard
      .filter(
        (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
      )
      .sort((a, b) => {
        if (a.kind === 'point' && b.kind === 'point') {
          return b.position[direction] - a.position[direction]
        }
        return 0
      })[0]

    if (!highestOccupiedPoint || highestOccupiedPoint.kind !== 'point') {
      throw Error('Cannot bear off: no valid points found in home board')
    }

    // Calculate distance to bear off for this point (relative to home board)
    // For clockwise: distance = 25 - origin.position[direction]
    // For counterclockwise: distance = origin.position[direction]
    let distanceToBearOff: number
    if (origin.kind === 'point') {
      const originPoint = origin as BackgammonPoint
      if (direction === 'clockwise') {
        distanceToBearOff = 25 - originPoint.position.clockwise
      } else {
        distanceToBearOff = originPoint.position.counterclockwise
      }

      // If using a higher die than needed, only allow if no checkers on higher points
      if (dieValue > distanceToBearOff) {
        const hasCheckerOnHigher = homeboard.some(
          (p) =>
            (p as BackgammonPoint).position[direction] >
              originPoint.position[direction] &&
            p.checkers.some((c) => c.color === player.color)
        )
        if (hasCheckerOnHigher) {
          logger.debug(
            '[BearOff] Attempted to bear off with higher die value while checkers remain on higher points:',
            {
              dieValue,
              originPosition: originPoint.position[direction],
              distanceToBearOff,
              playerColor: player.color,
              playerDirection: player.direction,
            }
          )
          throw Error(
            'Cannot use higher number when checkers exist on higher points'
          )
        }
      }
    }

    // Move the checker off
    const destination = board.off[direction]
    board = Board.moveChecker(board, origin, destination, direction)
    if (!board) throw Error('Failed to move checker off the board')

    return {
      board,
      move: {
        ...move,
        player,
        stateKind: 'completed',
        moveKind: 'bear-off',
        origin,
      } as BackgammonMoveCompleted,
    }
  }
}
