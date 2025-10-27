import { BackgammonBoard, BackgammonColor, BackgammonDice, BackgammonMoveDirection, BackgammonMoveResult, BackgammonPlayer, BackgammonPlayerMoving, BackgammonPlayerRolledForStart, BackgammonPlayerRolling, BackgammonPlayerRollingForStart, BackgammonPlayerStateKind, BackgammonPlayerWinner, BackgammonPlayMoving, BackgammonPoint } from '@nodots-llc/backgammon-types';
import { Board } from '..';
export * from '../index';
/**
 * Supported move selection strategies.
 */
export type BackgammonMoveStrategy = 'random' | 'furthest-checker' | 'gnubg';
export declare class Player {
    id: string;
    stateKind: BackgammonPlayerStateKind;
    dice: BackgammonDice;
    pipCount: number;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: BackgammonPlayerStateKind, isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayer;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'inactive', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayer;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'rolling-for-start', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayerRollingForStart;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'rolled-for-start', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayerRolledForStart;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'rolling', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayerRolling;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'moving', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayerMoving;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind: 'winner', isRobot: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayerWinner;
    static initialize(color: BackgammonColor, direction: BackgammonMoveDirection, stateKind?: BackgammonPlayerStateKind, isRobot?: boolean, userId?: string, pipCount?: number, id?: string): BackgammonPlayer;
    static rollForStart: (player: BackgammonPlayerRollingForStart) => BackgammonPlayerRolledForStart;
    static roll: (player: BackgammonPlayerRolling) => BackgammonPlayerMoving;
    static move: (board: Board, play: BackgammonPlayMoving, originId: string) => BackgammonMoveResult;
    static getHomeBoard: (board: BackgammonBoard, player: BackgammonPlayer) => BackgammonPoint[];
    static getOpponentBoard: (board: BackgammonBoard, player: BackgammonPlayer) => BackgammonPoint[];
    static toMoving: (player: BackgammonPlayer) => BackgammonPlayerMoving;
    /**
     * Recalculates pip counts for both players based on current board state
     * @param game - The game state to recalculate pip counts for
     * @returns Updated players array with recalculated pip counts
     */
    static recalculatePipCounts: (game: import("@nodots-llc/backgammon-types").BackgammonGame) => import("@nodots-llc/backgammon-types").BackgammonPlayers;
    /**
     * Calculates the pip count for a specific player color in a game.
     * @param game - The game to calculate pip count for
     * @param color - The color of the player to calculate pip count for
     * @returns The pip count for the specified player
     */
    static calculatePipCount: (game: import("@nodots-llc/backgammon-types").BackgammonGame, color: import("@nodots-llc/backgammon-types").BackgammonColor) => number;
    /**
     * Selects the best move from possible moves using GNU Backgammon AI.
     * @param play BackgammonPlayMoving containing possible moves
     * @returns A selected BackgammonMoveReady, or undefined if no moves
     */
    static getBestMove: (play: BackgammonPlayMoving, playerUserId?: string) => Promise<import("@nodots-llc/backgammon-types").BackgammonMoveReady | undefined>;
}
//# sourceMappingURL=index.d.ts.map