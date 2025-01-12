import { Board, generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveDirection,
  BackgammonMoveKind,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonOff,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPoint,
  MoveMoved,
  MoveMoving,
  MoveNoMove,
  PlayMoving,
} from '../../types'
import { getDestination } from './utils'

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
    console.log('isPointOpen', point, player)
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
    let newMove: MoveMoved | undefined = undefined
    let newBoard = board
    const origin = move.origin as BackgammonPoint // FIXME: Better type check
    if (!move.origin) throw new Error('Origin not found')
    const destination = getDestination(origin, board, player, dieValue)

    if (destination) {
      newMove = {
        ...move,
        stateKind: 'moved',
        kind: 'point-to-point',
        destination,
      }
      newBoard = Board.moveChecker(newBoard, origin, destination)
    }

    const updatedOrigin = newBoard.points.find((p) => p.id === origin.id)
    const updatedDestination = destination
      ? newBoard.points.find((p) => p.id === destination.id)
      : undefined
    console.log('updatedOrigin', updatedOrigin)
    console.log('updatedDestination', updatedDestination)
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
      kind: 'no-move',
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
      kind: 'no-move',
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
      kind: 'no-move',
    }
    // Implement no move logic. I *think* this should return a new board
    return noMove
  }

  private static isHit(board: BackgammonBoard, move: BackgammonMove): boolean {
    return false
  }

  private static getMoveType(
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

  private static move(
    board: BackgammonBoard,
    move: BackgammonMove
  ): BackgammonMove | void {
    const { kind } = move
    switch (kind) {
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

  public static getValidMoves(
    board: BackgammonBoard,
    play: PlayMoving
  ): Set<BackgammonMove> {
    const { player, roll } = play
    const isDoubles = roll[0] === roll[1]
    let validMoves = new Set<BackgammonMove>()
    let newBoard = board
    const moveNoMove: MoveNoMove = {
      id: generateId(),
      stateKind: 'no-move',
      moveKind: 'no-move',
      player,
      origin: board.bar[player.direction as keyof typeof board.bar],
      destination: undefined,
    }

    const origins = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )

    if (origins.length === 0) {
      validMoves.add(moveNoMove)
      return validMoves
    }

    play.moves.forEach((m: MoveMoving) => {
      const newM = this.move(newBoard, m)
      newM && validMoves.add(newM)
    })

    if (!isDoubles) {
      const reversedMoves = [...play.moves].reverse()
      reversedMoves.forEach((m: MoveMoving) => {
        const newM = this.move(newBoard, m)
        newM && validMoves.add(newM)
      })
    }
    return validMoves
  }

  private static log(
    message?: string | object,
    move?: BackgammonMove,
    play?: BackgammonPlay
  ) {
    console.log(`[Move] ${message ? message : ''}`, move, play)
  }
}
