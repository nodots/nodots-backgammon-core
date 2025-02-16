import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveConfirmed,
  BackgammonMoveKind,
  BackgammonMoveOrigin,
  BackgammonMoveResult,
  BackgammonMoveState,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayRolled,
  BackgammonPoint,
} from '../../types'
import { BearOff } from './MoveKinds/BearOff'
import { PointToPoint } from './MoveKinds/PointToPoint'
import { Reenter } from './MoveKinds/Reenter'

export type MOVE_MODE = 'dry-run' | 'commit'

export interface MoveProps {
  move: BackgammonMove
  origin: BackgammonMoveOrigin
}

export class Move {
  player!: BackgammonPlayer
  id!: string
  dieValue!: BackgammonDieValue
  stateKind!: BackgammonMoveKind
  moveKind!: BackgammonMoveKind
  origin: BackgammonCheckercontainer | undefined = undefined
  destination: BackgammonCheckercontainer | undefined = undefined

  public static initialize = function initializeMove({
    move,
    origin,
  }: MoveProps): BackgammonMove {
    const id = move.id ? move.id : generateId()
    const stateKind = move.stateKind ? move.stateKind : 'ready'
    return {
      ...move,
      id,
      stateKind,
      origin,
    }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  public static isPointOpen = function isPointOpen(
    point: BackgammonPoint,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ) {
    // console.log('isPointOpen', point, player)
    if (point.checkers.length < 2) return true
    if (
      point.checkers.length >= 2 &&
      point.checkers[0] &&
      point.checkers[0].color === player.color
    )
      return true
    if (point.checkers.length === 1 && point.checkers[0].color !== player.color)
      return true
    return false
  }

  public static move = function _move(
    board: BackgammonBoard,
    move: BackgammonMove,
    isDryRun: boolean = false
  ): BackgammonMoveResult {
    const { moveKind } = move

    switch (moveKind) {
      case 'point-to-point':
        if (!PointToPoint.isA(board, move.player))
          throw Error('Invalid point-to-point move')
        return PointToPoint.move(board, move, isDryRun)
      case 'reenter':
        if (!Reenter.isA(board, move.player)) return Reenter.move(board, move)
      case 'bear-off':
        if (!BearOff.isA(board, move.player)) return BearOff.move(board, move)
      case 'no-move':
        return {
          board: board,
          move: {
            ...move,
            moveKind: 'no-move',
            destination: undefined,
          },
        }
      case undefined:
        // console.log('Move.move -> move undefined:', move)
        return {
          board: board,
          move: {
            ...move,
            moveKind: 'no-move',
            destination: undefined,
          },
        }
    }
  }

  public static confirmMove = function _confirmMove(
    move: BackgammonMoveCompleted
  ): BackgammonMoveConfirmed {
    return {
      ...move,
      stateKind: 'confirmed',
    }
  }
}
