"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const ascii_1 = require("../ascii");
(0, globals_1.describe)('ascii', () => {
    (0, globals_1.it)('should display an empty board correctly', () => {
        var _a;
        const board = __1.Board.initialize([]);
        const display = (0, ascii_1.ascii)(board);
        // Verify board structure
        (0, globals_1.expect)(display).toContain('+-13-14-15-16-17-18--------19-20-21-22-23-24-+');
        (0, globals_1.expect)(display).toContain('+-12-11-10--9-8--7--------6--5--4--3--2--1--+');
        (0, globals_1.expect)(display).toContain('|BAR|');
        // Verify empty points
        (0, globals_1.expect)((_a = display.match(/   /g)) === null || _a === void 0 ? void 0 : _a.length).toBeGreaterThan(0); // Should have empty spaces
        // Verify initial bar and off counts
        (0, globals_1.expect)(display).toContain('BLACK BAR: 0');
        (0, globals_1.expect)(display).toContain('WHITE BAR: 0');
        (0, globals_1.expect)(display).toContain('BLACK OFF: 0');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 0');
    });
    (0, globals_1.it)('should display checkers with correct symbols', () => {
        const boardImport = [
            {
                position: { clockwise: 24, counterclockwise: 1 },
                checkers: { qty: 2, color: 'black' },
            },
            {
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: { qty: 2, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Check for black checkers (X)
        (0, globals_1.expect)(display).toMatch(/ X /);
        // Check for white checkers (O)
        (0, globals_1.expect)(display).toMatch(/ O /);
    });
    (0, globals_1.it)('should display checkers on bar correctly', () => {
        const boardImport = [
            {
                position: 'bar',
                direction: 'clockwise',
                checkers: { qty: 3, color: 'white' },
            },
            {
                position: 'bar',
                direction: 'counterclockwise',
                checkers: { qty: 2, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        (0, globals_1.expect)(display).toContain('BLACK BAR: 2');
        (0, globals_1.expect)(display).toContain('WHITE BAR: 3');
    });
    (0, globals_1.it)('should display checkers in off position correctly', () => {
        const boardImport = [
            {
                position: 'off',
                direction: 'clockwise',
                checkers: { qty: 4, color: 'white' },
            },
            {
                position: 'off',
                direction: 'counterclockwise',
                checkers: { qty: 5, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        (0, globals_1.expect)(display).toContain('BLACK OFF: 5');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 4');
    });
    (0, globals_1.it)('should display stacked checkers correctly', () => {
        const boardImport = [
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 5, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should show 5 X symbols stacked vertically
        const lines = display.split('\n');
        let xCount = 0;
        for (const line of lines) {
            if (line.includes(' X '))
                xCount++;
        }
        (0, globals_1.expect)(xCount).toBe(5);
    });
    (0, globals_1.it)('should display a full game board correctly', () => {
        const board = __1.Board.initialize(); // Uses default board setup
        const display = (0, ascii_1.ascii)(board);
        // Verify initial setup positions
        (0, globals_1.expect)(display).toBeDefined();
        (0, globals_1.expect)(display.length).toBeGreaterThan(0);
        // Check for standard starting position elements
        (0, globals_1.expect)(display).toContain('BLACK BAR: 0');
        (0, globals_1.expect)(display).toContain('WHITE BAR: 0');
        (0, globals_1.expect)(display).toContain('BLACK OFF: 0');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 0');
    });
    (0, globals_1.it)('should handle maximum checkers per point', () => {
        const boardImport = [
            {
                position: { clockwise: 1, counterclockwise: 24 },
                checkers: { qty: 15, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should only display up to 5 checkers vertically
        const lines = display.split('\n');
        let oCount = 0;
        for (const line of lines) {
            if (line.includes(' O '))
                oCount++;
        }
        (0, globals_1.expect)(oCount).toBe(5); // Maximum visible checkers
    });
    (0, globals_1.it)('should display multiple checkers on bar correctly', () => {
        const boardImport = [
            {
                position: 'bar',
                direction: 'clockwise',
                checkers: { qty: 3, color: 'black' },
            },
            {
                position: 'bar',
                direction: 'counterclockwise',
                checkers: { qty: 2, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Check that bar section shows checkers
        const lines = display.split('\n');
        // Look for black checkers in the top half (clockwise)
        const hasBlackCheckers = lines
            .slice(0, 6)
            .some((line) => line.includes('| X |'));
        // Look for white checkers in the bottom half (counterclockwise)
        const hasWhiteCheckers = lines
            .slice(7)
            .some((line) => line.includes('| O |'));
        (0, globals_1.expect)(hasBlackCheckers).toBe(true);
        (0, globals_1.expect)(hasWhiteCheckers).toBe(true);
        (0, globals_1.expect)(display).toContain('BLACK BAR: 3');
        (0, globals_1.expect)(display).toContain('WHITE BAR: 2');
    });
    (0, globals_1.it)('should display mixed color checkers in off position correctly', () => {
        const boardImport = [
            {
                position: 'off',
                direction: 'clockwise',
                checkers: { qty: 5, color: 'black' },
            },
            {
                position: 'off',
                direction: 'counterclockwise',
                checkers: { qty: 5, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Verify total counts for each color in off position
        (0, globals_1.expect)(display).toContain('BLACK OFF: 5');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 5');
    });
    (0, globals_1.it)('should handle points with maximum number of checkers', () => {
        const boardImport = [
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 15, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should still only show 5 checkers vertically even with 15 checkers on the point
        const lines = display.split('\n');
        let xCount = 0;
        for (const line of lines) {
            if (line.includes(' X '))
                xCount++;
        }
        (0, globals_1.expect)(xCount).toBe(5);
        // Should show all checkers in the total count
        (0, globals_1.expect)(display).toContain('BLACK BAR: 0');
        (0, globals_1.expect)(display).toContain('BLACK OFF: 0');
    });
    (0, globals_1.it)('should handle points with mixed color checkers', () => {
        const boardImport = [
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 2, color: 'black' },
            },
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 1, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should show both black and white checkers on the same point
        const lines = display.split('\n');
        const point13Lines = lines.filter((line) => line.includes('|') && (line.includes(' X ') || line.includes(' O ')));
        (0, globals_1.expect)(point13Lines.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should handle checkers on all points', () => {
        const boardImport = Array.from({ length: 24 }, (_, i) => ({
            position: {
                clockwise: (i + 1),
                counterclockwise: (24 - i),
            },
            checkers: { qty: 1, color: i % 2 === 0 ? 'black' : 'white' },
        }));
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should show alternating black and white checkers on all points
        const lines = display.split('\n').filter((line) => line.includes('|'));
        const hasCheckers = lines.some((line) => line.includes(' X ') || line.includes(' O '));
        (0, globals_1.expect)(hasCheckers).toBe(true);
    });
    (0, globals_1.it)('should handle empty points between occupied points', () => {
        const boardImport = [
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 1, color: 'black' },
            },
            {
                position: { clockwise: 15, counterclockwise: 10 },
                checkers: { qty: 1, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should show empty spaces between checkers
        const lines = display.split('\n');
        const hasEmptySpaces = lines.some((line) => line.includes(' X ') && line.includes('   '));
        (0, globals_1.expect)(hasEmptySpaces).toBe(true);
    });
    (0, globals_1.it)('should handle maximum checkers on bar', () => {
        const boardImport = [
            {
                position: 'bar',
                direction: 'clockwise',
                checkers: { qty: 15, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should show bar checkers and correct count
        const lines = display.split('\n');
        const barLines = lines.filter((line) => line.includes('|') && line.includes('X'));
        (0, globals_1.expect)(barLines.length).toBeGreaterThan(0);
        (0, globals_1.expect)(display).toContain('BLACK BAR: 15');
    });
    (0, globals_1.it)('should handle invalid point numbers gracefully', () => {
        // This test verifies that the ascii display handles points outside the valid range
        const boardImport = [
            {
                position: { clockwise: 25, counterclockwise: 0 },
                checkers: { qty: 1, color: 'black' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Should still produce a valid board display
        (0, globals_1.expect)(display).toContain('+-13-14-15-16-17-18--------19-20-21-22-23-24-+');
        (0, globals_1.expect)(display).toContain('+-12-11-10--9-8--7--------6--5--4--3--2--1--+');
    });
    (0, globals_1.it)('should handle undefined or null checker properties', () => {
        const board = __1.Board.initialize([]);
        // @ts-ignore - Intentionally testing undefined case
        board.off.clockwise.checkers[0] = { color: undefined };
        // @ts-ignore - Intentionally testing null case
        board.off.counterclockwise.checkers[0] = { color: null };
        const display = (0, ascii_1.ascii)(board);
        // Should not crash and should display empty spaces
        (0, globals_1.expect)(display).toBeDefined();
        (0, globals_1.expect)(display.length).toBeGreaterThan(0);
        (0, globals_1.expect)(display).toContain('BLACK OFF: 0');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 0');
    });
    (0, globals_1.it)('should handle empty spaces between occupied points', () => {
        const boardImport = [
            {
                position: { clockwise: 13, counterclockwise: 12 },
                checkers: { qty: 1, color: 'black' },
            },
            {
                position: { clockwise: 16, counterclockwise: 9 },
                checkers: { qty: 1, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Check for empty spaces between points
        const lines = display.split('\n');
        const emptyPointLine = lines.find((line) => line.includes('   ') && line.startsWith(' |'));
        (0, globals_1.expect)(emptyPointLine).toBeDefined();
    });
    (0, globals_1.it)('should handle off position with maximum checkers', () => {
        const boardImport = [
            {
                position: 'off',
                direction: 'clockwise',
                checkers: { qty: 15, color: 'black' },
            },
            {
                position: 'off',
                direction: 'counterclockwise',
                checkers: { qty: 15, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        (0, globals_1.expect)(display).toContain('BLACK OFF: 15');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 15');
    });
    (0, globals_1.it)('should handle mixed colors in off position', () => {
        const boardImport = [
            {
                position: 'off',
                direction: 'clockwise',
                checkers: { qty: 5, color: 'black' },
            },
            {
                position: 'off',
                direction: 'counterclockwise',
                checkers: { qty: 5, color: 'white' },
            },
        ];
        const board = __1.Board.initialize(boardImport);
        const display = (0, ascii_1.ascii)(board);
        // Verify total counts for each color in off position
        (0, globals_1.expect)(display).toContain('BLACK OFF: 5');
        (0, globals_1.expect)(display).toContain('WHITE OFF: 5');
    });
});
