import { Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveNoMove,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonOff,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from '../../../types'

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
    move: BackgammonMoveInProgress
  ): BackgammonMoveResult {
    const dieValue = move.dieValue
    const player = move.player as BackgammonPlayerMoving
    const direction = player.direction
    const homeboard = Player.getHomeBoard(board, player)
    homeboard.sort((a, b) => a.position[direction] - b.position[direction])
    const off = board.off[player.direction]
    const mostDistantPosition = homeboard.find(
      (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
    )
    console.warn('BearOff.move not implemented')
    return { board, move }
  }
}
