import { BackgammonBar, BackgammonBoard, BackgammonChecker, BackgammonCheckerContainer, BackgammonCheckerContainerImport, BackgammonColor, BackgammonGame, BackgammonMoveDirection, BackgammonOff, BackgammonPlayer, BackgammonPlayers, BackgammonPoint, BackgammonPoints } from '@nodots-llc/backgammon-types';
export { exportToGnuPositionId } from './gnuPositionId';
export declare const BOARD_POINT_COUNT = 24;
export interface RandomGameSetup {
    board: BackgammonBoard;
    players: BackgammonPlayers;
    activeColor: BackgammonColor;
}
export declare class Board implements BackgammonBoard {
    id: string;
    points: BackgammonPoints;
    bar: {
        clockwise: BackgammonBar;
        counterclockwise: BackgammonBar;
    };
    off: {
        clockwise: BackgammonOff;
        counterclockwise: BackgammonOff;
    };
    static initialize(boardImport?: BackgammonCheckerContainerImport[]): BackgammonBoard;
    static moveChecker(board: BackgammonBoard, origin: BackgammonPoint | BackgammonBar, destination: BackgammonPoint | BackgammonOff, direction: BackgammonMoveDirection): BackgammonBoard;
    static getCheckers(board: BackgammonBoard): BackgammonChecker[];
    static getCheckersForColor(board: BackgammonBoard, color: BackgammonColor): BackgammonChecker[];
    static getPoints: (board: BackgammonBoard) => BackgammonPoint[];
    static getBars: (board: BackgammonBoard) => BackgammonBar[];
    static getOffs: (board: BackgammonBoard) => BackgammonOff[];
    static getCheckerContainers: (board: BackgammonBoard) => BackgammonCheckerContainer[];
    private static cloneBoard;
    static getCheckerContainer: (board: BackgammonBoard, id: string) => BackgammonCheckerContainer;
    static getPossibleMoves: (board: BackgammonBoard, player: BackgammonPlayer, dieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue, otherDieValue?: import("@nodots-llc/backgammon-types").BackgammonDieValue, origin?: import("@nodots-llc/backgammon-types").BackgammonMoveOrigin) => import("@nodots-llc/backgammon-types").BackgammonMoveSkeleton[] | {
        moves: import("@nodots-llc/backgammon-types").BackgammonMoveSkeleton[];
        usedDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
        autoSwitched: boolean;
        originalDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
    };
    /** @deprecated Use getPossibleMoves with otherDieValue parameter instead */
    static getPossibleMovesWithIntelligentDiceSwitching: (board: BackgammonBoard, player: BackgammonPlayer, dieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue, otherDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue) => {
        moves: import("@nodots-llc/backgammon-types").BackgammonMoveSkeleton[];
        usedDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
        autoSwitched: boolean;
        originalDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
    };
    /** @deprecated Use getPossibleMoves with otherDieValue and origin parameters instead */
    static getPossibleMovesWithPositionSpecificAutoSwitch: (board: BackgammonBoard, player: BackgammonPlayer, origin: import("@nodots-llc/backgammon-types").BackgammonMoveOrigin, dieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue, otherDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue) => {
        moves: import("@nodots-llc/backgammon-types").BackgammonMoveSkeleton[];
        usedDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
        autoSwitched: boolean;
        originalDieValue: import("@nodots-llc/backgammon-types").BackgammonDieValue;
    };
    static getPipCounts: (game: BackgammonGame) => {
        black: number;
        white: number;
    };
    static buildBoard(boardImport: BackgammonCheckerContainerImport[]): BackgammonBoard;
    private static buildBar;
    private static buildOff;
    /**
     * Generates a random board with random players and active color
     * @deprecated Use generateRandomGameSetup() for more explicit return type
     */
    static generateRandomBoard: () => BackgammonBoard & {
        players: BackgammonPlayers;
        activeColor: BackgammonColor;
    };
    /**
     * Generates only a random board configuration (original behavior)
     */
    static generateRandomBoardOnly: () => BackgammonBoard;
    /**
     * Generates a complete random game setup with board, players, and active color
     */
    static generateRandomGameSetup: () => RandomGameSetup;
    static getAsciiBoard: (board: BackgammonBoard, players?: BackgammonPlayers, activePlayer?: BackgammonPlayer, moveNotation?: string, playerModels?: Record<string, string>) => string;
    static getAsciiGameBoard: (board: BackgammonBoard, players?: BackgammonPlayers, activeColor?: BackgammonColor, gameStateKind?: string, moveNotation?: string, playerModels?: Record<string, string>) => string;
    static displayAsciiBoard: (board: BackgammonBoard | undefined) => void;
    /**
     * Creates a board setup that matches the given player color assignments
     * @param clockwiseColor - Color of the player moving clockwise
     * @param counterclockwiseColor - Color of the player moving counterclockwise
     */
    static createBoardForPlayers: (clockwiseColor: BackgammonColor, counterclockwiseColor: BackgammonColor) => BackgammonBoard;
}
//# sourceMappingURL=index.d.ts.map