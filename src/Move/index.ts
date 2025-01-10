import { generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveDirection,
  BackgammonMoveStateKind,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPoint,
  MoveMoving,
  PlayMoving,
} from '../../types'

// FIXME: Move to types
export type BackgammonMoveResult = {
  board: BackgammonBoard
  move: BackgammonMove
}

export interface BackgammonMoveNoMove {
  id: string
  stateKind: 'no-move'
  origin: BackgammonCheckercontainer
  dieValue: BackgammonDieValue
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
    return true
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  private static isPointOpen(
    point: BackgammonPoint,
    player: BackgammonPlayerMoving
  ) {
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
    play: BackgammonPlay,
    move: MoveMoving
  ): BackgammonMoveResult {
    const { player, dieValue } = move
    const { points } = board

    const origin = move.origin as BackgammonPoint
    let destination: BackgammonPoint | undefined = undefined
    if (!move.origin) throw new Error('Origin not found')
    const originPosition =
      origin.position[player.direction as BackgammonMoveDirection]
    const destinationPosition = originPosition + dieValue

    console.log(`${dieValue}: ${originPosition} => ${destinationPosition}`)
    // console.log('points', points)
    // destination = points.find(
    //   (p) =>
    //     p.kind === 'point' &&
    //     p.position[player.direction] === destinationPosition
    // )
    console.log('destination', destination)
    // destination = board.points.find(
    //   (p) =>
    //     p.position[player.direction as BackgammonMoveDirection] ===
    //     destinationPosition
    // )
    // if (!destination) throw new Error('Destination not found')
    // console.log(origin.checkers, destination?.checkers)
    let pointToPoint: BackgammonMove = {
      ...move,
      destination,
    }

    return { board, move: pointToPoint }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?enter
  private static reenter(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player } = move
    let updatedMove: BackgammonMove = {
      ...move,
    }
    const origin = board.bar[player.direction as keyof typeof board.bar]
    const checker = origin.checkers[origin.checkers.length - 1]
    const opponentHomeBoard = Player.getHomeBoard(board, player)
    opponentHomeBoard.forEach((point) => {
      if (this.isPointOpen(point, player)) {
        move = {
          id: generateId(),
          stateKind: 'moving',
          player,
          origin: origin,
          destination: point,
        }
      } else {
        move = {
          id: generateId(),
          stateKind: 'no-move',
          player,
        }
      }
    })
    // console.warn('reenter is not properly implemented')

    return { board, move: updatedMove }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?bear_off
  private static bearOff(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player } = move
    let updatedMove: BackgammonMove = {
      ...move,
      stateKind: 'no-move',
    }
    // console.warn('reenter not implemented')
    return { board, move: updatedMove }
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?hit
  private static hit(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player } = move

    let hit: BackgammonMove = {
      ...move,
      stateKind: 'hit',
    }
    // Implement hit logic. I *think* this should return a new board
    console.warn('hit not implemented')
    return { board, move: hit }
  }

  private static noMove(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): BackgammonMoveResult {
    const { player } = move
    let noMove: BackgammonMove = {
      ...move,
      stateKind: 'no-move',
    }
    // Implement no move logic. I *think* this should return a new board
    console.warn('noMove not implemented')
    return { board, move: noMove }
  }

  private static isHit(board: BackgammonBoard, move: BackgammonMove): boolean {
    return false
  }

  private static getMoveType(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): 'hit' | 'reenter' | 'bear-off' | 'point-to-point' | 'no-move' {
    // FIXME: Needs to work with definitions from MoveStateKind
    const { player } = play
    let type: BackgammonMoveStateKind = 'no-move'
    if (this.isHit(board, player)) return 'hit'
    if (this.isReenter(board, player)) return 'reenter'
    if (this.isBearOff(board, player)) return 'bear-off'
    if (this.isPointToPoint(board, play)) return 'point-to-point'
    return type
  }

  public static getValidMoves(
    board: BackgammonBoard,
    play: PlayMoving,
    moves: BackgammonMove[] = []
  ): Set<BackgammonMove> {
    const { player, roll } = play
    let validMoves = new Set(moves)

    const origins = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )
    play.moves.forEach((move: MoveMoving) => {
      const kind = this.getMoveType(board, play, move)

      origins.forEach((origin) => {
        let newMove = {
          ...move,
          origin,
        }
        if (kind === 'hit') {
          validMoves.add(this.hit(board, play, newMove).move)
        }
        if (kind === 'reenter') {
          validMoves.add(this.reenter(board, play, newMove).move)
        }
        if (kind === 'bear-off') {
          validMoves.add(this.bearOff(board, play, newMove).move)
        }
        if (kind === 'point-to-point') {
          validMoves.add(this.pointToPoint(board, play, newMove).move)
        }
        if (kind === 'no-move') {
          validMoves.add(this.noMove(board, play, newMove).move)
        }
      })
    })
    // console.log('validMoves', validMoves)
    return validMoves
  }
}
