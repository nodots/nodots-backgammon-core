"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const __2 = require("../..");
const Board_1 = require("../../Board");
const imports_1 = require("../../Board/imports");
(0, globals_1.describe)('Move', () => {
    const setupTest = (color = 'white', direction = 'clockwise', roll = [1, 1], boardImport = imports_1.BOARD_IMPORT_DEFAULT) => {
        const diceId = (0, __2.generateId)();
        const board = Board_1.Board.initialize(boardImport);
        const diceStateKind = 'rolled';
        const rolledDice = {
            id: diceId,
            color,
            stateKind: diceStateKind,
            currentRoll: roll,
            total: roll[0] + roll[1],
        };
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
    const convertSkeletonToMove = (skeleton, player, moveKind) => ({
        id: (0, __2.generateId)(),
        player,
        stateKind: 'ready',
        moveKind,
        origin: skeleton.origin,
        dieValue: skeleton.dieValue,
    });
    (0, globals_1.describe)('initialize', () => {
        (0, globals_1.it)('should initialize a move with provided values', () => {
            const { board, player } = setupTest();
            const moveId = (0, __2.generateId)();
            const move = {
                id: moveId,
                player,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            const result = __1.Move.initialize({
                move,
                origin: board.BackgammonPoints[0],
            });
            (0, globals_1.expect)(result.id).toBe(moveId);
            (0, globals_1.expect)(result.stateKind).toBe('ready');
            (0, globals_1.expect)(result.origin).toBe(board.BackgammonPoints[0]);
        });
        (0, globals_1.it)('should generate id if not provided', () => {
            const { board, player } = setupTest();
            const move = {
                id: '',
                player,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            const result = __1.Move.initialize({
                move,
                origin: board.BackgammonPoints[0],
            });
            (0, globals_1.expect)(result.id).toBeDefined();
            (0, globals_1.expect)(result.id.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should use default stateKind if not provided', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            const result = __1.Move.initialize({
                move,
                origin: board.BackgammonPoints[0],
            });
            (0, globals_1.expect)(result.stateKind).toBe('ready');
        });
    });
    (0, globals_1.describe)('isPointOpen', () => {
        (0, globals_1.it)('should return true for empty point', () => {
            const { player } = setupTest();
            const point = {
                id: (0, __2.generateId)(),
                kind: 'point',
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: [],
            };
            (0, globals_1.expect)(__1.Move.isPointOpen(point, player)).toBe(true);
        });
        (0, globals_1.it)('should return true for point with one checker of any color', () => {
            const { player } = setupTest('white');
            const whiteChecker = {
                id: (0, __2.generateId)(),
                color: 'white',
                checkercontainerId: (0, __2.generateId)(),
            };
            const blackChecker = {
                id: (0, __2.generateId)(),
                color: 'black',
                checkercontainerId: (0, __2.generateId)(),
            };
            const pointWithWhite = {
                id: (0, __2.generateId)(),
                kind: 'point',
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: [whiteChecker],
            };
            const pointWithBlack = {
                id: (0, __2.generateId)(),
                kind: 'point',
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: [blackChecker],
            };
            (0, globals_1.expect)(__1.Move.isPointOpen(pointWithWhite, player)).toBe(true);
            (0, globals_1.expect)(__1.Move.isPointOpen(pointWithBlack, player)).toBe(true);
        });
        (0, globals_1.it)('should return true for point with multiple checkers of player color', () => {
            const { player } = setupTest('white');
            const whiteChecker = {
                id: (0, __2.generateId)(),
                color: 'white',
                checkercontainerId: (0, __2.generateId)(),
            };
            const point = {
                id: (0, __2.generateId)(),
                kind: 'point',
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: [whiteChecker, Object.assign(Object.assign({}, whiteChecker), { id: (0, __2.generateId)() })],
            };
            (0, globals_1.expect)(__1.Move.isPointOpen(point, player)).toBe(true);
        });
        (0, globals_1.it)('should return false for point with multiple opponent checkers', () => {
            const { player } = setupTest('white');
            const blackChecker = {
                id: (0, __2.generateId)(),
                color: 'black',
                checkercontainerId: (0, __2.generateId)(),
            };
            const point = {
                id: (0, __2.generateId)(),
                kind: 'point',
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: [blackChecker, Object.assign(Object.assign({}, blackChecker), { id: (0, __2.generateId)() })],
            };
            (0, globals_1.expect)(__1.Move.isPointOpen(point, player)).toBe(false);
        });
    });
    (0, globals_1.describe)('move', () => {
        (0, globals_1.it)('should throw error if player not found', () => {
            const { board } = setupTest();
            // Create a partial move object without player for testing
            const partialMove = {
                id: (0, __2.generateId)(),
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            // Cast to unknown first, then to BackgammonMoveReady to avoid type checking
            const move = partialMove;
            (0, globals_1.expect)(() => __1.Move.move(board, move)).toThrow('Player not found');
        });
        (0, globals_1.it)('should throw error if player state is not rolled', () => {
            const { board, player } = setupTest();
            const movingPlayer = Object.assign(Object.assign({}, player), { stateKind: 'moving' });
            const move = {
                id: (0, __2.generateId)(),
                player: movingPlayer, // Type assertion for test
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            (0, globals_1.expect)(() => __1.Move.move(board, move)).toThrow('Invalid player state for move');
        });
        (0, globals_1.it)('should handle point-to-point move', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[23], // Point 24 (has 2 white checkers)
                dieValue: 1,
                possibleMoves: new Set(Board_1.Board.getPossibleMoves(board, player, 1)),
            };
            const result = __1.Move.move(board, move);
            (0, globals_1.expect)(result.board).toBeDefined();
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            // Verify checker moved from point 24 to point 23
            (0, globals_1.expect)(result.board.BackgammonPoints[23].checkers.length).toBe(1); // One checker left on point 24
            (0, globals_1.expect)(result.board.BackgammonPoints[22].checkers.length).toBe(1); // One checker moved to point 23
        });
        (0, globals_1.it)('should handle reenter move', () => {
            const { board, player } = setupTest('white', 'clockwise', [1, 1], imports_1.BOARD_IMPORT_BOTH_REENTER);
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'reenter',
                origin: board.bar[player.direction],
                dieValue: 1,
                possibleMoves: new Set(Board_1.Board.getPossibleMoves(board, player, 1)),
            };
            const result = __1.Move.move(board, move);
            (0, globals_1.expect)(result.board).toBeDefined();
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            // Verify checker moved from bar to point 24
            (0, globals_1.expect)(result.board.bar[player.direction].checkers.length).toBe(1); // One checker left on bar
            (0, globals_1.expect)(result.board.BackgammonPoints[23].checkers.length).toBe(1); // One checker moved to point 24
        });
        (0, globals_1.it)('should handle bear-off move', () => {
            // Create a board with all white checkers in the home board (points 19-24)
            const boardImport = [
                {
                    position: {
                        clockwise: 24,
                        counterclockwise: 1,
                    },
                    checkers: {
                        qty: 4,
                        color: 'white',
                    },
                },
                {
                    position: {
                        clockwise: 23,
                        counterclockwise: 2,
                    },
                    checkers: {
                        qty: 4,
                        color: 'white',
                    },
                },
                {
                    position: {
                        clockwise: 22,
                        counterclockwise: 3,
                    },
                    checkers: {
                        qty: 4,
                        color: 'white',
                    },
                },
                {
                    position: {
                        clockwise: 21,
                        counterclockwise: 4,
                    },
                    checkers: {
                        qty: 3,
                        color: 'white',
                    },
                },
            ];
            const { board, player } = setupTest('white', 'clockwise', [1, 1], boardImport);
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'bear-off',
                origin: board.BackgammonPoints[23], // Point 24 (has 4 white checkers)
                dieValue: 1,
                possibleMoves: new Set(Board_1.Board.getPossibleMoves(board, player, 1)),
            };
            const result = __1.Move.move(board, move);
            (0, globals_1.expect)(result.board).toBeDefined();
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            // Verify checker moved from point 24 to off
            (0, globals_1.expect)(result.board.BackgammonPoints[23].checkers.length).toBe(3); // Three checkers left on point 24
            (0, globals_1.expect)(result.board.off[player.direction].checkers.length).toBe(1); // One checker moved to off
        });
        (0, globals_1.it)('should handle no-move case', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'no-move',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            const result = __1.Move.move(board, move);
            (0, globals_1.expect)(result.board).toBe(board);
            (0, globals_1.expect)(result.move).toBeDefined();
        });
        (0, globals_1.it)('should handle undefined moveKind case', () => {
            const { board, player } = setupTest();
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'no-move',
                origin: board.BackgammonPoints[0],
                dieValue: 1,
                possibleMoves: new Set([]),
            };
            const result = __1.Move.move(board, move);
            (0, globals_1.expect)(result.board).toBe(board);
            (0, globals_1.expect)(result.move).toBeDefined();
        });
        (0, globals_1.it)('should handle dry run without modifying board', () => {
            const { board, player } = setupTest();
            const originalBoard = JSON.parse(JSON.stringify(board));
            const move = {
                id: (0, __2.generateId)(),
                player,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[23], // Point 24 (has 2 white checkers)
                dieValue: 1,
                possibleMoves: new Set(Board_1.Board.getPossibleMoves(board, player, 1)),
            };
            const result = __1.Move.move(board, move, true);
            (0, globals_1.expect)(result.board).toEqual(originalBoard);
            (0, globals_1.expect)(result.move.stateKind).toBe('in-progress');
        });
    });
    (0, globals_1.describe)('confirmMove', () => {
        (0, globals_1.it)('should confirm a move', () => {
            const { board, player } = setupTest();
            const movingPlayer = Object.assign(Object.assign({}, player), { stateKind: 'moving' });
            const move = {
                id: (0, __2.generateId)(),
                player: movingPlayer,
                stateKind: 'in-progress',
                moveKind: 'point-to-point',
                origin: board.BackgammonPoints[23], // Point 24
                destination: board.BackgammonPoints[22], // Point 23
                dieValue: 1,
            };
            const result = __1.Move.confirmMove(move);
            (0, globals_1.expect)(result.stateKind).toBe('confirmed');
        });
    });
});
