import { BackgammonBoard, BackgammonChecker, BackgammonColor, BackgammonCube, BackgammonGame, BackgammonGameDoubled, BackgammonGameMoved, BackgammonGameMoving, BackgammonGameRolledForStart, BackgammonGameRolling, BackgammonGameRollingForStart, BackgammonGameStateKind, BackgammonPlay, BackgammonPlayer, BackgammonPlayerActive, BackgammonPlayerInactive, BackgammonPlayerMoving, BackgammonPlayerRolledForStart, BackgammonPlayerRolling, BackgammonPlayers, BackgammonPlayMoving } from '@nodots-llc/backgammon-types';
import { Board } from '../Board';
import { Cube } from '../Cube';
export * from '../index';
import type { BackgammonGameCompleted, BackgammonPlayersRolledForStartTuple } from '@nodots-llc/backgammon-types';
export declare class Game {
    id: string;
    stateKind: BackgammonGameStateKind;
    players: BackgammonPlayers;
    board: Board;
    cube: Cube;
    activeColor: BackgammonColor;
    activePlay: BackgammonPlay;
    activePlayer: BackgammonPlayerActive;
    inactivePlayer: BackgammonPlayerInactive;
    /**
     * Gets the GNU Position ID for the current board state
     * This is calculated dynamically based on the current game state
     */
    get gnuPositionId(): string;
    static createNewGame: (player1: {
        userId: string;
        isRobot: boolean;
    }, player2: {
        userId: string;
        isRobot: boolean;
    }) => BackgammonGameRollingForStart;
    private static createBaseGameProperties;
    /**
     * @internal - Low-level constructor for scripts and internal use only.
     * Use Game.createNewGame() for normal game creation.
     */
    static initialize(players: BackgammonPlayers, id?: string, stateKind?: 'rolling-for-start', board?: BackgammonBoard, cube?: BackgammonCube, activePlay?: BackgammonPlay, activeColor?: BackgammonColor, activePlayer?: BackgammonPlayer, inactivePlayer?: BackgammonPlayer): BackgammonGameRollingForStart;
    static initialize(players: BackgammonPlayersRolledForStartTuple, id: string | undefined, stateKind: 'rolled-for-start', board: BackgammonBoard, cube: BackgammonCube, activePlay: undefined, activeColor: BackgammonColor, activePlayer: BackgammonPlayerRolledForStart, inactivePlayer: BackgammonPlayerRolledForStart): BackgammonGameRolledForStart;
    static initialize(players: BackgammonPlayers, id: string | undefined, stateKind: 'rolling', board: BackgammonBoard, cube: BackgammonCube, activePlay: undefined, activeColor: BackgammonColor, activePlayer: BackgammonPlayerRolling, inactivePlayer: BackgammonPlayerInactive): BackgammonGameRolling;
    static initialize(players: BackgammonPlayers, id: string | undefined, stateKind: 'rolling', board: BackgammonBoard | undefined, cube: BackgammonCube | undefined, activePlay: undefined, activeColor: BackgammonColor, activePlayer: BackgammonPlayerRolling, inactivePlayer: BackgammonPlayerInactive): BackgammonGameRolling;
    static initialize(players: BackgammonPlayers, id: string | undefined, stateKind: 'moving', board: BackgammonBoard, cube: BackgammonCube, activePlay: BackgammonPlayMoving, activeColor: BackgammonColor, activePlayer: BackgammonPlayerMoving, inactivePlayer: BackgammonPlayerInactive): BackgammonGameMoving;
    static initialize(players: BackgammonPlayers, id?: string, stateKind?: BackgammonGameStateKind, board?: BackgammonBoard, cube?: BackgammonCube, activePlay?: BackgammonPlay, activeColor?: BackgammonColor, activePlayer?: BackgammonPlayer, inactivePlayer?: BackgammonPlayer): BackgammonGame;
    static initialize(players: BackgammonPlayers, id: string | undefined, stateKind: 'moving', board: BackgammonBoard | undefined, cube: BackgammonCube | undefined, activePlay: BackgammonPlayMoving, activeColor: BackgammonColor, activePlayer: BackgammonPlayerMoving, inactivePlayer: BackgammonPlayerInactive): BackgammonGameMoving;
    static rollForStart: (game: BackgammonGameRollingForStart) => BackgammonGameRolledForStart;
    static roll: (game: BackgammonGameRolledForStart | BackgammonGameRolling | BackgammonGameDoubled) => BackgammonGameMoving;
    /**
     * Switch the order of dice for the active player
     * Allowed in 'moving' state when all moves are undone
     */
    static switchDice: (game: BackgammonGameMoving) => BackgammonGameMoving;
    static move: (game: BackgammonGameMoving, checkerId: string) => BackgammonGameMoving | BackgammonGameMoved | BackgammonGameCompleted;
    /**
     * Transition from 'moving' to 'moved' state
     * This represents that all moves are completed and the player must confirm their turn
     */
    static toMoved: (game: BackgammonGameMoving) => BackgammonGameMoved;
    /**
     * Execute a single move and recalculate fresh moves (just-in-time approach)
     * This method prevents stale move references by always calculating moves based on current board state
     * @param game - Current game state in 'moving' state
     * @param originId - ID of the origin point/bar to move from
     * @returns Updated game state with fresh moves calculated
     */
    static executeAndRecalculate: (game: BackgammonGameMoving, originId: string) => BackgammonGameMoving | BackgammonGame;
    /**
     * Check if the current turn is complete and transition to 'moved' state
     * This method now follows the same state machine as human players for consistency
     * @param game - Current game state
     * @returns Updated game state in 'moved' state or current game if turn not complete
     */
    static checkAndCompleteTurn: (game: BackgammonGameMoving) => BackgammonGame;
    /**
     * Manually confirm the current turn and pass control to the next player
     * This is triggered by dice click after the player has finished their moves
     * @param game - Current game state in 'moving' state
     * @returns Updated game state with next player's turn
     */
    static confirmTurn: (game: BackgammonGameMoved) => BackgammonGameRolling;
    /**
     * Handle robot automation for games in 'moved' state
     * If the active player is a robot and the game is in 'moved' state, automatically confirm the turn
     * @param game - Game in any state
     * @returns Game with turn confirmed if robot automation was applied, otherwise unchanged
     */
    static handleRobotMovedState: (game: BackgammonGame) => BackgammonGame;
    /**
     * Execute a complete robot turn including all moves and turn confirmation
     * This method handles the entire turn cycle for a robot player:
     * 1. Executes all available dice moves using Player.getBestMove()
     * 2. Transitions to 'moved' state when all moves complete
     * 3. Automatically confirms the turn (equivalent to dice click)
     * 4. Transitions to next player's 'rolling' state
     * @param game - Current game state in 'moving' state with robot player
     * @returns Updated game state with next player ready to roll (or current player if turn incomplete)
     */
    static executeRobotTurn: (game: BackgammonGame) => Promise<BackgammonGame>;
    static activePlayer: (game: BackgammonGame) => BackgammonPlayerActive;
    static inactivePlayer: (game: BackgammonGame) => BackgammonPlayerInactive;
    static getPlayersForColor: (players: BackgammonPlayers, color: BackgammonColor) => [activePlayerForColor: BackgammonPlayerActive, inactivePlayerForColor: BackgammonPlayerInactive];
    /**
     * Restores a game to a previous state
     * This is the new architecture for state restoration - CORE validates but doesn't manage history
     * @param state Complete game state to restore to
     * @returns Validated game state
     */
    static restoreState: (state: BackgammonGame) => BackgammonGame;
    static startMove: (game: BackgammonGameDoubled, movingPlay: BackgammonPlayMoving) => BackgammonGameMoving;
    static canOfferDouble(game: BackgammonGame, player: BackgammonPlayerActive): boolean;
    /**
     * Validates if rolling is allowed in the current game state
     */
    static canRoll(game: BackgammonGame): boolean;
    /**
     * Validates if rolling for start is allowed in the current game state
     */
    static canRollForStart(game: BackgammonGame): boolean;
    /**
     * Validates if the specified player can roll in the current game state
     */
    static canPlayerRoll(game: BackgammonGame, playerId: string): boolean;
    /**
     * Validates if moves can be calculated for the current game state
     */
    static canGetPossibleMoves(game: BackgammonGame): boolean;
    /**
     * Finds a checker in the game board by ID
     * @param game - The game containing the board to search
     * @param checkerId - The ID of the checker to find
     * @returns The checker object or null if not found
     */
    static findChecker(game: BackgammonGame, checkerId: string): BackgammonChecker | null;
    static canAcceptDouble(game: BackgammonGame, player: BackgammonPlayerActive): boolean;
    static acceptDouble(game: BackgammonGame, player: BackgammonPlayerActive): BackgammonGame;
    static canRefuseDouble(game: BackgammonGame, player: BackgammonPlayerActive): boolean;
    static refuseDouble(game: BackgammonGame, player: BackgammonPlayerActive): BackgammonGame;
    /**
     * Async wrapper for confirmTurn that handles robot automation
     * @param game - Game in 'moving' state
     * @returns Promise<BackgammonGame> - Updated game state with robot automation if needed
     */
    static confirmTurnWithRobotAutomation: (game: BackgammonGameMoved) => Promise<BackgammonGame>;
    /**
     * Execute doubling action from rolling state (before rolling dice)
     * Transitions from 'rolling' to 'doubled' state and offers double to opponent
     */
    static double: (game: BackgammonGameRolling) => BackgammonGameDoubled;
}
//# sourceMappingURL=index.d.ts.map