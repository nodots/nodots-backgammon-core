import { generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveStateKind,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPoint,
} from '../../types'

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
    console.warn('isBearOff is not properly implemented')
    return awayBoard.every((point) => point.checkers.length === 0)
      ? true
      : false
  }

  private static isReenter(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    const bar = board.bar[player.direction as keyof typeof board.bar]
    console.warn('isReenter is not properly implemented')
    return bar.checkers.length > 0
  }

  private static isPointToPoint(board: BackgammonBoard, play: BackgammonPlay) {
    console.warn('isPointToPoint not implemented')
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
    player: BackgammonPlayerMoving,
    origin: BackgammonPoint,
    dieValue: BackgammonDieValue
  ): BackgammonMove {
    let move: BackgammonMove = {
      id: generateId(),
      stateKind: 'no-move',
      player,
    }
    console.log('pointToPoint implementation in progress')
    return move
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?enter
  private static reenter(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMove {
    const { player } = play
    let move: BackgammonMove = {
      id: generateId(),
      stateKind: 'no-move',
      player,
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
    console.warn('reenter is not properly implemented')

    return move
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?bear_off
  private static bearOff(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMove {
    const { player } = play
    let move: BackgammonMove = {
      id: generateId(),
      stateKind: 'no-move',
      player,
    }
    console.warn('reenter not implemented')
    return move
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?hit
  private static hit(
    board: BackgammonBoard,
    play: BackgammonPlay,
    move: BackgammonMove
  ): BackgammonBoard {
    const { player } = play

    let hit: BackgammonMove = {
      id: generateId(),
      stateKind: 'hit',
      player,
    }
    // Implement hit logic. I *think* this should return a new board
    console.warn('hit not implemented')
    return board
  }

  private static noMove(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMove {
    const { player } = play
    return {
      id: generateId(),
      stateKind: 'no-move',
      player,
    }
  }

  private static isHit(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): boolean {
    console.warn('isHit is not properly implemented')
    return false
  }

  private static getMoveType(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): 'hit' | 'reenter' | 'bear-off' | 'point-to-point' | 'no-move' {
    // FIXME: Needs to work with definitions from MoveStateKind
    const { player } = play
    const type = 'no-move'
    if (this.isHit(board, player)) return 'hit'
    if (this.isReenter(board, player)) return 'reenter'
    if (this.isBearOff(board, player)) return 'bear-off'
    if (this.isPointToPoint(board, play)) return 'point-to-point'
    console.log('[Move] getMoveType type:', type)
    return type
  }

  public static getValidMoves(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMove[] {
    const { player, roll } = play

    const kind = this.getMoveType(board, play)

    switch (kind) {
      // I think this structure works well: if you hit, get a new board, then recursively call getValidMoves
      case 'hit':
        console.warn('hit not implemented')
        this.hit(board, play.moves[0], play.moves[0])
      case 'reenter':
        return [this.reenter(board, play)]
        break
      case 'bear-off':
        return [this.bearOff(board, play)]
        break
      case 'point-to-point':
        return [this.pointToPoint(board, player, board.points[0], roll[0])]
        break
      case 'no-move':
        return [this.noMove(board, play)]
      // No default because of the union type
    }
  }
}
