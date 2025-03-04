import { Board } from '../../../Board'
import {
  BackgammonBoard,
  BackgammonMoveCompleted,
  BackgammonMoveDirection,
  BackgammonMoveDryRunResult,
  BackgammonMoveInProgress,
  BackgammonMoveKind,
  BackgammonMoveReady,
  BackgammonMoveResult,
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
    move: BackgammonMoveReady
  ) => {
    const { player, dieValue } = move
    const direction = player.direction as BackgammonMoveDirection
    const originPoint = move.origin as BackgammonPoint
    const originPosition = originPoint.position[direction]
    const destinationPosition = originPosition - dieValue
    const destination = board.points.find(
      (point) => point.position[direction] === destinationPosition
    ) as BackgammonPoint
    return destination
  }

  public static move = function pointToPoint(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    isDryRun: boolean = false
  ): BackgammonMoveResult | BackgammonMoveDryRunResult {
    move = {
      ...move,
      moveKind: 'point-to-point',
      destination: PointToPoint.getDestination(board, move),
    }

    const pointToPoint = PointToPoint.isA(move)

    if (!pointToPoint) throw Error('Invalid point-to-point move')
    const originPoint = move.origin as BackgammonPoint
    const destinationPoint = move.destination as BackgammonPoint
    const player = move.player
    if (!isDryRun) {
      board = Board.moveChecker(
        board,
        originPoint,
        destinationPoint,
        player.direction
      )
      const movedPlayer = {
        ...player,
        stateKind: 'moving',
      }
      const newMove = {
        ...move,
        player: movedPlayer,
        stateKind: 'completed',
      } as BackgammonMoveCompleted
      return { board, move: newMove }
    } else {
      const dryRunMove = {
        ...move,
        stateKind: 'in-progress',
      } as BackgammonMoveCompleted
      return { board, move: dryRunMove }
    }
  }
}
