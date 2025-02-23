import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from '../../../../types'
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
    let newMove: BackgammonMove = {
      ...move,
      stateKind: 'completed',
      moveKind: 'no-move',
    }
    let newBoard = board
    if (!move.origin) throw new Error('Origin not found')
    const origin = move.origin as BackgammonPoint // FIXME: Better type check
    const destination = getDestination(origin, board, player, dieValue)

    if (destination) {
      newMove = {
        ...move,
        stateKind: 'completed',
        moveKind: 'point-to-point',
        origin,
        destination,
      }
      if (!isDryRun)
        newBoard = Board.moveChecker(newBoard, origin, destination, direction)

      return {
        move: newMove,
        board: newBoard,
      }
    }

    return {
      move: newMove,
      board,
    }
  }
}
