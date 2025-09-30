import type { BackgammonGame } from '@nodots-llc/backgammon-types'
import {
  GameActionType,
  GameActionData,
  GameActionMetadata,
} from '@nodots-llc/backgammon-types'
import { logger } from '../utils/logger'

export interface HistoryQueueInterface {
  enqueueAction(
    gameId: string,
    playerId: string,
    actionType: GameActionType,
    actionData: GameActionData,
    gameStateBefore: BackgammonGame,
    gameStateAfter: BackgammonGame,
    metadata?: Partial<GameActionMetadata>
  ): Promise<void>
}

// Global history queue instance - will be set by the API layer
let historyQueue: HistoryQueueInterface | null = null

export function setHistoryQueue(queue: HistoryQueueInterface): void {
  historyQueue = queue
}

export async function enqueueHistoryAction(
  gameId: string,
  playerId: string,
  actionType: GameActionType,
  actionData: GameActionData,
  gameStateBefore: BackgammonGame,
  gameStateAfter: BackgammonGame,
  metadata?: Partial<GameActionMetadata>
): Promise<void> {
  if (!historyQueue) {
    logger.warn('History queue not initialized - history action will not be recorded')
    return
  }

  try {
    await historyQueue.enqueueAction(
      gameId,
      playerId,
      actionType,
      actionData,
      gameStateBefore,
      gameStateAfter,
      metadata
    )
  } catch (error) {
    logger.warn(`Failed to enqueue history action ${actionType}:`, error)
  }
}
