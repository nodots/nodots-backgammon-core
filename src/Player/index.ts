import { Dice, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonDice,
  BackgammonPlayer,
  BackgammonPlayerInactive,
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

  public static initialize = function initializePlayer({
    id,
    color,
    direction,
    stateKind,
    dice,
    pipCount,
  }: BackgammonPlayer): BackgammonPlayer {
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
      case 'rolling-for-start':
        return {
          ...player,
          stateKind: 'rolling-for-start',
        } as BackgammonPlayerRollingForStart
      case 'rolled-for-start':
        return {
          ...player,
          stateKind: 'rolled-for-start',
        } as BackgammonPlayerRolledForStart
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

  public static roll = function rollPlayer(
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

  public static getOpponentHomeBoard = function getOpponentHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ) {
    return player.direction === 'clockwise'
      ? board.points.slice(0, 6)
      : board.points.slice(18, 24)
  }
}
