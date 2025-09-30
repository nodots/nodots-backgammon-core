import {
  BackgammonColor,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import {
  BoardPositionSnapshot,
  CubeStateSnapshot,
  DiceStateSnapshot,
  GameActionData,
  GameActionMetadata,
  GameActionType,
  GameHistory,
  GameHistoryAction,
  GameHistoryMetadata,
  GameReconstructionOptions,
  GameStateSnapshot,
  PlayerStatesSnapshot,
} from '@nodots-llc/backgammon-types'
import { generateId } from '../'
import { logger } from '../utils/logger'

/**
 * Result types for discriminated unions
 */
type HistoryOperationResult<T> =
  | { kind: 'success'; data: T }
  | { kind: 'failure'; error: string; details?: unknown }

type ValidationResult = { kind: 'valid' } | { kind: 'invalid'; reason: string }

/**
 * GameHistoryService - Functional module for comprehensive game history tracking
 *
 * This module provides pure functions for:
 * - Recording game actions with complete state snapshots
 * - Retrieving game history with proper error handling
 * - Reconstructing game state from history
 * - Validating history integrity
 *
 * All functions are pure and use discriminated unions for error handling
 */

// In-memory storage (in production, this would be replaced with persistent storage)
const histories = new Map<string, GameHistory>()
const version = '1.0.0'

/**
 * Record a new action in the game history
 * Pure function that creates complete before/after snapshots
 */
export async function recordAction(
  gameId: string,
  playerId: string,
  actionType: GameActionType,
  actionData: GameActionData,
  gameStateBefore: BackgammonGame,
  gameStateAfter: BackgammonGame,
  metadata?: Partial<GameActionMetadata>
): Promise<HistoryOperationResult<GameHistoryAction>> {
  try {
    const historyResult = await getOrCreateGameHistory(gameId)
    if (historyResult.kind === 'failure') {
      return historyResult
    }

    const history = historyResult.data
    const sequenceNumber = history.actions.length + 1
    const timestamp = new Date()

    const beforeSnapshotResult = createGameStateSnapshot(gameStateBefore)
    if (beforeSnapshotResult.kind === 'failure') {
      return beforeSnapshotResult
    }

    const afterSnapshotResult = createGameStateSnapshot(gameStateAfter)
    if (afterSnapshotResult.kind === 'failure') {
      return afterSnapshotResult
    }

    const action: GameHistoryAction = {
      id: generateId(),
      gameId,
      sequenceNumber,
      timestamp,
      playerId,
      actionType,
      actionData,
      gameStateBefore: beforeSnapshotResult.data,
      gameStateAfter: afterSnapshotResult.data,
      metadata: {
        duration: metadata?.duration || 0,
        undoable: metadata?.undoable ?? true,
        difficulty: metadata?.difficulty,
        gnuPositionId: metadata?.gnuPositionId,
        moveNumber: metadata?.moveNumber,
        isForced: metadata?.isForced,
      },
    }

    // Create updated history (immutable)
    const updatedHistory: GameHistory = {
      ...history,
      actions: [...history.actions, action],
      updatedAt: timestamp,
      metadata: {
        ...history.metadata,
        totalActions: history.actions.length + 1,
        ...updateHistoryMetadata(history.metadata, action),
      },
    }

    // Update storage
    histories.set(gameId, updatedHistory)

    logger.info(`Recorded action ${actionType} for game ${gameId}`, {
      sequenceNumber,
      playerId,
      actionType,
    })

    return { kind: 'success', data: action }
  } catch (error) {
    logger.error(`Failed to record action for game ${gameId}`, error)
    return {
      kind: 'failure',
      error: `History recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Get complete history for a game
 * Pure function that returns a copy to prevent mutations
 */
export async function getGameHistory(
  gameId: string
): Promise<HistoryOperationResult<GameHistory>> {
  try {
    const history = histories.get(gameId)
    if (!history) {
      logger.warn(`No history found for game ${gameId}`)
      return {
        kind: 'failure',
        error: `No history found for game ${gameId}`,
      }
    }

    logger.info(`Retrieved history for game ${gameId}`, {
      totalActions: history.actions.length,
    })

    // Return deep copy to prevent mutations
    return {
      kind: 'success',
      data: structuredClone(history),
    }
  } catch (error) {
    logger.error(`Failed to get history for game ${gameId}`, error)
    return {
      kind: 'failure',
      error: `History retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Reconstruct game state at any point in history
 * Uses progressive reconstruction for accuracy and performance
 */
export async function reconstructGameAtAction(
  gameId: string,
  sequenceNumber: number,
  options: GameReconstructionOptions = {}
): Promise<HistoryOperationResult<BackgammonGame>> {
  try {
    const historyResult = await getGameHistory(gameId)
    if (historyResult.kind === 'failure') {
      return historyResult
    }

    const history = historyResult.data
    const validationResult = validateSequenceNumber(history, sequenceNumber)
    if (validationResult.kind === 'invalid') {
      return {
        kind: 'failure',
        error: validationResult.reason,
      }
    }

    if (options.validateIntegrity) {
      const integrityResult = await validateHistoryIntegrity(history)
      if (integrityResult.kind === 'invalid') {
        return {
          kind: 'failure',
          error: `History integrity validation failed: ${integrityResult.reason}`,
        }
      }
    }

    const targetAction = history.actions[sequenceNumber - 1]
    const reconstructionResult = await reconstructGameFromSnapshot(
      targetAction.gameStateAfter
    )

    if (reconstructionResult.kind === 'failure') {
      return reconstructionResult
    }

    logger.info(`Reconstructed game ${gameId} at sequence ${sequenceNumber}`)
    return reconstructionResult
  } catch (error) {
    logger.error(
      `Failed to reconstruct game ${gameId} at sequence ${sequenceNumber}`,
      error
    )
    return {
      kind: 'failure',
      error: `Game reconstruction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Get actions within a sequence range
 * Pure function with proper error handling
 */
export async function getActionRange(
  gameId: string,
  startSequence: number,
  endSequence: number
): Promise<HistoryOperationResult<GameHistoryAction[]>> {
  const historyResult = await getGameHistory(gameId)
  if (historyResult.kind === 'failure') {
    return historyResult
  }

  const history = historyResult.data

  // Validate range
  if (
    startSequence < 1 ||
    endSequence < startSequence ||
    endSequence > history.actions.length
  ) {
    return {
      kind: 'failure',
      error: `Invalid sequence range: ${startSequence}-${endSequence} for history with ${history.actions.length} actions`,
    }
  }

  const actions = history.actions.filter(
    (action: GameHistoryAction) =>
      action.sequenceNumber >= startSequence &&
      action.sequenceNumber <= endSequence
  )

  return { kind: 'success', data: actions }
}

/**
 * Get the most recent action for a game
 */
export async function getLatestAction(
  gameId: string
): Promise<HistoryOperationResult<GameHistoryAction>> {
  const historyResult = await getGameHistory(gameId)
  if (historyResult.kind === 'failure') {
    return historyResult
  }

  const history = historyResult.data
  if (history.actions.length === 0) {
    return {
      kind: 'failure',
      error: 'No actions found in history',
    }
  }

  return {
    kind: 'success',
    data: history.actions[history.actions.length - 1],
  }
}

/**
 * Remove actions after a specific sequence number (for undo functionality)
 * Pure function that returns updated history
 */
export async function truncateHistoryAfter(
  gameId: string,
  sequenceNumber: number
): Promise<HistoryOperationResult<boolean>> {
  try {
    const historyResult = await getGameHistory(gameId)
    if (historyResult.kind === 'failure') {
      return historyResult
    }

    const history = historyResult.data
    const originalLength = history.actions.length
    const filteredActions = history.actions.filter(
      (action: GameHistoryAction) => action.sequenceNumber <= sequenceNumber
    )

    const removedCount = originalLength - filteredActions.length
    if (removedCount > 0) {
      const updatedHistory: GameHistory = {
        ...history,
        actions: filteredActions,
        updatedAt: new Date(),
        metadata: {
          ...history.metadata,
          totalActions: filteredActions.length,
        },
      }

      histories.set(gameId, updatedHistory)
      logger.info(
        `Truncated ${removedCount} actions from game ${gameId} after sequence ${sequenceNumber}`
      )
    }

    return { kind: 'success', data: removedCount > 0 }
  } catch (error) {
    logger.error(`Failed to truncate history for game ${gameId}`, error)
    return {
      kind: 'failure',
      error: `History truncation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Clear all history data (for testing or cleanup)
 */
export async function clearAllHistories(): Promise<
  HistoryOperationResult<void>
> {
  try {
    histories.clear()
    logger.info('Cleared all game histories')
    return { kind: 'success', data: undefined }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to clear histories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Get history statistics
 * Pure function that calculates stats from current state
 */
export function getHistoryStats(): {
  totalGames: number
  totalActions: number
} {
  const totalGames = histories.size
  const totalActions = Array.from(histories.values()).reduce(
    (sum, history) => sum + history.actions.length,
    0
  )

  return { totalGames, totalActions }
}

// === PURE HELPER FUNCTIONS ===

/**
 * Create a complete snapshot of the current game state
 * Pure function with proper error handling
 */
function createGameStateSnapshot(
  game: BackgammonGame
): HistoryOperationResult<GameStateSnapshot> {
  try {
    const boardResult = createBoardPositionSnapshot(game)
    if (boardResult.kind === 'failure') {
      return boardResult
    }

    const diceResult = createDiceStateSnapshot(game)
    if (diceResult.kind === 'failure') {
      return diceResult
    }

    const cubeResult = createCubeStateSnapshot(game)
    if (cubeResult.kind === 'failure') {
      return cubeResult
    }

    const playersResult = createPlayerStatesSnapshot(game)
    if (playersResult.kind === 'failure') {
      return playersResult
    }

    const snapshot: GameStateSnapshot = {
      stateKind: game.stateKind,
      activeColor: game.activeColor || 'white',
      turnNumber: calculateTurnNumber(game),
      moveNumber: calculateMoveNumber(game),

      boardPositions: boardResult.data,
      diceState: diceResult.data,
      cubeState: cubeResult.data,
      playerStates: playersResult.data,

      pipCounts: {
        black: calculatePipCount(game, 'black'),
        white: calculatePipCount(game, 'white'),
      },

      gnuPositionId: generateGnuPositionId(game),
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create game state snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Create board position snapshot with proper player.direction access
 * FIXED: Now correctly uses player.direction instead of color for board access
 */
function createBoardPositionSnapshot(
  game: BackgammonGame
): HistoryOperationResult<BoardPositionSnapshot> {
  try {
    const snapshot: BoardPositionSnapshot = {
      points: {},
      bar: { black: [], white: [] },
      off: { black: [], white: [] },
    }

    // Map all checkers to their positions
    game.board.points.forEach((point) => {
      const position = point.position.clockwise.toString()
      snapshot.points[position] = point.checkers.map((checker) => ({
        id: checker.id,
        color: checker.color,
        position: point.position.clockwise,
      }))
    })

    // CRITICAL FIX: Access bar and off using player.direction, not color
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game',
      }
    }

    // Bar checkers - use player.direction for correct access
    snapshot.bar.black = game.board.bar[blackPlayer.direction].checkers.map(
      (checker) => ({
        id: checker.id,
        color: checker.color,
        position: 'bar' as const,
      })
    )

    snapshot.bar.white = game.board.bar[whitePlayer.direction].checkers.map(
      (checker) => ({
        id: checker.id,
        color: checker.color,
        position: 'bar' as const,
      })
    )

    // Off checkers - use player.direction for correct access
    snapshot.off.black = game.board.off[blackPlayer.direction].checkers.map(
      (checker) => ({
        id: checker.id,
        color: checker.color,
        position: 'off' as const,
      })
    )

    snapshot.off.white = game.board.off[whitePlayer.direction].checkers.map(
      (checker) => ({
        id: checker.id,
        color: checker.color,
        position: 'off' as const,
      })
    )

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create board position snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Create dice state snapshot with proper error handling
 */
function createDiceStateSnapshot(
  game: BackgammonGame
): HistoryOperationResult<DiceStateSnapshot> {
  try {
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game',
      }
    }

    const snapshot: DiceStateSnapshot = {
      black: {
        currentRoll: blackPlayer.dice?.currentRoll || undefined,
        availableMoves: getAvailableDiceValues(game, 'black'),
        usedMoves: getUsedDiceValues(game, 'black'),
        stateKind: getDiceStateKind(game, 'black'),
      },
      white: {
        currentRoll: whitePlayer.dice?.currentRoll || undefined,
        availableMoves: getAvailableDiceValues(game, 'white'),
        usedMoves: getUsedDiceValues(game, 'white'),
        stateKind: getDiceStateKind(game, 'white'),
      },
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create dice state snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Create cube state snapshot
 */
function createCubeStateSnapshot(
  game: BackgammonGame
): HistoryOperationResult<CubeStateSnapshot> {
  try {
    const cubeStateKind =
      game.cube.stateKind === 'initialized'
        ? 'centered'
        : game.cube.stateKind === 'maxxed'
          ? 'maxed'
          : (game.cube.stateKind as
              | 'centered'
              | 'offered'
              | 'doubled'
              | 'maxed')

    const cubeOwner = game.cube.owner as unknown as BackgammonColor | undefined

    const snapshot: CubeStateSnapshot = {
      value: game.cube.value ?? 1,
      owner: cubeOwner,
      stateKind: cubeStateKind,
      position: cubeOwner || 'center',
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create cube state snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Create player states snapshot with exhaustive pattern matching
 */
function createPlayerStatesSnapshot(
  game: BackgammonGame
): HistoryOperationResult<PlayerStatesSnapshot> {
  try {
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game',
      }
    }

    const snapshot: PlayerStatesSnapshot = {
      black: {
        pipCount: calculatePipCount(game, 'black'),
        stateKind: blackPlayer.stateKind,
        isRobot: blackPlayer.isRobot || false,
        userId: blackPlayer.userId || '',
        timeRemaining: undefined, // Not implemented yet
        movesThisTurn: getMovesThisTurn(game, 'black'),
        totalMoves: getTotalMoves(game, 'black'),
        canBearOff: canBearOff(game, 'black'),
        hasCheckersOnBar: hasCheckersOnBar(game, blackPlayer),
      },
      white: {
        pipCount: calculatePipCount(game, 'white'),
        stateKind: whitePlayer.stateKind,
        isRobot: whitePlayer.isRobot || false,
        userId: whitePlayer.userId || '',
        timeRemaining: undefined, // Not implemented yet
        movesThisTurn: getMovesThisTurn(game, 'white'),
        totalMoves: getTotalMoves(game, 'white'),
        canBearOff: canBearOff(game, 'white'),
        hasCheckersOnBar: hasCheckersOnBar(game, whitePlayer),
      },
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create player states snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Get or create a game history record
 * Pure function that returns a Result type
 */
async function getOrCreateGameHistory(
  gameId: string
): Promise<HistoryOperationResult<GameHistory>> {
  try {
    let history = histories.get(gameId)

    if (!history) {
      const now = new Date()
      history = {
        gameId,
        createdAt: now,
        updatedAt: now,
        actions: [],
        metadata: {
          totalActions: 0,
          gameStartTime: now,
          players: {
            black: {
              userId: '',
              isRobot: false,
            },
            white: {
              userId: '',
              isRobot: false,
            },
          },
          settings: {
            doubleAllowed: true,
            beaverAllowed: false,
            jacobyRule: false,
            matchPlay: false,
          },
          averageActionDuration: 0,
          totalThinkingTime: 0,
          version,
        },
      }

      histories.set(gameId, history)
      logger.info(`Created new history for game ${gameId}`)
    }

    return { kind: 'success', data: history }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to get or create game history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    }
  }
}

/**
 * Update history metadata after recording an action
 * Pure function that returns updated metadata
 */
function updateHistoryMetadata(
  currentMetadata: GameHistoryMetadata,
  action: GameHistoryAction
): Partial<GameHistoryMetadata> {
  const duration = action.metadata?.duration || 0

  // Calculate new average duration
  let newAverageActionDuration: number
  if (currentMetadata.totalActions > 0) {
    const currentAverage = currentMetadata.averageActionDuration
    const newCount = currentMetadata.totalActions + 1
    newAverageActionDuration =
      (currentAverage * currentMetadata.totalActions + duration) / newCount
  } else {
    newAverageActionDuration = duration
  }

  const updates: Partial<GameHistoryMetadata> = {
    averageActionDuration: newAverageActionDuration,
    totalThinkingTime: currentMetadata.totalThinkingTime + duration,
  }

  // Update final result if game is completed
  if (action.gameStateAfter.stateKind === 'completed') {
    // This would be populated based on the final game state
    // Implementation depends on how winners are determined in the game
  }

  return updates
}

/**
 * Reconstruct a BackgammonGame object from a state snapshot
 * Currently returns a failure - full implementation would rebuild the entire game object
 */
async function reconstructGameFromSnapshot(
  snapshot: GameStateSnapshot
): Promise<HistoryOperationResult<BackgammonGame>> {
  // This is a placeholder implementation
  // In practice, this would fully reconstruct the BackgammonGame object
  // from the snapshot data, including board state, players, dice, cube, etc.

  return {
    kind: 'failure',
    error:
      'Game reconstruction from snapshot not yet implemented - requires full game object recreation',
  }
}

/**
 * Validate the integrity of a game history
 * Pure function with exhaustive pattern matching
 */
async function validateHistoryIntegrity(
  history: GameHistory
): Promise<ValidationResult> {
  try {
    // Check sequence numbers are consecutive
    for (let i = 0; i < history.actions.length; i++) {
      if (history.actions[i].sequenceNumber !== i + 1) {
        return {
          kind: 'invalid',
          reason: `Invalid sequence number at index ${i}: expected ${i + 1}, got ${history.actions[i].sequenceNumber}`,
        }
      }
    }

    // Check timestamps are monotonically increasing
    for (let i = 1; i < history.actions.length; i++) {
      if (history.actions[i].timestamp < history.actions[i - 1].timestamp) {
        return {
          kind: 'invalid',
          reason: `Timestamp regression at sequence ${i + 1}`,
        }
      }
    }

    // Validate each action's state transition using exhaustive pattern matching
    for (let i = 0; i < history.actions.length - 1; i++) {
      const currentAction = history.actions[i]
      const nextAction = history.actions[i + 1]

      const transitionResult = validateStateTransition(
        currentAction.gameStateAfter.stateKind,
        nextAction.gameStateBefore.stateKind
      )

      if (transitionResult.kind === 'invalid') {
        logger.warn(
          `State transition inconsistency between actions ${i + 1} and ${i + 2}: ${transitionResult.reason}`
        )
      }
    }

    return { kind: 'valid' }
  } catch (error) {
    logger.error('History integrity validation failed', error)
    return {
      kind: 'invalid',
      reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validate state transitions using exhaustive pattern matching
 */
function validateStateTransition(
  currentState: string,
  nextState: string
): ValidationResult {
  // This would contain the full state machine validation
  // For now, we'll do a simple check
  if (currentState === nextState) {
    return { kind: 'valid' }
  }

  // Add more sophisticated validation based on the BackgammonGameStateKind
  return { kind: 'valid' } // Simplified for now
}

/**
 * Validate sequence number is within bounds
 */
function validateSequenceNumber(
  history: GameHistory,
  sequenceNumber: number
): ValidationResult {
  if (sequenceNumber < 1) {
    return {
      kind: 'invalid',
      reason: `Sequence number must be positive: ${sequenceNumber}`,
    }
  }

  if (sequenceNumber > history.actions.length) {
    return {
      kind: 'invalid',
      reason: `Sequence number ${sequenceNumber} exceeds history length ${history.actions.length}`,
    }
  }

  return { kind: 'valid' }
}

/**
 * Get player by color - pure helper function
 */
function getPlayerByColor(
  game: BackgammonGame,
  color: BackgammonColor
): BackgammonPlayer | null {
  // BackgammonPlayers is an array [player1, player2], find by color
  return game.players.find((player) => player.color === color) || null
}

/**
 * Check if player has checkers on bar using correct board access pattern
 * FIXED: Now uses player.direction instead of color
 */
function hasCheckersOnBar(
  game: BackgammonGame,
  player: BackgammonPlayer
): boolean {
  return game.board.bar[player.direction].checkers.length > 0
}

// === PLACEHOLDER HELPER FUNCTIONS ===
// These would be implemented with actual game logic

function calculateTurnNumber(game: BackgammonGame): number {
  return 1 // Placeholder
}

function calculateMoveNumber(game: BackgammonGame): number {
  return 1 // Placeholder
}

function calculatePipCount(
  game: BackgammonGame,
  color: BackgammonColor
): number {
  return 0 // Placeholder
}

function getAvailableDiceValues(
  game: BackgammonGame,
  color: BackgammonColor
): BackgammonDieValue[] {
  return [] // Placeholder
}

function getUsedDiceValues(
  game: BackgammonGame,
  color: BackgammonColor
): BackgammonDieValue[] {
  return [] // Placeholder
}

function getDiceStateKind(
  game: BackgammonGame,
  color: BackgammonColor
): 'inactive' | 'rolling' | 'rolled' | 'moving' | 'completed' {
  return 'inactive' // Placeholder
}

function getMovesThisTurn(
  game: BackgammonGame,
  color: BackgammonColor
): number {
  return 0 // Placeholder
}

function getTotalMoves(game: BackgammonGame, color: BackgammonColor): number {
  return 0 // Placeholder
}

function canBearOff(game: BackgammonGame, color: BackgammonColor): boolean {
  return false // Placeholder
}

function generateGnuPositionId(game: BackgammonGame): string | undefined {
  return undefined // Placeholder
}
