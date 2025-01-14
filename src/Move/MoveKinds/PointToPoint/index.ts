import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPoint,
  MoveMoving,
  MoveNoMove,
} from '../../../../types'
import { Board } from '../../../Board'
import { getDestination } from '../../utils'
import { BearOff } from '../BearOff'
import { Reenter } from '../Reenter'

export class PointToPoint {
  public static isA(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    return Reenter.isA(board, player) || BearOff.isA(board, player)
  }

  public static move(
    board: BackgammonBoard,
    move: MoveMoving
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    let newMove: BackgammonMove | MoveNoMove = {
      ...move,
      moveKind: 'no-move',
    }
    let newBoard = board
    const origin = move.origin as BackgammonPoint // FIXME: Better type check
    if (!move.origin) throw new Error('Origin not found')
    const destination = getDestination(origin, board, player, dieValue)
    console.log('pointToPoint', { origin, destination })

    if (destination) {
      newMove = {
        ...move,
        stateKind: 'moving',
        moveKind: 'point-to-point',
        destination,
      }
      newBoard = Board.moveChecker(newBoard, origin, destination)
    }

    return {
      board: newBoard,
      move: newMove,
    }
  }
}
