import {
  appendToArray,
  BackgammonGame,
  failure,
  GameActionData,
  GameActionType,
  GameHistory,
  GameHistoryAction,
  GameStateSnapshot,
  HistoryQuery,
  HistoryQueryResult,
  isFailure,
  none,
  Option,
  ReconstructionOptions,
  ReconstructionResult,
  Result,
  some,
  success,
} from '-llc/backgammon-types'
import { generateId } from '../'
import { ReconstructionService } from './ReconstructionService'
import { SnapshotService } from './SnapshotService'

// Pure data structures for history state
export interface HistoryState {
  readonly actions: ReadonlyMap<string, readonly GameHistoryAction[]>
  readonly histories: ReadonlyMap<string, GameHistory>
}

// Pure action data structures
export interface RecordActionParams {
  readonly gameId: string
  readonly playerId: string
  readonly actionType: GameActionType
  readonly actionData: GameActionData
  readonly gameStateBefore: BackgammonGame
  readonly gameStateAfter: BackgammonGame
  readonly metadata?: GameHistoryAction['metadata']
}

// Create initial empty history state
export const createInitialHistoryState = (): HistoryState => ({
  actions: new Map(),
  histories: new Map(),
})

// Pure function to create a game history
const createGameHistory = (
  gameId: string,
  initialGameState: BackgammonGame
): GameHistory => ({
  gameId,
  createdAt: new Date(),
  updatedAt: new Date(),
  actions: [],
  metadata: {
    totalActions: 0,
    gameStartTime: new Date(),
    players: {
      black: {
        userId:
          initialGameState.players.find((p) => p.color === 'black')?.userId ||
          '',
        isRobot:
          initialGameState.players.find((p) => p.color === 'black')?.isRobot ||
          false,
      },
      white: {
        userId:
          initialGameState.players.find((p) => p.color === 'white')?.userId ||
          '',
        isRobot:
          initialGameState.players.find((p) => p.color === 'white')?.isRobot ||
          false,
      },
    },
    statistics: {
      totalMoves: 0,
      totalRolls: 0,
      totalDoubles: 0,
      averageMoveTime: 0,
      longestMoveTime: 0,
      shortestMoveTime: 0,
      cubeActions: 0,
      resignations: 0,
      undoActions: 0,
    },
  },
})

// Pure function to get active player ID
const getActivePlayerId = (game: BackgammonGame): string => {
  if (game.activeColor === undefined) {
    return game.players[0]?.userId || 'unknown'
  }
  return (
    game.players.find((p) => p.color === game.activeColor)?.userId || 'unknown'
  )
}

// Pure function to create history action
const createHistoryAction = (
  params: RecordActionParams,
  sequenceNumber: number,
  beforeSnapshot: GameStateSnapshot,
  afterSnapshot: GameStateSnapshot
): GameHistoryAction => ({
  id: generateId(),
  gameId: params.gameId,
  sequenceNumber,
  timestamp: new Date(),
  playerId: params.playerId,
  actionType: params.actionType,
  actionData: params.actionData,
  gameStateBefore: beforeSnapshot,
  gameStateAfter: afterSnapshot,
  metadata: {
    undoable: isActionUndoable(params.actionType),
    ...params.metadata,
  },
})

// Pure function to check if action is undoable
const isActionUndoable = (actionType: GameActionType): boolean => {
  const undoableActions: readonly GameActionType[] = [
    'make-move',
    'switch-dice',
  ]
  return undoableActions.includes(actionType)
}

// Pure function to update game history metadata
const updateGameHistoryMetadata = (
  gameHistory: GameHistory,
  newAction: GameHistoryAction
): GameHistory => {
  let updatedStatistics: GameHistory['metadata']['statistics']

  switch (newAction.actionType) {
    case 'make-move':
      updatedStatistics = {
        ...gameHistory.metadata.statistics,
        totalMoves: gameHistory.metadata.statistics.totalMoves + 1,
      }
      break
    case 'roll-dice':
    case 'roll-for-start':
      updatedStatistics = {
        ...gameHistory.metadata.statistics,
        totalRolls: gameHistory.metadata.statistics.totalRolls + 1,
      }
      break
    case 'offer-double':
    case 'accept-double':
    case 'decline-double':
      updatedStatistics = {
        ...gameHistory.metadata.statistics,
        cubeActions: gameHistory.metadata.statistics.cubeActions + 1,
      }
      break
    case 'resign':
      updatedStatistics = {
        ...gameHistory.metadata.statistics,
        resignations: gameHistory.metadata.statistics.resignations + 1,
      }
      break
    case 'undo-move':
      updatedStatistics = {
        ...gameHistory.metadata.statistics,
        undoActions: gameHistory.metadata.statistics.undoActions + 1,
      }
      break
    case 'game-end':
    default:
      updatedStatistics = gameHistory.metadata.statistics
      break
  }

  const updatedMetadata = {
    ...gameHistory.metadata,
    totalActions: gameHistory.metadata.totalActions + 1,
    statistics: updateTimingStatistics(updatedStatistics, newAction),
  }

  if (newAction.actionType === 'game-end') {
    return {
      ...gameHistory,
      metadata: {
        ...updatedMetadata,
        gameEndTime: newAction.timestamp,
        finalResult:
          newAction.actionData.type === 'game-end'
            ? {
                winner: newAction.actionData.data.winner,
                points: newAction.actionData.data.points,
                reason: newAction.actionData.data.reason,
              }
            : undefined,
      },
      updatedAt: new Date(),
    }
  } else {
    return {
      ...gameHistory,
      metadata: updatedMetadata,
      updatedAt: new Date(),
    }
  }
}

// Pure function to update timing statistics
const updateTimingStatistics = (
  statistics: GameHistory['metadata']['statistics'],
  action: GameHistoryAction
): GameHistory['metadata']['statistics'] => {
  const duration = action.metadata?.duration

  if (duration === undefined) {
    return statistics
  }

  const dur = duration
  const newLongestTime =
    statistics.longestMoveTime === 0 || dur > statistics.longestMoveTime
      ? dur
      : statistics.longestMoveTime

  const newShortestTime =
    statistics.shortestMoveTime === 0 || dur < statistics.shortestMoveTime
      ? dur
      : statistics.shortestMoveTime

  const totalMoves = statistics.totalMoves
  const newAverageTime =
    totalMoves > 0
      ? (statistics.averageMoveTime * (totalMoves - 1) + dur) / totalMoves
      : dur

  return {
    ...statistics,
    longestMoveTime: newLongestTime,
    shortestMoveTime: newShortestTime,
    averageMoveTime: newAverageTime,
  }
}

// Pure function to record action
export const recordAction = async (
  state: HistoryState,
  params: RecordActionParams
): Promise<
  Result<{ newState: HistoryState; historyAction: GameHistoryAction }, string>
> => {
  try {
    // Get or create game history
    const existingHistory = state.histories.get(params.gameId)
    const gameHistory =
      existingHistory ||
      createGameHistory(params.gameId, params.gameStateBefore)

    // Get current actions for this game
    const gameActions = state.actions.get(params.gameId) || []

    // Create snapshots
    const beforeSnapshotResult = SnapshotService.createSnapshot(
      params.gameStateBefore
    )
    if (isFailure(beforeSnapshotResult)) {
      return failure(
        `Failed to create before snapshot: ${beforeSnapshotResult.error}`
      )
    }

    const afterSnapshotResult = SnapshotService.createSnapshot(
      params.gameStateAfter
    )
    if (isFailure(afterSnapshotResult)) {
      return failure(
        `Failed to create after snapshot: ${afterSnapshotResult.error}`
      )
    }

    // Create the history action
    const historyAction = createHistoryAction(
      params,
      gameActions.length + 1,
      beforeSnapshotResult.data,
      afterSnapshotResult.data
    )

    // Update game actions
    const updatedActions = appendToArray(historyAction)(gameActions)

    // Update game history metadata
    const updatedGameHistory = updateGameHistoryMetadata(
      gameHistory,
      historyAction
    )

    // Create new state
    const newState: HistoryState = {
      actions: new Map(state.actions).set(params.gameId, updatedActions),
      histories: new Map(state.histories).set(
        params.gameId,
        updatedGameHistory
      ),
    }

    return success({ newState, historyAction })
  } catch (error) {
    return failure(
      `Failed to record action: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to get game history
export const getGameHistory = (
  state: HistoryState,
  gameId: string
): Option<GameHistory> => {
  const gameHistory = state.histories.get(gameId)
  return gameHistory
    ? some({
        ...gameHistory,
        actions: [...(state.actions.get(gameId) || [])], // Convert readonly to mutable array
        updatedAt: new Date(),
      })
    : none()
}

// Pure function to query history with filters
export const queryHistory = (
  state: HistoryState,
  query: HistoryQuery
): Result<HistoryQueryResult, string> => {
  try {
    // Get actions based on game filter
    let allActions: readonly GameHistoryAction[]
    if (query.gameId === undefined) {
      const actions: GameHistoryAction[] = []
      for (const gameActions of state.actions.values()) {
        actions.push(...gameActions)
      }
      allActions = actions
    } else {
      allActions = state.actions.get(query.gameId) || []
    }

    // Apply filters sequentially
    let filteredActions = allActions

    // Apply each filter with early returns where possible
    if (query.playerId) {
      filteredActions = filteredActions.filter(
        (action) => action.playerId === query.playerId
      )
    }

    if (query.actionType) {
      filteredActions = filteredActions.filter(
        (action) => action.actionType === query.actionType
      )
    }

    if (query.fromDate || query.toDate) {
      filteredActions = filteredActions.filter((action) => {
        const timestamp = action.timestamp.getTime()
        const afterFrom =
          !query.fromDate || timestamp >= query.fromDate.getTime()
        const beforeTo = !query.toDate || timestamp <= query.toDate.getTime()
        return afterFrom && beforeTo
      })
    }

    // Sort by timestamp (most recent first)
    filteredActions = [...filteredActions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 100
    const totalCount = filteredActions.length
    const paginatedActions = filteredActions.slice(offset, offset + limit)
    const hasMore = offset + limit < totalCount

    return success({
      actions: [...paginatedActions], // Convert to mutable array
      totalCount,
      hasMore,
    })
  } catch (error) {
    return failure(
      `Failed to query history: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure filter functions
// Pure helper functions (moved to inline usage for better readability)

// Pure function to get game actions
export const getGameActions = (
  state: HistoryState,
  gameId: string
): readonly GameHistoryAction[] => state.actions.get(gameId) || []

// Pure function to reconstruct game state
export const reconstructGameState = async (
  state: HistoryState,
  gameId: string,
  options: ReconstructionOptions
): Promise<Result<ReconstructionResult, string>> => {
  const gameActions = getGameActions(state, gameId)

  if (gameActions.length === 0) {
    return Promise.resolve(failure(`No history found for game ${gameId}`))
  } else {
    return ReconstructionService.reconstructAtSequence(gameActions, options)
  }
}

// Pure function to clear game history
export const clearGameHistory = (
  state: HistoryState,
  gameId: string
): HistoryState => ({
  actions: new Map([...state.actions].filter(([id]) => id !== gameId)),
  histories: new Map([...state.histories].filter(([id]) => id !== gameId)),
})

// Pure function to clear all history
export const clearAllHistory = (): HistoryState => createInitialHistoryState()

// Export the functional service module
export const GameHistoryService = {
  createInitialState: createInitialHistoryState,
  recordAction,
  getGameHistory,
  queryHistory,
  getGameActions,
  reconstructGameState,
  clearGameHistory,
  clearAllHistory,
} as const
