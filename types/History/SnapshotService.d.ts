import { BackgammonGame } from '@nodots-llc/backgammon-types';
import { GameStateSnapshot } from '@nodots-llc/backgammon-types';
/**
 * Result types for discriminated unions
 */
type SnapshotResult<T> = {
    kind: 'success';
    data: T;
} | {
    kind: 'failure';
    error: string;
    details?: unknown;
};
type ValidationResult = {
    kind: 'valid';
} | {
    kind: 'invalid';
    reason: string;
};
type RestoreResult = {
    kind: 'success';
    data: BackgammonGame;
} | {
    kind: 'failure';
    error: string;
    details?: unknown;
};
type ComparisonResult = {
    kind: 'equal';
} | {
    kind: 'different';
    differences: string[];
} | {
    kind: 'error';
    error: string;
};
/**
 * SnapshotService - Functional module for game state snapshots
 *
 * This module provides pure functions for:
 * - Creating complete, immutable snapshots of game state
 * - Restoring BackgammonGame objects from snapshots
 * - Validating snapshot integrity and consistency
 * - Comparing snapshots for equality
 *
 * All functions are pure and use discriminated unions for error handling
 * Board access follows CLAUDE.md patterns using player.direction
 */
/**
 * Create a complete snapshot of the current game state
 * Pure function that captures every aspect needed for perfect reconstruction
 */
export declare function createSnapshot(game: BackgammonGame): SnapshotResult<GameStateSnapshot>;
/**
 * Restore a BackgammonGame object from a snapshot
 * Pure function that performs complete reconstruction to the exact state
 */
export declare function restoreFromSnapshot(snapshot: GameStateSnapshot): Promise<RestoreResult>;
/**
 * Validate that a snapshot is complete and consistent
 * Pure function with comprehensive validation checks
 */
export declare function validateSnapshot(snapshot: GameStateSnapshot): ValidationResult;
/**
 * Compare two snapshots for equality
 * Pure function with detailed difference reporting
 */
export declare function compareSnapshots(snapshot1: GameStateSnapshot, snapshot2: GameStateSnapshot): ComparisonResult;
export {};
//# sourceMappingURL=SnapshotService.d.ts.map