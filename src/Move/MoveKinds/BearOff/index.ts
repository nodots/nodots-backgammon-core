import { Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveNoMove,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonOff,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
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
    move: BackgammonMoveReady,
    origin: BackgammonPoint
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

    if (!mostDistantPosition) {
      return { board, move }
    }
    if (mostDistantPosition.position[direction] > dieValue) {
      const completedMove: BackgammonMoveNoMove = {
        ...move,
        stateKind: 'completed',
        moveKind: 'no-move',
        origin,
        destination: undefined,
      }
      return { board, move: completedMove }
    } else {
      const completedMove: BackgammonMoveCompleted = {
        ...move,
        stateKind: 'completed',
        moveKind: 'bear-off',
        origin,
        destination: off,
      }
      return { board, move: completedMove }
    }
    return { board, move }
  }
}
