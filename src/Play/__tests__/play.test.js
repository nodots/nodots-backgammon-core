"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("../..");
const __2 = require("..");
(0, globals_1.describe)('Play', () => {
    (0, globals_1.describe)('initialization', () => {
        (0, globals_1.test)('should initialize with basic board setup', () => {
            const boardImport = [
                {
                    position: { clockwise: 6, counterclockwise: 19 },
                    checkers: { qty: 1, color: 'white' },
                },
                {
                    position: { clockwise: 19, counterclockwise: 6 },
                    checkers: { qty: 1, color: 'black' },
                },
            ];
            const board = __1.Board.initialize(boardImport);
            const inactiveDice = __1.Dice.initialize('white');
            const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(player);
            const play = __2.Play.initialize(board, rolledPlayer);
            (0, globals_1.expect)(play).toBeDefined();
            (0, globals_1.expect)(play.stateKind).toBe('rolled');
            (0, globals_1.expect)(play.moves).toBeDefined();
            (0, globals_1.expect)(play.moves.size).toBeGreaterThan(0);
            // Check that each move has the required moveKind
            for (const move of play.moves) {
                if (move.stateKind === 'ready') {
                    (0, globals_1.expect)(move.moveKind).toBe('point-to-point');
                }
                else if (move.stateKind === 'completed' && 'moveKind' in move) {
                    (0, globals_1.expect)(['point-to-point', 'reenter', 'bear-off', 'no-move'].includes(move.moveKind)).toBeTruthy();
                }
            }
        });
        (0, globals_1.test)('should handle doubles correctly', () => {
            const boardImport = [
                {
                    position: { clockwise: 1, counterclockwise: 24 },
                    checkers: { qty: 2, color: 'white' },
                },
            ];
            const board = __1.Board.initialize(boardImport);
            const inactiveDice = __1.Dice.initialize('white');
            // Mock the dice roll to always return doubles
            jest.spyOn(Math, 'random').mockReturnValue(0); // This will make both dice roll 1
            const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(player);
            const play = __2.Play.initialize(board, rolledPlayer);
            (0, globals_1.expect)(play.moves.size).toBe(4); // Should have 4 moves for doubles
            // Verify all moves are point-to-point
            for (const move of play.moves) {
                if (move.stateKind === 'ready') {
                    (0, globals_1.expect)(move.moveKind).toBe('point-to-point');
                }
            }
            // Cleanup
            jest.spyOn(Math, 'random').mockRestore();
        });
        (0, globals_1.test)('should handle no possible moves', () => {
            // Create a board setup where no moves are possible
            const boardImport = [
                {
                    position: { clockwise: 1, counterclockwise: 24 },
                    checkers: { qty: 1, color: 'white' },
                },
                // Block all possible destinations
                {
                    position: { clockwise: 2, counterclockwise: 23 },
                    checkers: { qty: 2, color: 'black' },
                },
                {
                    position: { clockwise: 3, counterclockwise: 22 },
                    checkers: { qty: 2, color: 'black' },
                },
                {
                    position: { clockwise: 4, counterclockwise: 21 },
                    checkers: { qty: 2, color: 'black' },
                },
                {
                    position: { clockwise: 5, counterclockwise: 20 },
                    checkers: { qty: 2, color: 'black' },
                },
                {
                    position: { clockwise: 6, counterclockwise: 19 },
                    checkers: { qty: 2, color: 'black' },
                },
            ];
            const board = __1.Board.initialize(boardImport);
            const inactiveDice = __1.Dice.initialize('white');
            const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(player);
            const play = __2.Play.initialize(board, rolledPlayer);
            (0, globals_1.expect)(play.moves.size).toBe(1);
            const move = Array.from(play.moves)[0];
            (0, globals_1.expect)(move.stateKind).toBe('completed');
            (0, globals_1.expect)(move.moveKind).toBe('no-move');
        });
    });
    (0, globals_1.describe)('move functionality', () => {
        (0, globals_1.test)('should execute a valid move', () => {
            const boardImport = [
                {
                    position: { clockwise: 1, counterclockwise: 24 },
                    checkers: { qty: 1, color: 'white' },
                },
            ];
            const board = __1.Board.initialize(boardImport);
            const inactiveDice = __1.Dice.initialize('white');
            const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(player);
            const play = __2.Play.initialize(board, rolledPlayer);
            const origin = board.BackgammonPoints.find((p) => p.position.clockwise === 1 && p.position.counterclockwise === 24);
            const result = __2.Play.move(board, play, origin);
            (0, globals_1.expect)(result.play).toBeDefined();
            (0, globals_1.expect)(result.board).toBeDefined();
            (0, globals_1.expect)(result.move.stateKind).toBe('completed');
            (0, globals_1.expect)(result.move.moveKind).toBe('point-to-point');
        });
        (0, globals_1.test)('should throw error for invalid move', () => {
            const boardImport = [
                {
                    position: { clockwise: 1, counterclockwise: 24 },
                    checkers: { qty: 1, color: 'white' },
                },
            ];
            const board = __1.Board.initialize(boardImport);
            const inactiveDice = __1.Dice.initialize('white');
            const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
            const rolledPlayer = __1.Player.roll(player);
            const play = __2.Play.initialize(board, rolledPlayer);
            const invalidOrigin = board.BackgammonPoints.find((p) => p.position.clockwise === 24 && p.position.counterclockwise === 1);
            (0, globals_1.expect)(() => {
                __2.Play.move(board, play, invalidOrigin);
            }).toThrow('Invalid move');
        });
        (0, globals_1.describe)('reenter moves', () => {
            (0, globals_1.test)('should execute a valid reenter move from bar', () => {
                const boardImport = [
                    {
                        position: 'bar',
                        direction: 'clockwise',
                        checkers: {
                            qty: 1,
                            color: 'white',
                        },
                    },
                    {
                        position: { clockwise: 19, counterclockwise: 6 },
                        checkers: { qty: 0, color: 'white' },
                    },
                    {
                        position: { clockwise: 20, counterclockwise: 5 },
                        checkers: { qty: 2, color: 'black' },
                    },
                    {
                        position: { clockwise: 21, counterclockwise: 4 },
                        checkers: { qty: 2, color: 'black' },
                    },
                    {
                        position: { clockwise: 22, counterclockwise: 3 },
                        checkers: { qty: 2, color: 'black' },
                    },
                    {
                        position: { clockwise: 23, counterclockwise: 2 },
                        checkers: { qty: 2, color: 'black' },
                    },
                    {
                        position: { clockwise: 24, counterclockwise: 1 },
                        checkers: { qty: 2, color: 'black' },
                    },
                ];
                const board = __1.Board.buildBoard(boardImport);
                const inactiveDice = __1.Dice.initialize('white', 'inactive', (0, __1.generateId)(), [6, 1]);
                const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
                const rolledPlayer = Object.assign(Object.assign({}, player), { stateKind: 'rolled', dice: Object.assign(Object.assign({}, inactiveDice), { stateKind: 'rolled', currentRoll: [6, 1], total: 7 }) });
                const play = __2.Play.initialize(board, rolledPlayer);
                const origin = board.bar.clockwise;
                const result = __2.Play.move(board, play, origin);
                (0, globals_1.expect)(result.play).toBeDefined();
                (0, globals_1.expect)(result.board).toBeDefined();
                (0, globals_1.expect)(result.move.stateKind).toBe('completed');
                (0, globals_1.expect)(result.move.moveKind).toBe('reenter');
                const destination = result.move
                    .destination;
                (0, globals_1.expect)(destination.position.clockwise).toBe(19);
            });
            (0, globals_1.test)('should prioritize bar moves when checker is on bar', () => {
                const boardImport = [
                    {
                        position: { clockwise: 1, counterclockwise: 24 },
                        checkers: { qty: 1, color: 'white' },
                    },
                    {
                        position: 'bar',
                        direction: 'clockwise',
                        checkers: {
                            qty: 1,
                            color: 'white',
                        },
                    },
                ];
                const board = __1.Board.buildBoard(boardImport);
                const inactiveDice = __1.Dice.initialize('white');
                const player = __1.Player.initialize('white', 'clockwise', inactiveDice, undefined, 'rolling');
                const rolledPlayer = __1.Player.roll(player);
                const play = __2.Play.initialize(board, rolledPlayer);
                // All moves should be reenter moves when there's a checker on the bar
                for (const move of play.moves) {
                    if (move.stateKind === 'ready') {
                        (0, globals_1.expect)(move.moveKind).toBe('reenter');
                    }
                }
            });
        });
    });
});
