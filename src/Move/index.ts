import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveKind,
  BackgammonMoveResult,
  BackgammonMoveState,
  BackgammonPlayer,
  BackgammonPlayerActive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
  BackgammonPoint,
} from '../../types'
import { BearOff } from './MoveKinds/BearOff'
import { PointToPoint } from './MoveKinds/PointToPoint'
import { Reenter } from './MoveKinds/Reenter'

export type MOVE_MODE = 'dry-run' | 'commit'

export interface MoveProps {
  player: BackgammonPlayerMoving
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
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?hit
  private static hit(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMove {
    // const { player } = move

    // let hit: BackgammonMove = {
    //   ...move,
    //   stateKind: 'hit',
    // }
    // // Implement hit logic. I *think* this should return a new board
    // console.warn('hit not implemented')
    // return hit
    return move
  }

  private static isHit(board: BackgammonBoard, move: BackgammonMove): boolean {
    return false
  }

  private static getMoveKind(
    board: BackgammonBoard,
    play: BackgammonPlayMoving
  ): BackgammonMoveKind {
    const { player } = play
    let type: BackgammonMoveKind = 'no-move'
    if (Reenter.isA(board, player)) return 'reenter'
    if (BearOff.isA(board, player)) return 'bear-off'
    if (PointToPoint.isA(board, player)) return 'point-to-point'
    return type
  }

  public static move(
    board: BackgammonBoard,
    move: BackgammonMove,
    isDryRun: boolean = false
  ): BackgammonMoveResult {
    const { moveKind } = move

    switch (moveKind) {
      case 'point-to-point':
        return PointToPoint.move(board, move, isDryRun)
      case 'reenter':
        return Reenter.move(board, move)
      case 'bear-off':
        return BearOff.move(board, move)
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
        throw Error('Undefined backgammon moveKind')
    }
  }

  public static getValidMoves(
    board: BackgammonBoard,
    play: BackgammonPlayRolled
  ): Set<BackgammonMove> {
    const player = play.player as BackgammonPlayerActive
    const roll = player.dice.currentRoll
    const isDoubles = roll[0] === roll[1]
    let validMoves = new Set<BackgammonMove>()
    let newBoard = board

    const origins = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )

    play.moves.forEach((m: BackgammonMove) => {
      origins.map((o) => {
        m.origin = o
        const newM = this.move(newBoard, m, false)
        newM && validMoves.add(newM.move)
      })
    })

    if (!isDoubles) {
      const reversedMoves = [...play.moves].reverse()
      reversedMoves.forEach((m: BackgammonMove) => {
        origins.map((o) => {
          m.origin = o
          const newM = this.move(newBoard, m, false)
          newM && validMoves.add(newM.move)
        })
      })
    }
    if (validMoves.size === 0) throw new Error('No valid moves found')
    return validMoves
  }

  private static log(message?: string, object: any = {}) {
    console.log(`[Move] ${message ? message : ''}`, object)
  }
}
