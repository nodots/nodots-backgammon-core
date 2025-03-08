import { Board } from '../../..'
import { Player } from '../../../Player'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonMoveCompleted,
  BackgammonMoveDirection,
  BackgammonMoveDryRunResult,
  BackgammonMoveInProgress,
  BackgammonMoveReady,
  BackgammonMoveResult,
} from '../../../types'

export class Reenter {
  public static isA = function isAPointToPoint(
    move: any
  ): BackgammonMoveInProgress | false {
    const { player, origin } = move
    if (origin.kind !== 'bar') return false
    if (origin.checkers.length === 0) return false
    if (origin.checkers[0].color !== player.color) return false

    return {
      ...move,
      stateKind: 'in-progress',
      moveKind: 'reenter',
    } as BackgammonMoveInProgress
  }

  public static getDestination = (
    board: BackgammonBoard,
    move: BackgammonMoveReady
  ) => {
    const { player, dieValue } = move
    const direction = player.direction as BackgammonMoveDirection
    const opponentsHomeBoard = Player.getOpponentBoard(board, player)
    const destination = opponentsHomeBoard.find(
      (p) => p.position[direction] + dieValue
    )
    if (!destination) throw Error('Invalid reenter move')
    return destination
  }

  public static move = function reenter(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    isDryRun: boolean = false
  ): BackgammonMoveResult | BackgammonMoveDryRunResult {
    const { dieValue } = move
    const origin = move.origin as BackgammonBar
    const destination = Reenter.getDestination(board, move)
    if (!destination) throw Error('Invalid reenter move')
    if (!isDryRun) {
      board = Board.moveChecker(
        board,
        origin,
        destination,
        move.player.direction
      )
      if (!board) throw Error('Invalid board from moveChecker in Reenter')
    }
    const moveCompleted: BackgammonMoveCompleted = {
      ...move,
      stateKind: 'completed',
      moveKind: 'reenter',
      origin,
      destination,
      isHit: false, // FIXME: Implement hit logic
    }
    return {
      board,
      move: moveCompleted,
    }
  }
}
