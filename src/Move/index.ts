import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveConfirmed,
  BackgammonMoveKind,
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
  player: BackgammonPlayerMoving | BackgammonPlayerRolled
  dieValue: BackgammonDieValue
  stateKind?: BackgammonMoveState
  moveKind?: BackgammonMoveKind
  id?: string
  origin?: BackgammonCheckercontainer
  destination?: BackgammonCheckercontainer
  isAuto?: boolean
  isForced?: false
}

export class Move {
  player!: BackgammonPlayer
  id!: string
  dieValue!: BackgammonDieValue
  stateKind!: BackgammonMoveKind
  moveKind!: BackgammonMoveKind
  origin: BackgammonCheckercontainer | undefined = undefined
  destination: BackgammonCheckercontainer | undefined = undefined

  public static initialize({
    player,
    id,
    dieValue,
    stateKind,
    moveKind,
    origin,
    destination,
    isAuto,
    isForced,
  }: MoveProps): BackgammonMove {
    id = id ? id : generateId()
    stateKind = stateKind ?? ('no-move' as BackgammonMoveState)
    moveKind = moveKind ? moveKind : 'no-move'

    const { direction } = player

    return {
      player,
      id: id ? id : generateId(),
      dieValue,
      direction,
      stateKind,
      moveKind,
      origin,
      destination,
      isAuto: isAuto ? isAuto : false,
      isForced: isForced ? isForced : false,
    }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  public static isPointOpen(
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

  public static move(
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
        console.log('Move.move -> move undefined:', move)
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

  public static confirmMove(
    move: BackgammonMoveCompleted
  ): BackgammonMoveConfirmed {
    return {
      ...move,
      stateKind: 'confirmed',
    }
  }
}
