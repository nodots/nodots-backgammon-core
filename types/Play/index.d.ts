import { BackgammonBoard, BackgammonCheckerContainer, BackgammonCube, BackgammonMoveOrigin, BackgammonMoves, BackgammonPlayerMoving, BackgammonPlayerRolling, BackgammonPlayMoving, BackgammonPlayResult, BackgammonPlayStateKind } from '@nodots-llc/backgammon-types';
export * from '../index';
export declare class Play {
    id?: string;
    cube?: BackgammonCube;
    stateKind?: BackgammonPlayStateKind;
    moves?: BackgammonMoves;
    board: BackgammonBoard;
    player: BackgammonPlayerRolling | BackgammonPlayerMoving;
    private static planMoveExecution;
    private static executePlannedMove;
    static pureMove: (board: BackgammonBoard, play: BackgammonPlayMoving, origin: BackgammonMoveOrigin) => BackgammonPlayResult;
    static move: (board: BackgammonBoard, play: BackgammonPlayMoving, origin: BackgammonMoveOrigin) => BackgammonPlayResult;
    private static partitionMovesForBarReentry;
    private static simulateMoves;
    private static createMovesForDiceValues;
    static initialize: (board: BackgammonBoard, player: BackgammonPlayerMoving) => BackgammonPlayMoving;
    static startMove: (play: BackgammonPlayMoving) => BackgammonPlayMoving;
    /**
     * Validates if a move from the specified origin is legal
     * Returns true if the origin has valid moves, false otherwise
     * This is a defensive check to prevent invalid move attempts
     */
    static canMoveFrom(play: BackgammonPlayMoving, board: BackgammonBoard, origin: BackgammonCheckerContainer): boolean;
    /**
     * Returns the list of valid origin container IDs that have legal moves
     * This can be used by UI to highlight or enable only valid checkers
     */
    static getValidOrigins(play: BackgammonPlayMoving, board: BackgammonBoard): string[];
    /**
     * Validates if a move sequence violates mandatory dice usage rules
     * According to backgammon rules:
     * 1. A player MUST use both dice if legally possible
     * 2. If only one die can be used, the player MUST use the larger value if possible
     * 3. A player cannot voluntarily forfeit the use of a die if there's a legal move
     */
    static validateMoveSequence(board: BackgammonBoard, play: BackgammonPlayMoving): {
        isValid: boolean;
        error?: string;
        alternativeSequences?: any[];
    };
    /**
     * Determines if both dice can be legally used from the current board state
     * Analyzes all possible move sequences using activePlay.moves
     */
    static canUseBothDice(board: BackgammonBoard, play: BackgammonPlayMoving): boolean;
    /**
     * Finds alternative move sequences that could use more dice
     * Uses activePlay.moves structure to simulate different sequences
     */
    static findAlternativeSequences(board: BackgammonBoard, play: BackgammonPlayMoving): Array<{
        sequence: any[];
        diceUsed: number;
    }>;
    /**
     * Test how many dice can actually be used by trying to execute moves in sequence
     * This is the proper implementation that was missing, causing validation to fail
     */
    private static testSequenceDiceUsage;
    /**
     * Returns the mandatory move sequence when backgammon rules dictate a specific sequence
     * This enforces rules like "must use both dice" and "must use larger die"
     */
    static getMandatoryMoveSequence(board: BackgammonBoard, play: BackgammonPlayMoving): {
        isMandatory: boolean;
        sequence?: any[];
        reason?: string;
    };
}
//# sourceMappingURL=index.d.ts.map