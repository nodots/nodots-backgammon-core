import { Move } from '../..'
import { Board, Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveDirection,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
} from '../../../../types'

export class Reenter {
  public static isA(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): boolean {
    const bar = board.bar[player.direction]
    if (bar.checkers.length === 0) return false
    const opponentHomeBoard = Player.getOpponentHomeBoard(board, player)
    opponentHomeBoard.points.map((p) => {
      if (Move.isPointOpen(p, player)) return true
    })
    return false
  }

  public static move(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    let reenter: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }

    const direction = player.direction as BackgammonMoveDirection
    const origin = board.bar[direction]
    if (this.isA(board, player)) {
      const opponentsHomeBoard = Player.getOpponentHomeBoard(board, player)
      const destination = opponentsHomeBoard.points.find(
        (p) => p.position[player.direction] + dieValue
      )
      Board.moveChecker(board, origin, destination)
    }

    return { board, move: reenter }
  }
}
