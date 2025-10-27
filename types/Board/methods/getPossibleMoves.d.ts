import { BackgammonBoard, BackgammonDieValue, BackgammonMoveOrigin, BackgammonMoveSkeleton, BackgammonPlayer } from '@nodots-llc/backgammon-types';
/**
 * Enhanced getPossibleMoves that consolidates all three previous functions
 * Always uses intelligent dice switching when possible for optimal move selection
 *
 * @param board - Current board state
 * @param player - Player making the move
 * @param dieValue - Primary die value to try
 * @param otherDieValue - Optional: Other die value for intelligent switching
 * @param origin - Optional: Specific origin for position-specific switching
 * @returns Enhanced result with moves, dice switching info, and backward compatibility
 */
export declare const getPossibleMoves: (board: BackgammonBoard, player: BackgammonPlayer, dieValue: BackgammonDieValue, otherDieValue?: BackgammonDieValue, origin?: BackgammonMoveOrigin) => BackgammonMoveSkeleton[] | {
    moves: BackgammonMoveSkeleton[];
    usedDieValue: BackgammonDieValue;
    autoSwitched: boolean;
    originalDieValue: BackgammonDieValue;
};
/**
 * @deprecated Use getPossibleMoves(board, player, dieValue, otherDieValue) instead
 * This function is kept for backward compatibility during transition
 */
export declare const getPossibleMovesWithIntelligentDiceSwitching: (board: BackgammonBoard, player: BackgammonPlayer, dieValue: BackgammonDieValue, otherDieValue: BackgammonDieValue) => {
    moves: BackgammonMoveSkeleton[];
    usedDieValue: BackgammonDieValue;
    autoSwitched: boolean;
    originalDieValue: BackgammonDieValue;
};
/**
 * @deprecated Use getPossibleMoves(board, player, dieValue, otherDieValue, origin) instead
 * This function is kept for backward compatibility during transition
 */
export declare const getPossibleMovesWithPositionSpecificAutoSwitch: (board: BackgammonBoard, player: BackgammonPlayer, origin: BackgammonMoveOrigin, dieValue: BackgammonDieValue, otherDieValue: BackgammonDieValue) => {
    moves: BackgammonMoveSkeleton[];
    usedDieValue: BackgammonDieValue;
    autoSwitched: boolean;
    originalDieValue: BackgammonDieValue;
};
//# sourceMappingURL=getPossibleMoves.d.ts.map