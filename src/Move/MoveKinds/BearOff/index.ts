import { Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
} from '../../../../types'

export class BearOff {
  public static isA = function isABearOff(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): boolean {
    const homeboard = Player.getHomeBoard(board, player)
    const off = board.off[player.direction]
    let eligibleCheckerCount = 0
    homeboard.forEach(function countCheckers(point) {
      if (point.checkers.length > 0) {
        eligibleCheckerCount += point.checkers.length
      }
    })
    eligibleCheckerCount += off.checkers.length
    return eligibleCheckerCount === 15 ? true : false
  }

  public static move = function moveBearOff(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player } = move
    let bearOff: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }
    if (BearOff.isA(board, player)) {
      bearOff = {
        ...move,
        moveKind: 'bear-off',
      }
    }
    // console.warn('reenter not implemented')
    return { board, move: bearOff }
  }
}
