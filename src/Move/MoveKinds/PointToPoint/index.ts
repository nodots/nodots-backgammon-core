import {
  BackgammonBoard,
  BackgammonMoveDirection,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types'
import { Board } from '../../../Board'

export class PointToPoint {
  public static isA = function isAPointToPoint(
    move: any
  ): BackgammonMoveInProgress | false {
    const { player, origin } = move
    if (!origin || !origin.checkers || origin.checkers.length === 0) {
      return false
    }
    if (origin.checkers[0].color !== player.color) {
      return false
    }
    if (origin.kind !== 'point') {
      return false
    }
    if (!move.dieValue) {
      return false
    }
    return {
      ...move,
      stateKind: 'in-progress',
      moveKind: 'point-to-point',
    } as BackgammonMoveInProgress
  }

  public static getDestination = (
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonPoint => {
    const { player, dieValue } = move
    const direction = player.direction as BackgammonMoveDirection
    const originPoint = move.origin as BackgammonPoint
    const originPosition = originPoint.position[direction]
    // BOTH players move from their higher-numbered points to lower-numbered points (24→1)
    // This is ALWAYS subtract die value regardless of direction
    const destinationPosition = originPosition - dieValue
    const destination = board.points.find(
      (point) => point.position[direction] === destinationPosition
    )
    if (!destination) {
      throw new Error('Invalid destination point')
    }
    return destination
  }

  public static move = function pointToPoint(
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    if (!board) {
      throw new Error('Invalid board')
    }
    if (!move) {
      throw new Error('Invalid move')
    }

    // Get the destination point
    const destination = PointToPoint.getDestination(board, move)

    // Validate the move
    const validMove = PointToPoint.isA(move)
    if (!validMove) {
      throw new Error('Invalid point-to-point move')
    }

    // Check if the destination is valid (empty or has at most one opponent checker)
    if (
      destination.checkers.length >= 2 &&
      destination.checkers[0].color !== move.player.color
    ) {
      // Return a no-move completed move if blocked
      return {
        board,
        move: {
          ...move,
          moveKind: 'no-move',
          stateKind: 'completed',
          origin: undefined,
          destination: undefined,
          isHit: false,
        },
      }
    }

    // Check if there's an opponent checker to be hit
    const isHit =
      destination.checkers.length === 1 &&
      destination.checkers[0].color !== move.player.color

    const origin = move.origin

    // Move the checker
    const updatedBoard = Board.moveChecker(
      board,
      origin,
      destination,
      move.player.direction
    )

    // Get the updated destination point from the updated board
    const updatedDestination = updatedBoard.points.find(
      (p) => p.id === destination.id
    )
    if (!updatedDestination) {
      throw new Error('Could not find destination point after move')
    }

    // Return the result with completed move
    return {
      board: updatedBoard,
      move: {
        ...move,
        moveKind: 'point-to-point' as const,
        stateKind: 'completed' as const,
        destination: updatedDestination,
        isHit,
      },
    }
  }
}
