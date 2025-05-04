"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_IMPORT_REENTER_TEST = void 0;
// Define colors explicitly to ensure consistency
const clockwiseColor = 'white';
const counterclockwiseColor = 'black';
exports.BOARD_IMPORT_REENTER_TEST = [
    // Clockwise player's checkers
    {
        position: {
            clockwise: 1,
            counterclockwise: 24,
        },
        checkers: {
            qty: 1,
            color: clockwiseColor,
        },
    },
    // Checkers on bar for clockwise player
    {
        position: 'bar',
        direction: 'clockwise',
        checkers: {
            qty: 1,
            color: clockwiseColor,
        },
    },
    // Single opponent checker on entry point for testing hitting
    {
        position: {
            clockwise: 24, // Point 24 for clockwise player's entry
            counterclockwise: 1,
        },
        checkers: {
            qty: 1,
            color: counterclockwiseColor,
        },
    },
];
