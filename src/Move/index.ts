import {
  BackgammonBoard,
  BackgammonCheckerContainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveConfirmed,
  BackgammonMoveConfirmedNoMove,
  BackgammonMoveConfirmedWithMove,
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
} from '@nodots-llc/backgammon-types/dist'
import { generateId } from '..'
import { BearOff } from './MoveKinds/BearOff'
import { PointToPoint } from './MoveKinds/PointToPoint'
import { Reenter } from './MoveKinds/Reenter'

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
  origin: BackgammonCheckerContainer | undefined = undefined
  destination: BackgammonCheckerContainer | undefined = undefined

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
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    const { moveKind } = move
    const { player } = move
    if (!player) throw Error('Player not found')
    if (player.stateKind !== 'rolled')
      throw Error('Invalid player state for move')

    switch (moveKind) {
      case 'point-to-point':
        return PointToPoint.move(board, move)
      case 'reenter':
        return Reenter.move(board, move)
      case 'bear-off':
        return BearOff.move(board, move)
      case 'no-move':
      case undefined:
        return {
          board,
          move: {
            ...move,
            moveKind: 'no-move',
            stateKind: 'completed',
            origin: undefined,
            destination: undefined,
            isHit: false,
          },
        }
    }
  }

  public static confirmMove = function confirmMove(
    move: BackgammonMoveInProgress
  ): BackgammonMoveConfirmed {
    if (move.moveKind === 'no-move') {
      return {
        ...move,
        stateKind: 'confirmed',
        origin: undefined,
        destination: undefined,
        isHit: false,
      } as BackgammonMoveConfirmedNoMove
    }

    return {
      ...move,
      stateKind: 'confirmed',
      isHit:
        move.moveKind === 'point-to-point' &&
        move.destination?.checkers.length === 1 &&
        move.destination.checkers[0].color !== move.player.color,
    } as BackgammonMoveConfirmedWithMove
  }
}
