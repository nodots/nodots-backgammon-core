import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
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
  BackgammonPoint,
  BackgammonPlayerDoubled,
} from 'nodots-backgammon-types'
import { Board, Dice, generateId } from '..'
import { Play } from '../Play'
// Import AI analyzers and selector
import { selectMoveFromList } from 'nodots-backgammon-ai/dist/nodots-backgammon-ai/src'
import { getBestMoveFromGnubg } from 'nodots-backgammon-ai/dist/nodots-backgammon-ai/src/gnubgApi'
import {
  RandomMoveAnalyzer,
  FurthestFromOffMoveAnalyzer,
} from 'nodots-backgammon-ai/dist/nodots-backgammon-ai/src/moveAnalyzers'
import { exportToGnuPositionId } from '../Board/gnuPositionId'

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
    isRobot: boolean = true
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
          isRobot,
        } as BackgammonPlayer
      case 'rolling-for-start':
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
          isRobot,
        } as BackgammonPlayerRollingForStart
      case 'rolled-for-start': {
        return {
          id,
          color,
          direction,
          stateKind,
          dice: Dice.initialize(color),
          pipCount: 167,
          isRobot,
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
          isRobot,
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
          isRobot,
        } as BackgammonPlayerRolled
      case 'moving':
        return {
          id,
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
    play: BackgammonPlayMoving,
    strategy: BackgammonMoveStrategy = 'gnubg',
    players?: import('nodots-backgammon-types').BackgammonPlayers
  ): Promise<
    import('nodots-backgammon-types').BackgammonMoveReady | undefined
  > {
    if (!play.moves || play.moves.size === 0) return undefined
    const readyMoves = Array.from(play.moves).filter(
      (move) => move.stateKind === 'ready'
    ) as import('nodots-backgammon-types').BackgammonMoveReady[]
    if (readyMoves.length === 0) return undefined

    // Helper to select by analyzer
    const selectByAnalyzer = async (analyzer: any) => {
      const selected = await selectMoveFromList(readyMoves, analyzer)
      return selected === null
        ? undefined
        : (selected as import('nodots-backgammon-types').BackgammonMoveReady)
    }

    // Try primary strategy, then fallbacks
    const strategies: BackgammonMoveStrategy[] =
      strategy === 'gnubg'
        ? ['gnubg', 'furthest-checker', 'random']
        : strategy === 'furthest-checker'
        ? ['furthest-checker', 'random']
        : ['random']

    for (const strat of strategies) {
      try {
        if (strat === 'gnubg') {
          // Use provided players if available, otherwise fallback to [play.player]
          const gamePlayers = players || [play.player]
          const game = {
            board: play.board,
            players: gamePlayers,
            stateKind: 'rolled',
            activePlayer: play.player,
            inactivePlayer:
              gamePlayers.find((p: any) => p.id !== play.player.id) ||
              play.player,
            activeColor: play.player.color,
          } as any
          const positionId = exportToGnuPositionId(game)
          const bestMoveStr = await getBestMoveFromGnubg(positionId)
          const normalized = (move: any) =>
            `${move.origin?.position?.clockwise}/${move.destination?.position?.clockwise}`
          const bestMove = readyMoves.find((move) =>
            bestMoveStr.includes(normalized(move))
          )
          if (bestMove) return bestMove
          // If not found, fall through to next strategy
        } else if (strat === 'furthest-checker') {
          const move = await selectByAnalyzer(new FurthestFromOffMoveAnalyzer())
          if (move) return move
        } else if (strat === 'random') {
          const move = await selectByAnalyzer(new RandomMoveAnalyzer())
          if (move) return move
        }
      } catch (e) {
        console.error(`Error using ${strat} strategy:`, e)
        // Log failover event
        if (strat !== strategies[strategies.length - 1]) {
          console.warn(`Failing over from ${strat} to next strategy...`)
        }
        // Try next strategy
      }
    }
    // If all strategies fail
    return undefined
  }
}
