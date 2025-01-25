import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceStateKind,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerReady,
  BackgammonPlayerStateKind,
  HomeBoard,
  Quadrant,
} from '../../types'
import { BackgammonPips } from '../../types/pip'

export class Player implements BackgammonPlayer {
  id: string | undefined = undefined
  stateKind: BackgammonPlayerStateKind = 'initializing'
  dice: BackgammonDice | undefined = undefined
  pipCount: BackgammonPips | undefined = undefined

  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection
  ): BackgammonPlayerReady {
    const dice = {
      id: generateId(),
      stateKind: 'ready' as BackgammonDiceStateKind,
      color,
    }
    return {
      id: generateId(),
      stateKind: 'ready',
      color,
      direction,
      dice,
      pipCount: 167,
    }
  }

  public static getHomeBoard(board: BackgammonBoard, player: BackgammonPlayer) {
    return player.direction === 'clockwise'
      ? board.points.slice(0, 6)
      : board.points.slice(18, 24)
  }

  public static getOpponentHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ): HomeBoard {
    const { direction } = player
    const opponentDirection =
      direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
    const b = board.points.filter((p) => p.position[opponentDirection] <= 6)
    if (b.length !== 6)
      throw Error(
        `Invalid home board for player ${JSON.stringify(
          player
        )} with board ${JSON.stringify(board)}`
      )
    const homeBoardPoints = b as Quadrant
    return {
      points: homeBoardPoints,
    }
  }
}
