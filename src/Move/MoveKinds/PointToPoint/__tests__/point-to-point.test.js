"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const __2 = require("../../../../");
const Board_1 = require("../../../../Board");
const imports_1 = require("../../../../Board/imports");
(0, globals_1.describe)('PointToPoint', () => {
    const setupTestData = (color = 'white', direction = 'clockwise', dieValue = 1) => {
        const diceId = (0, __2.generateId)();
        const board = Board_1.Board.initialize(imports_1.BOARD_IMPORT_DEFAULT);
        const currentRoll = [dieValue, 1];
        let dice = __2.Dice.initialize(color);
        const diceStateKind = 'rolled';
        const rolledDice = Object.assign(Object.assign({}, dice), { id: diceId, stateKind: diceStateKind, currentRoll, total: 2 });
        const player = {
            id: '1',
            color,
            stateKind: 'rolled',
            dice: rolledDice,
            direction,
            pipCount: 167,
        };
        return { board, player, currentRoll };
    };
    (0, globals_1.describe)('isA', () => {
        (0, globals_1.it)('should return false for move with empty origin point', () => {
            const { board, player } = setupTestData();
            const emptyPoint = board.BackgammonPoints[0]; // An empty point
            const destination = board.BackgammonPoints[1];
            const move = {
                id: '1',
                player,
                origin: emptyPoint,
                destination,
                stateKind: 'ready',
            };
            (0, globals_1.expect)(__1.PointToPoint.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should return false for move with wrong color checker', () => {
            const { board, player } = setupTestData('white');
            // Find a point with black checkers
            const originWithBlackChecker = board.BackgammonPoints.find((point) => point.checkers.length > 0 && point.checkers[0].color === 'black');
            const destination = board.BackgammonPoints[1];
            const move = {
                id: '1',
                player,
                origin: originWithBlackChecker,
                destination,
                stateKind: 'ready',
            };
            (0, globals_1.expect)(__1.PointToPoint.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should return false for move without destination', () => {
            const { board, player } = setupTestData();
            const origin = board.BackgammonPoints[5]; // Point with checkers
            const move = {
                id: '1',
                player,
                origin,
                stateKind: 'ready',
            };
            (0, globals_1.expect)(__1.PointToPoint.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should return valid move for correct point-to-point setup', () => {
            const { board, player } = setupTestData();
            const origin = board.BackgammonPoints[5];
            const destination = board.BackgammonPoints[4];
            const move = {
                id: '1',
                player,
                origin,
                destination,
                stateKind: 'ready',
            };
            const result = __1.PointToPoint.isA(move);
            (0, globals_1.expect)(result).toBeTruthy();
            if (result) {
                (0, globals_1.expect)(result.stateKind).toBe('in-progress');
                (0, globals_1.expect)(result.moveKind).toBe('point-to-point');
            }
        });
    });
    (0, globals_1.describe)('getDestination', () => {
        (0, globals_1.it)('should calculate correct destination for clockwise movement', () => {
            const { board, player } = setupTestData('white', 'clockwise', 1);
            const origin = board.BackgammonPoints[5]; // Point 6
            const move = {
                id: '1',
                player,
                origin,
                stateKind: 'ready',
                dieValue: 1,
                moveKind: 'point-to-point',
            };
            const destination = __1.PointToPoint.getDestination(board, move);
            (0, globals_1.expect)(destination.position.clockwise).toBe(origin.position.clockwise - 1);
        });
        (0, globals_1.it)('should calculate correct destination for counterclockwise movement', () => {
            const { board, player } = setupTestData('black', 'counterclockwise', 1);
            const origin = board.BackgammonPoints[18]; // A point with black checkers
            const move = {
                id: '1',
                player,
                origin,
                stateKind: 'ready',
                dieValue: 1,
                moveKind: 'point-to-point',
            };
            const destination = __1.PointToPoint.getDestination(board, move);
            (0, globals_1.expect)(destination.position.counterclockwise).toBe(origin.position.counterclockwise - 1);
        });
    });
    (0, globals_1.describe)('move', () => {
        (0, globals_1.it)('should throw error for invalid board', () => {
            const { player, board } = setupTestData();
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                dieValue: 1,
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
            };
            (0, globals_1.expect)(() => __1.PointToPoint.move(null, move)).toThrow('Invalid board');
        });
        (0, globals_1.it)('should throw error for invalid move', () => {
            const { board } = setupTestData();
            (0, globals_1.expect)(() => __1.PointToPoint.move(board, null)).toThrow('Invalid move');
        });
        (0, globals_1.it)('should perform a valid move', () => {
            const { board, player } = setupTestData();
            const origin = board.BackgammonPoints[5];
            const initialCheckerCount = origin.checkers.length;
            const move = {
                id: '1',
                player,
                origin,
                stateKind: 'ready',
                dieValue: 1,
                moveKind: 'point-to-point',
            };
            const result = __1.PointToPoint.move(board, move);
            (0, globals_1.expect)(result.board).toBeTruthy();
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.BackgammonPoints[5].checkers.length).toBe(initialCheckerCount - 1);
        });
        (0, globals_1.it)('should perform a dry run without modifying the board', () => {
            const { board, player } = setupTestData();
            const origin = board.BackgammonPoints[5];
            const initialCheckerCount = origin.checkers.length;
            const move = {
                id: '1',
                player,
                origin,
                stateKind: 'ready',
                dieValue: 1,
                moveKind: 'point-to-point',
            };
            const result = __1.PointToPoint.move(board, move, true);
            (0, globals_1.expect)(result.board).toBeTruthy();
            (0, globals_1.expect)(result.move.stateKind).toBe('in-progress');
            (0, globals_1.expect)(origin.checkers.length).toBe(initialCheckerCount); // Checkers should not have moved
        });
    });
});
