"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const __2 = require("../../../../");
const Board_1 = require("../../../../Board");
const imports_1 = require("../../../../Board/imports");
(0, globals_1.describe)('Reenter', () => {
    const setupTest = (color = 'white', direction = 'clockwise', roll = [1, 1]) => {
        const diceId = (0, __2.generateId)();
        const board = Board_1.Board.initialize(imports_1.BOARD_IMPORT_REENTER_TEST);
        let dice = __2.Dice.initialize(color);
        const rolledDice = Object.assign(Object.assign({}, dice), { id: diceId, stateKind: 'rolled', currentRoll: roll, total: roll[0] + roll[1] });
        const player = {
            id: (0, __2.generateId)(),
            color,
            stateKind: 'rolled',
            dice: rolledDice,
            direction,
            pipCount: 167,
        };
        return { board, player, rolledDice };
    };
    (0, globals_1.describe)('isA', () => {
        (0, globals_1.it)('should identify valid reenter moves', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.isA(move);
            (0, globals_1.expect)(result).toBeTruthy();
            if (result) {
                (0, globals_1.expect)(result.stateKind).toBe('in-progress');
                (0, globals_1.expect)(result.moveKind).toBe('reenter');
            }
        });
        (0, globals_1.it)('should reject moves from non-bar origins', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
            };
            (0, globals_1.expect)(__1.Reenter.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should reject moves with empty bar', () => {
            const { board, player } = setupTest();
            board.bar[player.direction].checkers = [];
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            (0, globals_1.expect)(__1.Reenter.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should reject moves with opponent checkers on bar', () => {
            const { board, player } = setupTest();
            board.bar[player.direction].checkers[0].color =
                player.color === 'white' ? 'black' : 'white';
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            (0, globals_1.expect)(__1.Reenter.isA(move)).toBe(false);
        });
        (0, globals_1.it)('should hit opponent checker when reentering', () => {
            // Use white for clockwise player to match board import
            const { board, player } = setupTest('white', 'clockwise', [1, 2]);
            // Ensure there's an opponent checker on point 24
            board.BackgammonPoints[23].checkers = [
                {
                    id: (0, __2.generateId)(),
                    color: 'black',
                    checkercontainerId: board.BackgammonPoints[23].id,
                },
            ];
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(0);
            (0, globals_1.expect)(result.board.bar['counterclockwise'].checkers.length).toBe(1);
            if (result.move.moveKind !== 'no-move' &&
                result.move.stateKind === 'completed') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1);
                (0, globals_1.expect)(result.move.destination.checkers[0].color).toBe(player.color);
            }
        });
    });
    (0, globals_1.describe)('getDestination', () => {
        (0, globals_1.it)('should find valid destination for reenter', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const destination = __1.Reenter.getDestination(board, move);
            (0, globals_1.expect)(destination).toBeDefined();
            (0, globals_1.expect)(destination.position[player.direction]).toBe(24); // For clockwise, should be point 24
        });
        (0, globals_1.it)('should throw error when no valid destination exists', () => {
            const { board, player } = setupTest();
            // Block all opponent's home board points
            const opponentBoard = player.direction === 'clockwise'
                ? board.BackgammonPoints.slice(18, 24) // Points 19-24
                : board.BackgammonPoints.slice(0, 6); // Points 1-6
            opponentBoard.forEach((point) => {
                const checker = {
                    id: (0, __2.generateId)(),
                    color: player.color === 'white' ? 'black' : 'white',
                    checkercontainerId: point.id,
                };
                point.checkers = [checker, Object.assign(Object.assign({}, checker), { id: (0, __2.generateId)() })];
            });
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            (0, globals_1.expect)(() => __1.Reenter.getDestination(board, move)).toThrow('Invalid reenter move');
        });
    });
    (0, globals_1.describe)('move', () => {
        (0, globals_1.it)('should successfully reenter a checker', () => {
            const { board, player } = setupTest('white', 'clockwise', [1, 2]);
            // Clear point 24 for reentry
            board.BackgammonPoints[23].checkers = [];
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(0);
            // Type guard to ensure we have a completed move with destination
            if (result.move.moveKind !== 'no-move' &&
                result.move.stateKind === 'completed') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1);
                (0, globals_1.expect)(result.move.destination.checkers[0].color).toBe(player.color);
            }
        });
        (0, globals_1.it)('should handle dry run without modifying board', () => {
            const { board, player } = setupTest();
            const originalBoard = JSON.parse(JSON.stringify(board));
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.move(board, move, true);
            (0, globals_1.expect)(result.board).toEqual(originalBoard);
            (0, globals_1.expect)(result.move.stateKind).toBe('ready');
        });
        (0, globals_1.it)('should throw error for invalid board', () => {
            const { player, board } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            (0, globals_1.expect)(() => __1.Reenter.move(null, move)).toThrow('Invalid board');
        });
        (0, globals_1.it)('should throw error for invalid move', () => {
            const { board } = setupTest();
            (0, globals_1.expect)(() => __1.Reenter.move(board, null)).toThrow('Invalid move');
        });
        (0, globals_1.it)('should throw error for invalid reenter move', () => {
            const { board, player } = setupTest();
            // Block all opponent's home board points
            const opponentBoard = player.direction === 'clockwise'
                ? board.BackgammonPoints.slice(18, 24) // Points 19-24
                : board.BackgammonPoints.slice(0, 6); // Points 1-6
            opponentBoard.forEach((point) => {
                const checker = {
                    id: (0, __2.generateId)(),
                    color: player.color === 'white' ? 'black' : 'white',
                    checkercontainerId: point.id,
                };
                point.checkers = [checker, Object.assign(Object.assign({}, checker), { id: (0, __2.generateId)() })];
            });
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            (0, globals_1.expect)(() => __1.Reenter.move(board, move)).toThrow('Invalid reenter move');
        });
        (0, globals_1.it)('should prioritize bar moves over regular moves', () => {
            const { board, player } = setupTest('white', 'clockwise', [1, 2]);
            // Add a regular checker that could move
            board.BackgammonPoints[0].checkers.push({
                id: (0, __2.generateId)(),
                color: player.color,
                checkercontainerId: board.BackgammonPoints[0].id,
            });
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            // Attempt to move the regular checker instead of the bar checker
            const invalidMove = Object.assign(Object.assign({}, move), { origin: board.BackgammonPoints[0] });
            (0, globals_1.expect)(__1.Reenter.isA(invalidMove)).toBe(false); // Should reject non-bar move when checkers are on bar
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(0);
            // Type guard to ensure we have a completed move with destination
            if (result.move.moveKind !== 'no-move' &&
                result.move.stateKind === 'completed') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1);
            }
        });
        (0, globals_1.it)('should handle multiple checkers needing reentry', () => {
            const { board, player } = setupTest('white', 'clockwise', [1, 2]);
            // Add another checker to the bar
            board.bar[player.direction].checkers.push({
                id: (0, __2.generateId)(),
                color: player.color,
                checkercontainerId: board.bar[player.direction].id,
            });
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(1); // One checker should remain on bar
            // Type guard to ensure we have a completed move with destination
            if (result.move.moveKind !== 'no-move' &&
                result.move.stateKind === 'completed') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1); // One checker should be on point 24
            }
        });
        (0, globals_1.it)('should handle multiple checkers on bar', () => {
            const { board, player } = setupTest();
            // Add another checker to the bar
            const checker = {
                id: (0, __2.generateId)(),
                color: player.color,
                checkercontainerId: board.bar[player.direction].id,
            };
            board.bar[player.direction].checkers.push(checker);
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(1); // One checker should remain on bar
            // Type guard to ensure we have a completed move with destination
            if (result.move.moveKind !== 'no-move' &&
                result.move.stateKind === 'completed') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1); // One checker should be on destination point
                (0, globals_1.expect)(result.move.destination.checkers[0].color).toBe(player.color);
            }
        });
    });
    (0, globals_1.describe)('dice combinations', () => {
        (0, globals_1.it)('should handle all possible die values for reentry', () => {
            // Test each die value 1-6 and verify correct reentry point
            const dieValueToPoint = {
                6: 19, // Die 6 -> Point 19
                5: 20, // Die 5 -> Point 20
                4: 21, // Die 4 -> Point 21
                3: 22, // Die 3 -> Point 22
                2: 23, // Die 2 -> Point 23
                1: 24, // Die 1 -> Point 24
            };
            Object.entries(dieValueToPoint).forEach(([dieValueStr, pointNumber]) => {
                const dieValue = Number(dieValueStr);
                const { board, player } = setupTest('white', 'clockwise', [dieValue, 1]);
                // Clear any checkers from the destination point
                const destPointIndex = pointNumber - 1;
                board.BackgammonPoints[destPointIndex].checkers = [];
                const move = {
                    id: (0, __2.generateId)(),
                    player,
                    stateKind: 'ready',
                    moveKind: 'reenter',
                    origin: board.bar[player.direction],
                    dieValue,
                };
                const result = __1.Reenter.move(board, move);
                (0, globals_1.expect)(result.move.stateKind).toBe('completed');
                if (result.move.stateKind === 'completed' &&
                    result.move.moveKind !== 'no-move') {
                    const position = result.move.destination.position;
                    if (position !== 'off') {
                        (0, globals_1.expect)(position.clockwise).toBe(pointNumber);
                    }
                }
            });
        });
        (0, globals_1.it)('should handle doubles for reentry', () => {
            const { board, player } = setupTest('white', 'clockwise', [1, 1]);
            // Add multiple checkers to the bar
            for (let i = 0; i < 3; i++) {
                board.bar[player.direction].checkers.push({
                    id: (0, __2.generateId)(),
                    color: player.color,
                    checkercontainerId: board.bar[player.direction].id,
                });
            }
            // Clear point 24 for reentry
            board.BackgammonPoints[23].checkers = [];
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
            };
            // Should be able to reenter multiple checkers using doubles
            const result = __1.Reenter.move(board, move);
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(3); // Should still have remaining checkers
            if (result.move.stateKind === 'completed' &&
                result.move.moveKind !== 'no-move') {
                (0, globals_1.expect)(result.move.destination.checkers.length).toBe(1); // One checker should be on point 24
            }
        });
    });
});
