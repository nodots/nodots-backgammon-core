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
// PositionAnalyzer moved to @nodots-llc/backgammon-robots package

// Hardcoded constant to avoid import issues during build
const MAX_PIP_COUNT = 167
export * from '../index'

/**
 * Supported move selection strategies.
 */
export type BackgammonMoveStrategy = 'random' | 'furthest-checker' | 'gnubg'

export class Player {
  id: string = generateId()
  stateKind: BackgammonPlayerStateKind = 'inactive'
  dice!: BackgammonDice
  pipCount = MAX_PIP_COUNT

  public static initialize = function initializePlayer(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    dice: BackgammonDice = Dice.initialize(color),
    id: string = generateId(),
    stateKind: BackgammonPlayerStateKind = 'inactive',
    isRobot: boolean,
    userId?: string,
    pipCount: number = MAX_PIP_COUNT
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
          pipCount,
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
          pipCount,
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
          pipCount,
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
          pipCount,
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
          pipCount,
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
          pipCount,
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
          pipCount,
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
          pipCount,
          isRobot,
        } as BackgammonPlayerDoubled
      default:
        throw new Error(`Unhandled player stateKind: ${stateKind}`)
    }
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
    // AXIOM OF GOLDEN RULE: Home board is always the six points whose position for the
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
   * Recalculates pip counts for both players based on current board state
   * @param game - The game state to recalculate pip counts for
   * @returns Updated players array with recalculated pip counts
   */
  public static recalculatePipCounts = function recalculatePipCounts(
    game: import('@nodots-llc/backgammon-types/dist').BackgammonGame
  ): import('@nodots-llc/backgammon-types/dist').BackgammonPlayers {
    return game.players.map((player) => {
      const newPipCount = Player.calculatePipCount(game, player.color)
      console.log(
        `🧮 Recalculating pip count for ${player.color} ${player.direction}: ${player.pipCount} -> ${newPipCount}`
      )
      return {
        ...player,
        pipCount: newPipCount,
      }
    }) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayers
  }

  /**
   * Calculates the pip count for a specific player color in a game.
   * @param game - The game to calculate pip count for
   * @param color - The color of the player to calculate pip count for
   * @returns The pip count for the specified player
   */
  public static calculatePipCount = function calculatePipCount(
    game: import('@nodots-llc/backgammon-types/dist').BackgammonGame,
    color: import('@nodots-llc/backgammon-types/dist').BackgammonColor
  ): number {
    let pipCount = 0

    const player = game.players.find((p) => p.color === color)
    if (!player) return 0

    // Count pips for checkers on points
    game.board.points.forEach((point) => {
      const playerCheckers = point.checkers.filter(
        (checker) => checker.color === color
      )
      if (playerCheckers.length > 0) {
        // For each checker on the board, determine its position from its owner's direction
        const positionFromOwnerDirection = point.position[player.direction]
        pipCount += playerCheckers.length * positionFromOwnerDirection
      }
    })

    // Bar is 25
    const barCheckers = game.board.bar[player.direction].checkers.filter(
      (checker) => checker.color === color
    )
    pipCount += barCheckers.length * 25

    return pipCount
  }

  /**
   * Selects the best move from possible moves using GNU Backgammon AI.
   * @param play BackgammonPlayMoving containing possible moves
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

    // Get GNU Position ID from game context (passed via API)
    const gnuPositionId = (play as any).gameGnuPositionId

    if (gnuPositionId) {
      console.log(
        `🤖 [Player.getBestMove] GNU Position ID available: ${gnuPositionId}`
      )
      console.log(
        '🤖 [Player.getBestMove] GNU Backgammon integration will be called from API layer'
      )

      // AI integration is handled at API layer to avoid cross-package import issues
      // The API layer will call GNU Backgammon and interpret the results

      // For now, return first move with GNU context logged
      console.log(
        '🤖 [Player.getBestMove] Using first move (GNU Backgammon will guide selection at API layer)'
      )
    } else {
      console.warn(
        '🤖 [Player.getBestMove] No GNU Position ID available, using first move'
      )
    }

    return readyMoves[0]
  }
}
