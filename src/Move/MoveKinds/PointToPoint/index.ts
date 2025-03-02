import {
  BackgammonBoard,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveKind,
  BackgammonMoveNoMove,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from '../../../types'
import { Board } from '../../../Board'
import { getDestination } from '../../utils'
import { BearOff } from '../BearOff'
import { Reenter } from '../Reenter'

export class PointToPoint {
  public static isA = function isAPointToPoint(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): boolean {
    return Reenter.isA(board, player) || BearOff.isA(board, player)
  }

  public static move = function movePointToPoint(
    board: BackgammonBoard,
    move: BackgammonMoveInProgress,
    isDryRun: boolean = false
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    const direction = player.direction
    if (!move.origin) throw new Error('Origin not found')
    const origin = move.origin as BackgammonPoint // FIXME: Better type check
    const destination = getDestination(origin, board, player, dieValue)
    if (destination) {
      const newMove = {
        ...move,
        stateKind: 'completed',
        moveKind: 'point-to-point' as BackgammonMoveKind,
        destination,
      } as BackgammonMoveCompleted
      if (!isDryRun) {
        board = Board.moveChecker(board, origin, destination, direction)
      }
      return { board, move: newMove }
    } else {
      const noMove: BackgammonMoveNoMove = {
        ...move,
        stateKind: 'completed',
        moveKind: 'no-move' as BackgammonMoveKind,
      } as BackgammonMoveNoMove
      return {
        board,
        move: noMove,
      }
    }
  }
}
