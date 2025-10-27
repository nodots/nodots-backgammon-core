import { BackgammonBoard, BackgammonCheckerContainer, BackgammonDieValue, BackgammonGame, BackgammonMove, BackgammonMoveKind, BackgammonMoveOrigin, BackgammonMoveReady, BackgammonMoveResult, BackgammonMoveStateKind, BackgammonPlayer, BackgammonPlayerMoving, BackgammonPoint, MoveProps } from '@nodots-llc/backgammon-types';
export interface SimpleMoveResult {
    success: boolean;
    game?: BackgammonGame;
    error?: string;
    possibleMoves?: BackgammonMoveReady[];
}
export interface GameLookupFunction {
    (gameId: string): Promise<BackgammonGame | null>;
}
export declare class Move {
    player: BackgammonPlayer;
    id: string;
    dieValue: BackgammonDieValue;
    stateKind: BackgammonMoveStateKind;
    moveKind: BackgammonMoveKind | undefined;
    origin: BackgammonCheckerContainer | undefined;
    destination: BackgammonCheckerContainer | undefined;
    /**
     * Simplified move method that takes gameId and checkerId and figures out the rest
     * @param gameId - The game ID
     * @param checkerId - The checker ID to move
     * @param gameLookup - Function to lookup game by ID (injected from API layer)
     * @returns SimpleMoveResult with success/error and updated game state
     */
    static moveChecker: (gameId: string, checkerId: string, gameLookup: GameLookupFunction) => Promise<SimpleMoveResult>;
    /**
     * Execute a move for a robot player with explicit state management
     */
    private static executeRobotMove;
    /**
     * Helper method to find a checker by ID in the board
     */
    private static findCheckerInBoard;
    /**
     * Helper method to determine possible moves for a checker
     */
    private static getPossibleMovesForChecker;
    /**
     * Helper method to get available dice values
     */
    private static getAvailableDice;
    /**
     * Helper method to determine move kind based on origin and destination
     */
    private static determineMoveKind;
    /**
     * Helper method to check if a checker can bear off
     */
    private static canBearOff;
    static initialize: ({ move, origin, }: MoveProps) => BackgammonMove;
    static isPointOpen: (point: BackgammonPoint, player: BackgammonPlayerMoving) => boolean;
    static move: (board: BackgammonBoard, move: BackgammonMoveReady, origin: BackgammonMoveOrigin) => BackgammonMoveResult;
}
//# sourceMappingURL=index.d.ts.map