import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveConfirmed,
  BackgammonMoveDryRunResult,
  BackgammonMoveInProgress,
  BackgammonMoveKind,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
} from 'nodots-backgammon-types'
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
  stateKind!: BackgammonMoveStateKind
  moveKind: BackgammonMoveKind | undefined = undefined
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
    } as BackgammonMoveReady
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  public static isPointOpen = function isPointOpen(
    point: BackgammonPoint,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
  ) {
    if (point.checkers.length < 2) return true
    if (point.checkers.length >= 2 && point.checkers[0].color === player.color)
      return true
    if (point.checkers.length > 1 && point.checkers[0].color !== player.color)
      return false
    if (point.checkers.length === 1 && point.checkers[0].color !== player.color)
      return true
    return false
  }

  public static move = function move(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    isDryRun: boolean = false
  ): BackgammonMoveResult | BackgammonMoveDryRunResult {
    const { moveKind } = move
    const { player } = move
    if (!player) throw Error('Player not found')
    if (player.stateKind !== 'rolled')
      throw Error('Invalid player state for move')
    switch (moveKind) {
      case 'point-to-point':
        return PointToPoint.move(board, move, isDryRun)
      case 'reenter':
        return Reenter.move(board, move, isDryRun)
      case 'bear-off':
        return BearOff.move(board, move)
      case 'no-move':
      case undefined:
        move = {
          ...move,
        }

        return {
          board,
          move,
        }
    }
  }

  public static confirmMove = function confirmMove(
    move: BackgammonMoveInProgress
  ): BackgammonMoveConfirmed {
    return {
      ...move,
      stateKind: 'confirmed',
    }
  }
}
