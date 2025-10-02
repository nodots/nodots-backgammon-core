import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types'
import { Board } from '../../..'

export class Reenter {
  public static isA = function isAReenterMove(
    move: any
  ): boolean {
    const { player, origin } = move
    if (!origin || origin.kind !== 'bar') return false
    if (origin.checkers.length === 0) return false
    if (origin.checkers[0].color !== player.color) return false

    return true
  }

  public static getDestination = (
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonPoint => {
    const { player, dieValue } = move
    const direction = player.direction as BackgammonMoveDirection

    // For reentry, both players re-enter on their 19-24 positions (opponent's home board)
    // This means going back to the beginning of their journey
    // For clockwise: clockwise positions 19-24, die values map 6→19, 5→20, 4→21, 3→22, 2→23, 1→24
    // For counterclockwise: counterclockwise positions 19-24, die values map 6→19, 5→20, 4→21, 3→22, 2→23, 1→24
    const targetPosition = 25 - dieValue // Both players: die 6→19, die 5→20, die 4→21, die 3→22, die 2→23, die 1→24

    // Find the point in opponent's home board
    const destination = board.points.find((p: BackgammonPoint) => {
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
        stateKind: 'completed',
        moveKind: 'reenter',
        origin: origin,
        destination: updatedDestination,
        isHit,
      },
    }
  }
}
