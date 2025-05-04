"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_IMPORT_DEFAULT = void 0;
const defaultClockwiseColor = 'white';
const defaultCounterclockwiseColor = defaultClockwiseColor === 'white' ? 'black' : 'white';
exports.BOARD_IMPORT_DEFAULT = [
    {
        position: {
            clockwise: 1,
            counterclockwise: 24,
        },
        checkers: {
            qty: 2,
            color: defaultCounterclockwiseColor,
        },
    },
    {
        position: {
            clockwise: 12,
            counterclockwise: 13,
        },
        checkers: {
            qty: 5,
            color: defaultCounterclockwiseColor,
        },
    },
    {
        position: {
            clockwise: 17,
            counterclockwise: 8,
        },
        checkers: {
            qty: 3,
            color: defaultCounterclockwiseColor,
        },
    },
    {
        position: {
            clockwise: 19,
            counterclockwise: 6,
        },
        checkers: {
            qty: 5,
            color: defaultCounterclockwiseColor,
        },
    },
    {
        position: {
            clockwise: 24,
            counterclockwise: 1,
        },
        checkers: {
            qty: 2,
            color: defaultClockwiseColor,
        },
    },
    {
        position: {
            clockwise: 13,
            counterclockwise: 12,
        },
        checkers: {
            qty: 5,
            color: defaultClockwiseColor,
        },
    },
    {
        position: {
            clockwise: 8,
            counterclockwise: 17,
        },
        checkers: {
            qty: 3,
            color: defaultClockwiseColor,
        },
    },
    {
        position: {
            clockwise: 6,
            counterclockwise: 19,
        },
        checkers: {
            qty: 5,
            color: defaultClockwiseColor,
        },
    },
];
