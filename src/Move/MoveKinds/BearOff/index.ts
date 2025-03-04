import { Board, Player } from '../../..'
import {
  BackgammonBoard,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
} from '../../../types'

export class BearOff {
  public static isA = function isABearOff(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ): BackgammonMoveInProgress | false {
    const homeboard = Player.getHomeBoard(board, player)
    const off = board.off[player.direction]
    let eligibleCheckerCount = 0
    homeboard.forEach(function countCheckers(point) {
      if (point.checkers.length > 0) {
        eligibleCheckerCount += point.checkers.length
      }
    })
    eligibleCheckerCount += off.checkers.length

    if (eligibleCheckerCount === 15) {
      return {
        player,
        stateKind: 'in-progress',
        moveKind: 'bear-off',
      } as BackgammonMoveInProgress
    }
    return false
  }

  public static move = function bearOff(
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    const player = move.player as BackgammonPlayerMoving
    const direction = player.direction
    const { dieValue } = move
    const homeboard = Player.getHomeBoard(board, player)
    homeboard.sort((a, b) => b.position[direction] - a.position[direction])
    const destination = board.off[player.direction]
    const mostDistantPosition = homeboard.find(
      (p) => p.checkers.length > 0 && p.checkers[0].color === player.color
    )
    if (!mostDistantPosition) throw Error('No checker to bear off')
    const origin = mostDistantPosition
    if (origin.checkers.length === 0) throw Error('No checker to bear off')
    if (origin.checkers[0].color !== player.color)
      throw Error('Invalid checker to bear off')
    if (origin.position[direction] + dieValue !== 25)
      throw Error('Checker not at the most distant position')
    board = Board.moveChecker(board, origin, destination, direction)
    if (!board) throw Error('Invalid board from moveChecker in BearOff')

    const bearOff: BackgammonMoveCompleted = {
      ...move,
      stateKind: 'completed',
      moveKind: 'bear-off',
      origin,
      destination,
    }

    return { board, move: bearOff }
  }
}
