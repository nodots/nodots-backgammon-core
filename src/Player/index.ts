import { Board, Dice, generateId } from '..'
import { Play } from '../Play'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonMoveOrigin,
  BackgammonMoveResult,
  BackgammonPlayer,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayerRollingForStart,
  BackgammonPlayerStateKind,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
  BackgammonPoint,
} from 'nodots-backgammon-types'

export class Player {
  id: string = generateId()
  stateKind: BackgammonPlayerStateKind = 'inactive'
  dice!: BackgammonDice
  pipCount = 167

  public static initialize = function initializePlayer(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    dice: BackgammonDice = Dice.initialize(color),
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
          dice,
          pipCount: 167,
        } as BackgammonPlayerRolling
      case 'rolled':
        const rolledDice = dice as BackgammonDiceRolled
        return {
          id,
          color,
          direction,
          stateKind,
          dice: rolledDice,
          pipCount: 167,
        } as BackgammonPlayerRolled
      case 'moving':
        return {
          id,
          color,
          direction,
          stateKind,
          dice,
          pipCount: 167,
        } as BackgammonPlayerMoving
      case 'moved':
        return {
          id,
          color,
          direction,
          stateKind,
          dice,
          pipCount: 167,
        } as BackgammonPlayerMoved
      case 'winner':
        return {
          id,
          color,
          direction,
          stateKind: 'winner',
          dice,
          pipCount: 0,
        } as BackgammonPlayerWinner
    }
  }

  public static roll = function roll(
    player: BackgammonPlayerRolling
  ): BackgammonPlayerRolled {
    const inactiveDice = Dice.initialize(player.color)
    const rolledDice = Dice.roll(inactiveDice)
    return {
      ...player,
      stateKind: 'rolled',
      dice: rolledDice,
    }
  }

  public static move = function move(
    board: Board,
    play: BackgammonPlayMoving,
    originId: string
  ): BackgammonMoveResult {
    let moveResults: BackgammonMoveResult | undefined = undefined
    const origin = Board.getCheckerContainer(board, originId)
    switch (origin.kind) {
      case 'bar':
        const bar = origin as BackgammonBar
        moveResults = Play.move(board, play, bar)
        break
      case 'point':
        const point = origin as BackgammonPoint
        moveResults = Play.move(board, play, point)
        break
      case 'off':
        throw Error('Cannot move from the Off position')
    }

    return moveResults
  }

  public static getHomeBoard = function getHomeBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ) {
    return player.direction === 'clockwise'
      ? board.BackgammonPoints.filter(
          (p) =>
            p.kind === 'point' &&
            p.position[player.direction] >= 19 &&
            p.position[player.direction] <= 24
        )
      : board.BackgammonPoints.filter(
          (p) =>
            p.kind === 'point' &&
            p.position[player.direction] >= 1 &&
            p.position[player.direction] <= 6
        )
  }

  public static getOpponentBoard = function getOpponentBoard(
    board: BackgammonBoard,
    player: BackgammonPlayer
  ) {
    const points =
      player.direction === 'clockwise'
        ? board.BackgammonPoints.slice(0, 6) // Points 1-6 for clockwise player
        : board.BackgammonPoints.slice(18, 24) // Points 19-24 for counterclockwise player
    return points
  }

  public static toMoving = function toMoving(
    player: BackgammonPlayer
  ): BackgammonPlayerMoving {
    return Player.initialize(
      player.color,
      player.direction,
      player.dice,
      player.id,
      'moving'
    ) as BackgammonPlayerMoving
  }
}
