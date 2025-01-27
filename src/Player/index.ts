import { Dice, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayerStateKind,
  HomeBoard,
  MAX_PIP_COUNT,
  Quadrant,
} from '../../types'
import { BackgammonPips } from '../../types/pip'

export class Player {
  id: string = generateId()
  stateKind: BackgammonPlayerStateKind = 'inactive'
  dice!: BackgammonDice
  pipCount: BackgammonPips = 167

  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    id?: string,
    stateKind?: BackgammonPlayerStateKind,
    pipCount?: BackgammonPips,
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
      pipCount = MAX_PIP_COUNT
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
      case 'moving':
        return {
          ...player,
          stateKind: 'moving',
        } as BackgammonPlayerMoving
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
      ? board.points.slice(0, 6)
      : board.points.slice(18, 24)
  }

  public static getOpponentHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled | BackgammonPlayerMoving
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
