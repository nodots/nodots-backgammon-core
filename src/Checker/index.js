"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checker = void 0;
const __1 = require("..");
class Checker {
}
exports.Checker = Checker;
Checker.getCheckers = function getCheckers(board) {
    const checkers = [];
    for (const point of board.BackgammonPoints) {
        for (const checker of point.checkers) {
            checkers.push(checker);
        }
    }
    return checkers;
};
Checker.initialize = function initializeChecker(color, checkercontainerId) {
    return { id: (0, __1.generateId)(), color, checkercontainerId };
};
Checker.buildCheckersForCheckercontainerId = function buildCheckersForCheckercontainerId(checkercontainerId, color, count) {
    const tempCheckers = [];
    for (let i = 0; i < count; i++) {
        const checker = {
            id: (0, __1.generateId)(),
            color,
            checkercontainerId,
        };
        tempCheckers.push(checker);
    }
    return tempCheckers;
};
Checker.getChecker = function getChecker(board, id) {
    const checker = __1.Board.getCheckers(board).find(function findChecker(checker) {
        return checker.id === id;
    });
    if (!checker) {
        throw Error(`No checker found for ${id}`);
    }
    return checker;
};
