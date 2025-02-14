import { Move } from '../..'
import { Board, Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveDirection,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from '../../../../types'

export class Reenter {
  public static isA = function isAReenter(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): boolean {
    const bar = board.bar[player.direction]
    if (bar.checkers.length === 0) return false
    const opponentHomeBoard = Player.getOpponentHomeBoard(board, player)
    if (opponentHomeBoard.some((p) => p.checkers.length === 0)) return true
    return false
  }

  public static move = function moveReenter(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMoveResult {
    if (!Reenter.isA(board, move.player)) throw Error('Invalid reenter move')
    const dieValue = move.dieValue
    const player = move.player as BackgammonPlayerMoving

    move = {
      ...move,
      moveKind: 'no-move',
    }

    const direction = player.direction as BackgammonMoveDirection
    const origin = board.bar[direction]
    const opponentsHomeBoard = Player.getOpponentHomeBoard(board, player)
    const destination = opponentsHomeBoard.find(
      (p) => p.position[direction] + dieValue
    )
    if (!destination) throw Error('Invalid reenter move')
    board = Board.moveChecker(board, origin, destination, direction)
    if (!board) throw Error('Invalid board from moveChecker in Reenter')

    return {
      board,
      move,
    }
  }
}
