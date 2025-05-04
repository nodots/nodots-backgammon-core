"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const __2 = require("../../../../");
const Board_1 = require("../../../../Board");
(0, globals_1.describe)('BearOff', () => {
    const setupTestBoard = (boardImport) => {
        const diceId = (0, __2.generateId)();
        const board = Board_1.Board.initialize(boardImport);
        const color = 'white'; // Use fixed color for predictable tests
        const direction = 'clockwise'; // Use fixed direction for predictable tests
        const currentRoll = [6, 4];
        let dice = __2.Dice.initialize(color);
        const diceStateKind = 'rolled';
        const rolledDice = Object.assign(Object.assign({}, dice), { id: diceId, stateKind: diceStateKind, currentRoll, total: 2 });
        const player = {
            id: '1',
            color,
            stateKind: 'rolled',
            dice: rolledDice,
            direction,
            pipCount: 15, // All checkers in home board
        };
        return { board, player, currentRoll };
    };
    (0, globals_1.describe)('Valid Bear Off Scenarios', () => {
        (0, globals_1.it)('should successfully bear off a checker with exact dice value', () => {
            var _a;
            // Setup board with all checkers in home board (points 19-24 for clockwise)
            const boardImport = [
                {
                    position: { clockwise: 24, counterclockwise: 1 },
                    checkers: { qty: 1, color: 'white' },
                },
                // Rest of checkers on point 19 (lowest point in home board)
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 14, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 24);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 6,
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 6),
            };
            const moveResult = __1.BearOff.move(board, move);
            (0, globals_1.expect)(moveResult.move.stateKind).toBe('completed');
            (0, globals_1.expect)((_a = moveResult.board.BackgammonPoints.find((p) => p.position[player.direction] === 24)) === null || _a === void 0 ? void 0 : _a.checkers.length).toBe(0);
            // Check that checker was moved to the off position
            (0, globals_1.expect)(moveResult.board.off[player.direction].checkers.length).toBe(1);
        });
        (0, globals_1.it)('should successfully bear off a checker with higher dice value when no checkers on higher points', () => {
            var _a;
            // Setup board with all checkers in home board, one on point 22, rest on point 19
            const boardImport = [
                {
                    position: { clockwise: 22, counterclockwise: 3 },
                    checkers: { qty: 1, color: 'white' },
                },
                // Rest of checkers on point 19 (no checkers on higher points)
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 14, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 22);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 6, // Using higher dice value
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 6),
            };
            const moveResult = __1.BearOff.move(board, move);
            (0, globals_1.expect)(moveResult.move.stateKind).toBe('completed');
            (0, globals_1.expect)((_a = moveResult.board.BackgammonPoints.find((p) => p.position[player.direction] === 22)) === null || _a === void 0 ? void 0 : _a.checkers.length).toBe(0);
            // Check that checker was moved to the off position
            (0, globals_1.expect)(moveResult.board.off[player.direction].checkers.length).toBe(1);
        });
    });
    (0, globals_1.describe)('Invalid Bear Off Scenarios', () => {
        (0, globals_1.it)('should not allow bearing off when checkers exist outside home board', () => {
            // Setup board with a checker outside home board (point 18)
            const boardImport = [
                {
                    position: { clockwise: 22, counterclockwise: 3 },
                    checkers: { qty: 1, color: 'white' },
                },
                {
                    position: { clockwise: 18, counterclockwise: 7 }, // Outside home board
                    checkers: { qty: 1, color: 'white' },
                },
                // Rest of checkers on point 19
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 13, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 22);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 4,
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 4),
            };
            (0, globals_1.expect)(() => __1.BearOff.move(board, move)).toThrow('Cannot bear off when checkers exist outside home board');
        });
        (0, globals_1.it)('should not allow bearing off with higher dice when checkers exist on higher points', () => {
            // Setup board with checkers on points 22 and 24
            const boardImport = [
                {
                    position: { clockwise: 22, counterclockwise: 3 },
                    checkers: { qty: 1, color: 'white' },
                },
                {
                    position: { clockwise: 24, counterclockwise: 1 }, // Higher point
                    checkers: { qty: 1, color: 'white' },
                },
                // Rest of checkers on point 19
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 13, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 22);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 6, // Trying to use higher dice value
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 6),
            };
            (0, globals_1.expect)(() => __1.BearOff.move(board, move)).toThrow('Cannot use higher number when checkers exist on higher points');
        });
        (0, globals_1.it)('should not allow bearing off from empty point', () => {
            // Setup board with all checkers on point 19
            const boardImport = [
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 15, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 22);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 4,
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 4),
            };
            (0, globals_1.expect)(() => __1.BearOff.move(board, move)).toThrow('No checker to bear off');
        });
    });
    (0, globals_1.describe)('Multiple Checkers Scenarios', () => {
        (0, globals_1.it)('should bear off one checker at a time from a point with multiple checkers', () => {
            var _a;
            // Setup board with multiple checkers on point 24
            const boardImport = [
                {
                    position: { clockwise: 24, counterclockwise: 1 },
                    checkers: { qty: 2, color: 'white' },
                },
                // Rest of checkers on point 19
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 13, color: 'white' },
                },
            ];
            const { board, player } = setupTestBoard(boardImport);
            const origin = board.BackgammonPoints.find((p) => p.position[player.direction] === 24);
            const move = {
                id: '1',
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin,
                dieValue: 6,
                possibleMoves: Board_1.Board.getPossibleMoves(board, player, 6),
            };
            const moveResult = __1.BearOff.move(board, move);
            (0, globals_1.expect)(moveResult.move.stateKind).toBe('completed');
            (0, globals_1.expect)((_a = moveResult.board.BackgammonPoints.find((p) => p.position[player.direction] === 24)) === null || _a === void 0 ? void 0 : _a.checkers.length).toBe(1); // One checker should remain
            // Check that one checker was moved to the off position
            (0, globals_1.expect)(moveResult.board.off[player.direction].checkers.length).toBe(1);
        });
    });
});
