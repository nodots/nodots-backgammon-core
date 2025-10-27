import { BackgammonGame } from '@nodots-llc/backgammon-types';
import { GameActionData, GameActionMetadata, GameActionType, GameHistory, GameHistoryAction, GameReconstructionOptions } from '@nodots-llc/backgammon-types';
/**
 * Result types for discriminated unions
 */
type HistoryOperationResult<T> = {
    kind: 'success';
    data: T;
} | {
    kind: 'failure';
    error: string;
    details?: unknown;
};
/**
 * Record a new action in the game history
 * Pure function that creates complete before/after snapshots
 */
export declare function recordAction(gameId: string, playerId: string, actionType: GameActionType, actionData: GameActionData, gameStateBefore: BackgammonGame, gameStateAfter: BackgammonGame, metadata?: Partial<GameActionMetadata>): Promise<HistoryOperationResult<GameHistoryAction>>;
/**
 * Get complete history for a game
 * Pure function that returns a copy to prevent mutations
 */
export declare function getGameHistory(gameId: string): Promise<HistoryOperationResult<GameHistory>>;
/**
 * Reconstruct game state at any point in history
 * Uses progressive reconstruction for accuracy and performance
 */
export declare function reconstructGameAtAction(gameId: string, sequenceNumber: number, options?: GameReconstructionOptions): Promise<HistoryOperationResult<BackgammonGame>>;
/**
 * Get actions within a sequence range
 * Pure function with proper error handling
 */
export declare function getActionRange(gameId: string, startSequence: number, endSequence: number): Promise<HistoryOperationResult<GameHistoryAction[]>>;
/**
 * Get the most recent action for a game
 */
export declare function getLatestAction(gameId: string): Promise<HistoryOperationResult<GameHistoryAction>>;
/**
 * Remove actions after a specific sequence number (for undo functionality)
 * Pure function that returns updated history
 */
export declare function truncateHistoryAfter(gameId: string, sequenceNumber: number): Promise<HistoryOperationResult<boolean>>;
/**
 * Clear all history data (for testing or cleanup)
 */
export declare function clearAllHistories(): Promise<HistoryOperationResult<void>>;
/**
 * Get history statistics
 * Pure function that calculates stats from current state
 */
export declare function getHistoryStats(): {
    totalGames: number;
    totalActions: number;
};
export {};
//# sourceMappingURL=HistoryService.d.ts.map