import { BackgammonGame } from '@nodots-llc/backgammon-types';
export interface GameAction {
    type: 'roll' | 'move' | 'pass' | 'double' | 'accept' | 'reject';
    player: string;
    payload?: any;
    timestamp: Date;
}
export interface PositionSnapshot {
    gameState: BackgammonGame;
    beforeMove: boolean;
    actionIndex: number;
    player: string;
    dice?: number[];
    moveData?: any;
}
export declare class PositionReconstructor {
    /**
     * Reconstruct game positions from action history
     */
    static reconstructGamePositions(initialGameState: BackgammonGame, actions: GameAction[]): Promise<PositionSnapshot[]>;
    /**
     * Reconstruct positions from database actions
     */
    static reconstructFromDatabaseActions(gameId: string, initialState: any, dbActions: Array<{
        actionType: string;
        nickname: string | null;
        payload: string | null;
        createdAt: Date;
    }>): Promise<PositionSnapshot[]>;
    /**
     * Extract move actions suitable for PR analysis
     */
    static extractMoveActions(snapshots: PositionSnapshot[]): Array<{
        player: string;
        move: any;
        dice?: number[];
        beforeState: BackgammonGame;
        afterState: BackgammonGame;
    }>;
    /**
     * Apply a single action to a game state (simplified implementation)
     */
    private static applyActionToGame;
    /**
     * Map database action types to our GameAction types
     */
    private static mapActionType;
    /**
     * Validate that a game state is suitable for PR analysis
     */
    static isValidForAnalysis(gameState: BackgammonGame): boolean;
}
//# sourceMappingURL=PositionReconstructor.d.ts.map