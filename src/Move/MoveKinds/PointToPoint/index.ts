import {
  BackgammonBoard,
  BackgammonMove,
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
    move: BackgammonMove,
    isDryRun: boolean = false
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    let newMove: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }
    // let newBoard = board
    // const origin = move.origin as BackgammonPoint // FIXME: Better type check
    // if (!move.origin) throw new Error('Origin not found')
    // const destination = getDestination(origin, board, player, dieValue)

    // if (destination) {
    //   newMove = {
    //     ...move,
    //     stateKind: 'in-progress',
    //     moveKind: 'point-to-point',
    //     destination,
    //   }

    //   if (!isDryRun) newBoard = Board.moveChecker(newBoard, origin, destination)
    // }

    return {
      move: newMove,
      board,
    }
  }
}
