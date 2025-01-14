import { Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonPlayerMoving,
} from '../../../../types'

export class BearOff {
  public static isA(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    const homeboard = Player.getHomeBoard(board, player)
    const off = board.off[player.direction]
    let eligibleCheckerCount = 0
    homeboard.forEach((point) => {
      if (point.checkers.length > 0) {
        eligibleCheckerCount += point.checkers.length
      }
    })
    eligibleCheckerCount += off.checkers.length
    return eligibleCheckerCount === 15 ? true : false
  }

  public static move(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMove {
    const { player } = move
    let bearOff: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }
    // console.warn('reenter not implemented')
    return bearOff
  }
}
