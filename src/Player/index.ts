import { Dice, generateId } from '..'
import {
  BackgammonPlayerStateKind,
  BackgammonDice,
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
  BackgammonPlayerRolled,
  BackgammonPlayerMoving,
  BackgammonPlayerMoved,
  BackgammonBoard,
  HomeBoard,
  Quadrant,
} from '../../types'

export class Player {
  id: string = generateId()
  stateKind: BackgammonPlayerStateKind = 'inactive'
  dice!: BackgammonDice
  pipCount = 167

  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    id?: string,
    stateKind?: BackgammonPlayerStateKind,
    pipCount?: number,
    dice?: BackgammonDice
  ): BackgammonPlayer {
    if (!id) {
      id = generateId()
    }
    if (!dice) {
      dice = {
        id: generateId(),
        stateKind: 'inactive',
        color,
      }
    }

    if (!stateKind) {
      stateKind = 'inactive'
    }
    if (!pipCount) {
      pipCount = 167
    }

    const player = {
      id,
      color,
      direction,
      dice,
      pipCount,
    }

    switch (stateKind) {
      case 'inactive':
        return {
          ...player,
          stateKind: 'inactive',
        } as BackgammonPlayerInactive
      case 'rolling':
        return {
          ...player,
          stateKind: 'rolling',
        } as BackgammonPlayerRolling
      case 'rolled':
        return {
          ...player,
          stateKind: 'rolled',
        } as BackgammonPlayerRolled

      case 'moving':
        return {
          ...player,
          stateKind: 'moving',
        } as BackgammonPlayerMoving

      case 'moved':
        return {
          ...player,
          stateKind: 'moved',
        } as BackgammonPlayerMoved
    }
  }

  public static roll(player: BackgammonPlayerRolling): BackgammonPlayerRolled {
    const dice = Dice.roll(player.dice)
    const rolledPlayer = {
      ...player,
      stateKind: 'rolled',
      dice,
    } as BackgammonPlayerRolled
    return rolledPlayer
  }

  public static getHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled | BackgammonPlayerMoving
  ) {
    return player.direction === 'clockwise'
      ? board.points.slice(18, 24)
      : board.points.slice(0, 6)
  }

  public static getOpponentHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled | BackgammonPlayerMoving
  ) {
    return player.direction === 'clockwise'
      ? board.points.slice(0, 6)
      : board.points.slice(18, 24)
  }
}
