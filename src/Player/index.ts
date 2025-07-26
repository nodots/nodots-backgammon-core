import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceInactive,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonMoveResult,
  BackgammonPlayer,
  BackgammonPlayerDoubled,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayerRollingForStart,
  BackgammonPlayerStateKind,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types/dist'
import { Board, Dice, generateId } from '..'
import { Play } from '../Play'
export * from '../index'

/**
 * Supported move selection strategies.
 */
export type BackgammonMoveStrategy = 'random' | 'furthest-checker' | 'gnubg'

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
    stateKind: BackgammonPlayerStateKind = 'inactive',
    isRobot: boolean,
    userId?: string
  ): BackgammonPlayer {
    const playerUserId = userId || generateId()

    switch (stateKind) {
      case 'inactive':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice: dice || Dice.initialize(color),
          pipCount: 167,
          isRobot,
        } as BackgammonPlayer
      case 'rolling-for-start':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice: dice || Dice.initialize(color),
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerRollingForStart
      case 'rolled-for-start': {
        // For rolled-for-start players, their dice should be 'rolling' (ready to roll)
        // since they won the roll-for-start and can now roll for their first turn
        const rollingDice = dice || Dice.initialize(color, 'rolling')
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice: rollingDice,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerRolledForStart
      }
      case 'rolling':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerRolling
      case 'rolled':
        const rolledDice = dice as BackgammonDiceRolled
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice: rolledDice,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerRolled
      case 'moving':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerMoving
      case 'moved':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerMoved
      case 'winner':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind: 'winner',
          dice,
          pipCount: 0,
          isRobot,
        } as BackgammonPlayerWinner
      case 'doubled':
        return {
          id,
          userId: playerUserId,
          color,
          direction,
          stateKind: 'doubled',
          dice: dice as BackgammonDiceRolled,
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerDoubled
    }
    throw new Error(`Unhandled player stateKind: ${stateKind}`)
  }

  public static roll = function roll(
    player: BackgammonPlayerRolling
  ): BackgammonPlayerRolled {
    const inactiveDice = Dice.initialize(
      player.color,
      'inactive'
    ) as BackgammonDiceInactive
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
    // GOLDEN RULE: Home board is always the six points whose position for the
    // active player's direction is 1-6.
    return board.points.filter(
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
    // Opponent home board is the six points whose position for the player's direction is 19-24
    return board.points.filter(
      (p) =>
        p.kind === 'point' &&
        p.position[player.direction] >= 19 &&
        p.position[player.direction] <= 24
    )
  }

  public static toMoving = function toMoving(
    player: BackgammonPlayer
  ): BackgammonPlayerMoving {
    return {
      ...player,
      stateKind: 'moving',
    } as BackgammonPlayerMoving
  }

  /**
   * Selects the best move from possible moves using the specified strategy.
   * If the primary strategy fails (throws or returns undefined),
   * it will automatically fall back to 'furthest-checker', then 'random'.
   * @param play BackgammonPlayMoving containing possible moves
   * @param strategy The move selection strategy ('random' | 'furthest-checker' | 'gnubg'). Defaults to 'gnubg'.
   * @param players Optional array of BackgammonPlayers
   * @returns A selected BackgammonMoveReady, or undefined if no moves
   */
  public static getBestMove = async function getBestMove(
    play: BackgammonPlayMoving
  ): Promise<
    import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady | undefined
  > {
    if (!play.moves || play.moves.size === 0) return undefined
    const readyMoves = Array.from(play.moves).filter(
      (move) => move.stateKind === 'ready'
    ) as import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady[]
    if (readyMoves.length === 0) return undefined

    return readyMoves[0]
  }
}
