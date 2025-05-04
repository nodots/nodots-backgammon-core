"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const Board_1 = require("../../Board");
const __2 = require("../../");
const imports_1 = require("../../Board/imports");
(0, globals_1.describe)('BackgammonChecker', () => {
    let board;
    let color;
    let checker;
    let checkers;
    let randomChecker;
    (0, globals_1.beforeEach)(() => {
        board = Board_1.Board.initialize(imports_1.BOARD_IMPORT_DEFAULT);
        color = (0, __2.randomBackgammonColor)();
        checker = __1.Checker.initialize(color, 'checkercontainer1');
        checkers = __1.Checker.getCheckers(board);
        randomChecker = checkers[Math.floor(Math.random() * checkers.length)];
    });
    (0, globals_1.it)('should create a checker with the correct color', () => {
        (0, globals_1.expect)(checker.color).toBe(color);
    });
    (0, globals_1.it)('should be part of a checker container', () => {
        (0, globals_1.expect)(checker.checkercontainerId).toBe('checkercontainer1');
    });
    (0, globals_1.it)('should be able to build checkers for a checker container', () => {
        checkers = __1.Checker.buildCheckersForCheckercontainerId('checkercontainer1', color, 2);
        (0, globals_1.expect)(checkers.length).toBe(2);
        (0, globals_1.expect)(checkers[0].color).toBe(color);
        (0, globals_1.expect)(checkers[0].checkercontainerId).toBe('checkercontainer1');
    });
    (0, globals_1.it)('should get all checkers', () => {
        (0, globals_1.expect)(checkers.length).toBe(30);
    });
    (0, globals_1.it)('should get a checker with a valid id', () => {
        const foundChecker = __1.Checker.getChecker(board, randomChecker.id);
        (0, globals_1.expect)(foundChecker).toEqual(randomChecker);
    });
    (0, globals_1.it)('should throw an error when getting a checker with an invalid id', () => {
        (0, globals_1.expect)(() => __1.Checker.getChecker(board, 'invalidId')).toThrowError();
    });
});
