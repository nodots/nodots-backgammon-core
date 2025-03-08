import { Board } from '../../../Board'
import {
  BackgammonBoard,
  BackgammonDieValue,
  BackgammonMoveCompleted,
  BackgammonMoveDirection,
  BackgammonMoveDryRunResult,
  BackgammonMoveInProgress,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlayer,
  BackgammonPoint,
} from '../../../types'

export class PointToPoint {
  public static isA = function isAPointToPoint(
    move: any
  ): BackgammonMoveInProgress | false {
    const { player, origin, destination } = move
    if (origin.checkers.length === 0) return false
    if (origin.checkers[0].color !== player.color) return false
    if (!destination) return false
    // if (
    //   destination.checkers.length > 1 &&
    //   destination.checkers[0].color !== player.color
    // )
    //   return false
    return {
      ...move,
      stateKind: 'in-progress',
      moveKind: 'point-to-point',
    } as BackgammonMoveInProgress
  }

  public static getDestination = (
    board: BackgammonBoard,
    player: BackgammonPlayer,
    origin: BackgammonPoint,
    dieValue: BackgammonDieValue
  ) => {
    const direction = player.direction as BackgammonMoveDirection
    const destinationPosition = origin.position[direction] - dieValue
    const destination = board.points.find(
      (point) => point.position[direction] === destinationPosition
    ) as BackgammonPoint
    return destination
  }

  public static move = function pointToPoint(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    origin: BackgammonPoint,
    isDryRun: boolean = false
  ): BackgammonMoveResult | BackgammonMoveDryRunResult {
    const destination = PointToPoint.getDestination(
      board,
      move.player,
      origin,
      move.dieValue
    )
    const stateKind: BackgammonMoveStateKind = isDryRun
      ? 'in-progress'
      : 'completed'
    const newMove = {
      ...move,
      stateKind,
      origin,
      destination,
    }
    if (isDryRun) {
      board = Board.moveChecker(
        board,
        origin,
        destination,
        move.player.direction
      )
      const m = newMove as BackgammonMoveInProgress
      return { board, move: m }
    } else {
      const m = newMove as BackgammonMoveCompleted
      return { board, move: m }
    }
  }
}
