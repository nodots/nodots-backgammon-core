import { Dice, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerReady,
  BackgammonPlayerStateKind,
  BackgammonRoll,
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
}
