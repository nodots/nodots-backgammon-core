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
  BackgammonMoveCompleted,
} from 'nodots-backgammon-types'

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
      // Point must be either empty or have at most one opponent checker
      const isPointAvailable =
        p.checkers.length === 0 ||
        (p.checkers.length === 1 && p.checkers[0].color !== player.color)

      // Position must match the die value from the player's perspective
      const isCorrectPosition = p.position[direction] === targetPosition

      return isPointAvailable && isCorrectPosition
    })

    if (!destination) {
      throw new Error('Invalid reenter move: no valid destination found')
    }

    return destination
  }

  public static move = function move(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    isDryRun: boolean = false
  ): BackgammonMoveResult | BackgammonMoveDryRunResult {
    // Validate the move
    if (!Reenter.isA(move)) {
      throw new Error('Invalid reenter move: not a valid reenter move')
    }

    const { player } = move
    const origin = move.origin as BackgammonBar
    const direction = player.direction as BackgammonMoveDirection

    // Get the destination point
    const destination = Reenter.getDestination(board, move)

    // If this is a dry run, return without modifying the board
    if (isDryRun) {
      return {
        board,
        move: {
          ...move,
          destination,
        },
      }
    }

    // Get the checker to move and preserve its color
    const checker = origin.checkers[origin.checkers.length - 1]
    if (!checker) throw Error('No checker found')
    const movingCheckerColor = checker.color

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

    // Verify the move was successful and the checker color was preserved
    const destinationChecker = updatedDestination.checkers[0]
    if (
      !destinationChecker ||
      destinationChecker.color !== movingCheckerColor
    ) {
      throw new Error('Checker color was not preserved during move')
    }

    // Return the result with completed move
    const completedMove: BackgammonMoveCompleted = {
      id: move.id,
      player: move.player,
      stateKind: 'completed',
      moveKind: 'reenter',
      origin: origin,
      destination: updatedDestination,
      dieValue: move.dieValue,
      possibleMoves: move.possibleMoves,
    }

    return {
      board: updatedBoard,
      move: completedMove,
    }
  }
}
