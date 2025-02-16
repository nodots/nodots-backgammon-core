import { Dice, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayerRollingForStart,
  BackgammonPlayerStateKind,
} from '../../types'

export class Player {
  id: string = generateId()
  stateKind: BackgammonPlayerStateKind = 'inactive'
  dice!: BackgammonDice
  pipCount = 167

  public static initialize = function initializePlayer(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    id: string = generateId(),
    stateKind: BackgammonPlayerStateKind = 'inactive'
  ): BackgammonPlayer {
    switch (stateKind) {
      case 'inactive':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayer
      case 'rolling-for-start':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerRollingForStart
      case 'rolled-for-start': {
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerRolledForStart
      }
      case 'rolling':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerRolling
      case 'rolled':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerRolled
      case 'moving':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerMoving
      case 'moved':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
        } as BackgammonPlayerMoved
    }
  }

  public static roll = function roll(
    player: BackgammonPlayerRolling
  ): BackgammonPlayerRolled {
    const dice = Dice.roll(player.dice)
    const rolledPlayer = {
      ...player,
      stateKind: 'rolled',
      dice,
    } as BackgammonPlayerRolled
    return rolledPlayer
  }

  public static getHomeBoard = function getHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ) {
    return player.direction === 'clockwise'
      ? board.points.slice(18, 24)
      : board.points.slice(0, 6)
  }

  public static getOpponentBoard = function getOpponentBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ) {
    return player.direction === 'clockwise'
      ? board.points.slice(0, 6)
      : board.points.slice(18, 24)
  }
}
