import { generateId } from '..'
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
    play: BackgammonPlay
  ): BackgammonMove {
    const { player } = play
    let move: BackgammonMove = {
      id: generateId(),
      stateKind: 'no-move',
      player,
    }
    console.warn('pointToPoint not implemented')
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
    console.warn('reenter not implemented')
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

  private static getMoveType(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): 'reenter' | 'bear-off' | 'point-to-point' | 'no-move' {
    const { player } = play
    const direction = player.direction as BackgammonMoveDirection // FIXME
    const type = 'point-to-point'
    const bar = board.bar[direction]
    const off = board.off[direction]
    const points = board.points
    if (bar.checkers.length > 0) return 'reenter'
    if (off.checkers.length === 15) return 'no-move'
    return type
  }

  public static getValidMoves(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonMove[] {
    const { player, roll } = play
    const origins: BackgammonCheckercontainer[] = []
    const moves: BackgammonMove[] = []
    const direction: BackgammonMoveDirection = player.direction

    const kind = this.getMoveType(board, play)

    switch (kind) {
      case 'reenter':
        return [this.reenter(board, play)]
      case 'bear-off':
        return [this.bearOff(board, play)]
      case 'point-to-point':
        return [this.pointToPoint(board, play)]
      case 'no-move':
        return [this.noMove(board, play)]
    }
  }
}
