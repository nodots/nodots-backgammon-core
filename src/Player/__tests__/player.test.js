"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const __2 = require("../..");
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('Player', () => {
    let player;
    let board;
    const color = 'white';
    const direction = 'clockwise';
    (0, globals_1.beforeEach)(() => {
        player = __1.Player.initialize(color, direction);
        board = __2.Board.initialize();
    });
    (0, globals_1.describe)('initialize', () => {
        (0, globals_1.it)('should initialize a player with default state', () => {
            (0, globals_1.expect)(player).toBeDefined();
            (0, globals_1.expect)(player.color).toBe(color);
            (0, globals_1.expect)(player.direction).toBe(direction);
            (0, globals_1.expect)(player.stateKind).toBe('inactive');
            (0, globals_1.expect)(player.pipCount).toBe(167);
            (0, globals_1.expect)(player.dice).toBeDefined();
        });
        (0, globals_1.it)('should initialize a player with specified state', () => {
            const rollingPlayer = __1.Player.initialize(color, direction, undefined, undefined, 'rolling');
            (0, globals_1.expect)(rollingPlayer.stateKind).toBe('rolling');
        });
        (0, globals_1.it)('should initialize a winner player with 0 pip count', () => {
            const winnerPlayer = __1.Player.initialize(color, direction, undefined, undefined, 'winner');
            (0, globals_1.expect)(winnerPlayer.stateKind).toBe('winner');
            (0, globals_1.expect)(winnerPlayer.pipCount).toBe(0);
        });
    });
    (0, globals_1.describe)('roll', () => {
        (0, globals_1.it)('should roll dice and update player state', () => {
            const rollingPlayer = __1.Player.initialize(color, direction, undefined, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(rollingPlayer);
            (0, globals_1.expect)(rolledPlayer.stateKind).toBe('rolled');
            (0, globals_1.expect)(rolledPlayer.dice.currentRoll).toBeDefined();
            (0, globals_1.expect)(rolledPlayer.dice.currentRoll.length).toBe(2);
        });
    });
    (0, globals_1.describe)('getHomeBoard', () => {
        (0, globals_1.it)('should return correct home board points for clockwise direction', () => {
            const homeBoard = __1.Player.getHomeBoard(board, player);
            (0, globals_1.expect)(homeBoard.length).toBe(6);
            homeBoard.forEach((point) => {
                (0, globals_1.expect)(point.position.clockwise).toBeGreaterThanOrEqual(19);
                (0, globals_1.expect)(point.position.clockwise).toBeLessThanOrEqual(24);
            });
        });
        (0, globals_1.it)('should return correct home board points for counterclockwise direction', () => {
            const counterClockwisePlayer = __1.Player.initialize('black', 'counterclockwise');
            const homeBoard = __1.Player.getHomeBoard(board, counterClockwisePlayer);
            (0, globals_1.expect)(homeBoard.length).toBe(6);
            homeBoard.forEach((point) => {
                (0, globals_1.expect)(point.position.counterclockwise).toBeGreaterThanOrEqual(1);
                (0, globals_1.expect)(point.position.counterclockwise).toBeLessThanOrEqual(6);
            });
        });
    });
    (0, globals_1.describe)('getOpponentBoard', () => {
        (0, globals_1.it)('should return correct opponent board points for clockwise direction', () => {
            const opponentBoard = __1.Player.getOpponentBoard(board, player);
            (0, globals_1.expect)(opponentBoard.length).toBe(6);
            (0, globals_1.expect)(opponentBoard[0].position.clockwise).toBe(1);
            (0, globals_1.expect)(opponentBoard[5].position.clockwise).toBe(6);
        });
        (0, globals_1.it)('should return correct opponent board points for counterclockwise direction', () => {
            const counterClockwisePlayer = __1.Player.initialize('black', 'counterclockwise');
            const opponentBoard = __1.Player.getOpponentBoard(board, counterClockwisePlayer);
            (0, globals_1.expect)(opponentBoard.length).toBe(6);
            (0, globals_1.expect)(opponentBoard[0].position.clockwise).toBe(19);
            (0, globals_1.expect)(opponentBoard[5].position.clockwise).toBe(24);
        });
    });
});
