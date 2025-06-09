import { Board } from '../../..'
import { Player } from '../../../Player'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonMoveDirection,
  BackgammonMoveDryRunResult,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPoint,
  BackgammonMoveCompletedWithMove,
} from '@nodots-llc/backgammon-types/dist'

export class Reenter {
  public static isA = function isAReenterMove(
    move: any
  ): BackgammonMoveInProgress | false {
    const { player, origin } = move
    if (!origin || origin.kind !== 'bar') return false
    if (origin.checkers.length === 0) return false
    if (origin.checkers[0].color !== player.color) return false

    return {
      ...move,
      stateKind: 'in-progress' as BackgammonMoveStateKind,
      moveKind: 'reenter',
    } as BackgammonMoveInProgress
  }

  public static getDestination = (
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonPoint => {
    const { player, dieValue } = move
    const direction = player.direction as BackgammonMoveDirection

    // For reentry, we need to find points in the opponent's home board
    // For clockwise: points 19-24 map to die values 6-1
    // For counterclockwise: points 1-6 map to die values 1-6
    const targetPosition =
      direction === 'clockwise'
        ? 25 - dieValue // For clockwise, count down from 24 (e.g., die value 1 means point 24)
        : dieValue // For counterclockwise, count up from 1 (e.g., die value 1 means point 1)

    // Find the point in opponent's home board
    const destination = board.BackgammonPoints.find((p: BackgammonPoint) => {
      // Position must match the die value from the player's perspective
      const isCorrectPosition = p.position[direction] === targetPosition

      // Point must be either empty or have at most one opponent checker
      const isPointAvailable =
        p.checkers.length === 0 ||
        (p.checkers.length === 1 && p.checkers[0].color !== player.color)

      return isCorrectPosition && isPointAvailable
    })

    if (!destination) {
      throw new Error('Invalid reenter move: no valid destination found')
    }

    return destination
  }

  public static move = function move(
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    if (!board) {
      throw new Error('Invalid board')
    }
    if (!move) {
      throw new Error('Invalid move')
    }

    // Validate the move
    if (!Reenter.isA(move)) {
      throw new Error('Invalid reenter move')
    }

    const { player } = move
    const origin = move.origin as BackgammonBar
    const direction = player.direction as BackgammonMoveDirection

    // Get the destination point
    const destination = Reenter.getDestination(board, move)

    // Check if there's an opponent checker to be hit
    const isHit =
      destination.checkers.length === 1 &&
      destination.checkers[0].color !== player.color

    // Get the checker to move
    const checker = origin.checkers[origin.checkers.length - 1]

    // Move the checker
    const updatedBoard = Board.moveChecker(
      board,
      origin,
      destination,
      direction
    )

    // Get the updated destination point from the updated board
    const updatedDestination = updatedBoard.BackgammonPoints.find(
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
        stateKind: 'completed',
        moveKind: 'reenter',
        origin: origin,
        destination: updatedDestination,
        isHit,
      },
    }
  }
}
