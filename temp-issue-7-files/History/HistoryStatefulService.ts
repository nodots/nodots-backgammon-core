import {
  BackgammonGame,
  failure,
  GameActionData,
  GameActionType,
  GameHistory,
  GameHistoryAction,
  HistoryQuery,
  PlayerAnalysisReport,
  ReconstructionOptions,
  Result,
  success,
} from '-llc/backgammon-types'
import {
  GameHistoryService,
  HistoryState,
  RecordActionParams,
} from './GameHistoryService'
import { AnalysisState, MoveAnalyzer } from './MoveAnalyzer'

/**
 * HistoryStatefulService - Manages state for functional history services
 *
 * This service acts as a bridge between the stateless functional services
 * and the stateful requirements of the application. It manages the history
 * state and provides a clean interface for the API layer.
 *
 * Note: This is the only place where mutation is allowed for state management.
 * All business logic remains in pure functional services.
 */
export class HistoryStatefulService {
  private historyState: HistoryState

  constructor() {
    this.historyState = GameHistoryService.createInitialState()
  }

  /**
   * Record a game action with side effect management
   */
  async recordAction(
    gameId: string,
    playerId: string,
    actionType: GameActionType,
    actionData: GameActionData,
    gameStateBefore: BackgammonGame,
    gameStateAfter: BackgammonGame,
    metadata?: GameHistoryAction['metadata']
  ): Promise<Result<GameHistoryAction, string>> {
    const params: RecordActionParams = {
      gameId,
      playerId,
      actionType,
      actionData,
      gameStateBefore,
      gameStateAfter,
      metadata,
    }

    const result = await GameHistoryService.recordAction(
      this.historyState,
      params
    )

    // Use traditional conditional instead of match
    if (result.success) {
      // Update state only on success (isolated side effect)
      this.historyState = result.data.newState
      return success(result.data.historyAction)
    } else {
      return failure(result.error)
    }
  }

  /**
   * Get game history (pure read operation)
   */
  async getGameHistory(gameId: string): Promise<Result<GameHistory, string>> {
    const historyOption = GameHistoryService.getGameHistory(
      this.historyState,
      gameId
    )

    // Use traditional conditional instead of match
    if (historyOption !== null) {
      return success(historyOption as unknown as GameHistory)
    } else {
      return failure(`Game history not found for game ${gameId}`)
    }
  }

  /**
   * Query history with filters (pure read operation)
   */
  async queryHistory(query: HistoryQuery): Promise<Result<any, string>> {
    return GameHistoryService.queryHistory(this.historyState, query)
  }

  /**
   * Reconstruct game state at specific sequence
   */
  async reconstructGameState(
    gameId: string,
    options: ReconstructionOptions
  ): Promise<Result<any, string>> {
    return GameHistoryService.reconstructGameState(
      this.historyState,
      gameId,
      options
    )
  }

  /**
   * Analyze player mistakes
   */
  async analyzePlayerMistakes(
    userId: string,
    gameIds: readonly string[] = [],
    dateRange?: { from: Date; to: Date }
  ): Promise<Result<PlayerAnalysisReport, string>> {
    const analysisState: AnalysisState = {
      historyState: this.historyState,
    }

    return MoveAnalyzer.analyzePlayerMistakes(
      analysisState,
      userId,
      gameIds,
      dateRange
    )
  }

  /**
   * Analyze specific game
   */
  async analyzeGame(gameId: string): Promise<Result<any, string>> {
    const analysisState: AnalysisState = {
      historyState: this.historyState,
    }

    return MoveAnalyzer.analyzeGame(analysisState, gameId)
  }

  /**
   * Compare two players
   */
  async comparePlayers(
    userId1: string,
    userId2: string,
    gameIds: readonly string[] = []
  ): Promise<Result<any, string>> {
    const analysisState: AnalysisState = {
      historyState: this.historyState,
    }

    return MoveAnalyzer.comparePlayers(analysisState, userId1, userId2, gameIds)
  }

  /**
   * Clear game history (administrative function)
   */
  async clearGameHistory(gameId: string): Promise<Result<void, string>> {
    try {
      this.historyState = GameHistoryService.clearGameHistory(
        this.historyState,
        gameId
      )
      return success(undefined)
    } catch (error) {
      return failure(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Clear all history (administrative function)
   */
  async clearAllHistory(): Promise<Result<void, string>> {
    try {
      this.historyState = GameHistoryService.clearAllHistory()
      return success(undefined)
    } catch (error) {
      return failure(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Get current state snapshot (for debugging/monitoring)
   */
  getStateSnapshot(): {
    totalGames: number
    totalActions: number
  } {
    return {
      totalGames: this.historyState.histories.size,
      totalActions: Array.from(this.historyState.actions.values()).reduce(
        (total, actions) => total + actions.length,
        0
      ),
    }
  }
}

// Singleton instance for the application
let historyServiceInstance: HistoryStatefulService | null = null

/**
 * Get the singleton history service instance
 */
export const getHistoryService = (): HistoryStatefulService => {
  if (!historyServiceInstance) {
    historyServiceInstance = new HistoryStatefulService()
  }
  return historyServiceInstance
}

/**
 * Reset the singleton instance (for testing)
 */
export const resetHistoryService = (): void => {
  historyServiceInstance = null
}
