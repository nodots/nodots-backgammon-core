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
import { logger } from '../utils/logger'

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

  // Overloads for typed returns based on stateKind
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: BackgammonPlayerStateKind,
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayer
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'inactive',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayer
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'rolling-for-start',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayerRollingForStart
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'rolled-for-start',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayerRolledForStart
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'rolling',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayerRolling
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'moving',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayerMoving
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: 'winner',
    isRobot: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayerWinner
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind?: BackgammonPlayerStateKind,
    isRobot?: boolean,
    userId?: string,
    pipCount?: number,
    id?: string
  ): BackgammonPlayer
  public static initialize(
    color: BackgammonColor,
    direction: BackgammonMoveDirection,
    stateKind: BackgammonPlayerStateKind = 'inactive',
    isRobot: boolean,
    userId?: string,
    pipCount: number = MAX_PIP_COUNT,
    id?: string
  ): BackgammonPlayer {
    const playerId = id || generateId()
    const playerUserId = userId // Don't generate random userId - use the provided userId

    // Determine appropriate dice state based on player stateKind
    const getDiceForState = (
      stateKind: BackgammonPlayerStateKind
    ): BackgammonDice => {
      switch (stateKind) {
        case 'inactive':
          return Dice.initialize(color)
        case 'rolling-for-start':
          return Dice.initialize(color, 'rolling-for-start')
        case 'rolled-for-start':
          return Dice.initialize(color, 'rolled-for-start')
        case 'rolling':
        case 'moving':
        case 'moved':
        case 'doubled':
          return Dice.initialize(color, 'inactive')
        case 'winner':
          return Dice.initialize(color)
        default:
          return Dice.initialize(color)
      }
    }

    const dice = getDiceForState(stateKind)

    switch (stateKind) {
      case 'inactive':
        return {
          id: playerId,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount,
          isRobot,
        } as BackgammonPlayer
      case 'rolling-for-start':
        return {
          id: playerId,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount,
          isRobot,
        } as BackgammonPlayerRollingForStart
      case 'rolled-for-start': {
        return {
          id: playerId,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount,
          isRobot,
        } as BackgammonPlayerRolledForStart
      }
      case 'rolling':
        return {
          id: playerId,
          userId: playerUserId,
          color,
          direction,
          stateKind,
          dice,
          pipCount,
          isRobot,
        } as BackgammonPlayerRolling
      case 'moving':
        return {
          id: playerId,
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
          id: playerId,
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
          id: playerId,
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
          id: playerId,
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

  public static rollForStart = function rollForStart(
    player: BackgammonPlayerRollingForStart
  ): BackgammonPlayerRolledForStart {
    const { dice } = player
    const rolledDice = Dice.rollForStart(dice)
    return {
      ...player,
      stateKind: 'rolled-for-start',
      dice: rolledDice,
      rollForStartValue: rolledDice.currentRoll[0],
    }
  }

  public static roll = function roll(
    player: BackgammonPlayerRolling
  ): BackgammonPlayerMoving {
    const inactiveDice = Dice.initialize(
      player.color,
      'inactive'
    ) as BackgammonDiceInactive
    const rolledDice = Dice.roll(inactiveDice)
    return {
      ...player,
      stateKind: 'moving',
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
      case 'bar': {
        const bar = origin as BackgammonBar
        moveResults = Play.move(board, play, bar)
        break
      }
      case 'point': {
        const point = origin as BackgammonPoint
        moveResults = Play.move(board, play, point)
        break
      }
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
      logger.info(
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
    play: BackgammonPlayMoving,
    playerUserId?: string
  ) {
    logger.info('🤖 [Player.getBestMove] Called with:', {
      hasPlay: !!play,
      hasMove: !!play?.moves,
      movesSize: play?.moves?.size ?? 0,
      playerUserId
    })

    if (!play.moves || play.moves.size === 0) {
      logger.warn('🤖 [Player.getBestMove] No moves available, returning undefined')
      return undefined
    }

    // Log available moves for debugging
    const movesArray = Array.from(play.moves)
    logger.info('🤖 [Player.getBestMove] Available moves:', {
      totalMoves: movesArray.length,
      moveDetails: movesArray.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
        hasOrigin: !!m.origin,
        possibleMovesCount: m.possibleMoves?.length ?? 0
      }))
    })

    // Try to use AI selectBestMove for intelligent move selection
    logger.info('🤖 [Player.getBestMove] Attempting to load AI package')

    try {
      // @ts-ignore - Dynamic import of optional dependency
      const aiModule = await import('@nodots-llc/backgammon-ai')
      logger.info('🤖 [Player.getBestMove] AI package loaded, calling selectBestMove')

      const bestMove = await aiModule.selectBestMove(play, playerUserId)
      if (bestMove) {
        logger.info(`🤖 [Player.getBestMove] AI selected move from ${bestMove.origin?.id} (${bestMove.stateKind})`)
        return bestMove
      } else {
        logger.warn('🤖 [Player.getBestMove] AI returned no move, falling back to first available')
      }
    } catch (error) {
      logger.warn(
        `🤖 [Player.getBestMove] AI package unavailable: ${String(error)}, using fallback`
      )
    }

    // Fallback to first available move
    const readyMoves = Array.from(play.moves).filter(
      (move) => move.stateKind === 'ready'
    )

    logger.info('🤖 [Player.getBestMove] Fallback logic:', {
      totalMoves: movesArray.length,
      readyMoves: readyMoves.length,
      readyMoveDetails: readyMoves.map(m => ({
        dieValue: m.dieValue,
        moveKind: m.moveKind,
        hasOrigin: !!m.origin,
        hasCheckers: !!m.possibleMoves?.[0]?.origin?.checkers?.length
      }))
    })

    if (readyMoves.length === 0) {
      logger.warn('🤖 [Player.getBestMove] No ready moves found, returning undefined')
      return undefined
    }

    logger.info('🤖 [Player.getBestMove] Using first available move as fallback')
    return readyMoves[0]
  }
}
