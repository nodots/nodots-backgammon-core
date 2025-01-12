import { Board, generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveKind,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPoint,
  MoveMoved,
  MoveMoving,
  MoveNoMove,
  PlayMoving,
} from '../../types'
import { getDestination } from './utils'

export type MOVE_MODE = 'dry-run' | 'commit'
export const MOVE_NO_MOVE = (
  origin: BackgammonCheckercontainer
): MoveNoMove => {
  return {
    id: generateId(),
    stateKind: 'no-move',
    moveKind: 'no-move',
    origin,
    destination: undefined,
  }
}

export class Move implements BackgammonMove {
  id: string = generateId()
  stateKind: BackgammonMoveStateKind = 'initializing'
  player: BackgammonPlayerMoving | undefined = undefined
  origin: BackgammonCheckercontainer | undefined = undefined
  destination?: BackgammonCheckercontainer | undefined = undefined

  public static initialize(
    player: BackgammonPlayerMoving,
    dieValue: BackgammonDieValue
  ): BackgammonMove {
    return {
      id: generateId(),
      stateKind: 'initializing',
      player,
      dieValue,
    }
  }

  private static move(
    board: BackgammonBoard,
    move: BackgammonMove,
    mode: 'dry-run' | 'commit' = 'dry-run'
  ): BackgammonMove | void {
    const moveKind = this.getMoveKind(board, move as PlayMoving)
    const { dieValue, direction, origin, player } = move
    if (!player) throw new Error('Player not found')
    if (!origin) throw new Error('Origin not found')
    if (!dieValue) throw new Error('Die value not found')
    // if (!direction) throw new Error('Direction not found')
    switch (moveKind) {
      case 'point-to-point':
        const p2p = this.pointToPoint(board, move as MoveMoving).move
        if (p2p) {
          return p2p
        }
        break
      case 'reenter':
        return this.reenter(board, move)
      case 'bear-off':
        return this.bearOff(board, move)
      case 'no-move':
        return this.noMove(board, move)
    }
  }

  private static isBearOff(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    const homeBoard = Player.getHomeBoard(board, player)
    const awayBoard = board.points.filter((point) => !homeBoard.includes(point))
    // console.warn('isBearOff is not properly implemented')
    return awayBoard.every((point) => point.checkers.length === 0)
      ? true
      : false
  }

  private static isReenter(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    const bar = board.bar[player.direction as keyof typeof board.bar]
    // console.warn('isReenter is not properly implemented')
    return bar.checkers.length > 0
  }

  private static isPointToPoint(board: BackgammonBoard, play: BackgammonPlay) {
    // console.warn('isPointToPoint not implemented')
    return this.isBearOff(board, play.player) ||
      this.isReenter(board, play.player)
      ? false
      : true
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  static isPointOpen(point: BackgammonPoint, player: BackgammonPlayerMoving) {
    // console.log('isPointOpen', point, player)
    if (point.checkers.length < 2) return true
    if (
      point.checkers.length >= 2 &&
      point.checkers[0] &&
      point.checkers[0].color === player.color
    )
      return true
  }

  private static pointToPoint(
    board: BackgammonBoard,
    move: MoveMoving
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    let newMove: BackgammonMove | MoveNoMove = {
      ...move,
      moveKind: 'no-move',
    }
    let newBoard = board
    const origin = move.origin as BackgammonPoint // FIXME: Better type check
    if (!move.origin) throw new Error('Origin not found')
    const destination = getDestination(origin, board, player, dieValue)
    this.log('pointToPoint', { origin, destination })

    if (destination) {
      newMove = {
        ...move,
        stateKind: 'moving',
        moveKind: 'point-to-point',
        destination,
      }
      newBoard = Board.moveChecker(newBoard, origin, destination)
    }

    return {
      board: newBoard,
      move: newMove,
    }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?enter
  private static reenter(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMove {
    const { player } = move
    let reenter: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }
    const origin = board.bar[player.direction as keyof typeof board.bar]
    const opponentHomeBoard = Player.getHomeBoard(board, player)
    opponentHomeBoard.forEach((point) => {
      if (this.isPointOpen(point, player)) {
        reenter = {
          id: generateId(),
          stateKind: 'moving',
          player,
          origin: origin,
          destination: point,
        }
      }
    })

    return reenter
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?bear_off
  private static bearOff(
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

  private static noMove(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMove {
    let noMove: BackgammonMove = {
      ...move,
      moveKind: 'no-move',
    }
    // Implement no move logic. I *think* this should return a new board
    return noMove
  }

  private static isHit(board: BackgammonBoard, move: BackgammonMove): boolean {
    return false
  }

  private static getMoveKind(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMoveKind {
    const { player } = play
    let type: BackgammonMoveKind = 'no-move'
    if (this.isReenter(board, player)) return 'reenter'
    if (this.isBearOff(board, player)) return 'bear-off'
    if (this.isPointToPoint(board, play)) return 'point-to-point'
    return type
  }

  public static getValidMoves(
    board: BackgammonBoard,
    play: PlayMoving
  ): Set<BackgammonMove> {
    const { player, roll } = play
    const isDoubles = roll[0] === roll[1]
    let validMoves = new Set<BackgammonMove>()
    let newBoard = board

    const origins = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )

    play.moves.forEach((m: MoveMoving) => {
      origins.map((o) => {
        m.origin = o
        const newM = this.move(newBoard, m, 'dry-run')
        newM && validMoves.add(newM)
      })
    })

    if (!isDoubles) {
      const reversedMoves = [...play.moves].reverse()
      reversedMoves.forEach((m: MoveMoving) => {
        origins.map((o) => {
          m.origin = o
          const newM = this.move(newBoard, m, 'dry-run')
          newM && validMoves.add(newM)
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
