"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearOff = void 0;
const __1 = require("../../..");
class BearOff {
}
exports.BearOff = BearOff;
BearOff.isA = function isABearOff(board, player) {
    // Get the home board points (1-6 for clockwise, 19-24 for counterclockwise)
    const homeboard = __1.Player.getHomeBoard(board, player);
    const homeboardIds = new Set(homeboard.map((p) => p.id));
    const off = board.off[player.direction];
    // If there are checkers on the bar, cannot bear off
    const barCheckers = board.bar[player.direction].checkers.filter((c) => c.color === player.color).length;
    if (barCheckers > 0) {
        return false;
    }
    // Count checkers in home board
    let homeboardCheckers = 0;
    homeboard.forEach(function countCheckers(point) {
        if (point.checkers.length > 0 &&
            point.checkers[0].color === player.color) {
            homeboardCheckers += point.checkers.length;
        }
    });
    // Count checkers outside home board by checking all points not in home board
    let outsideCheckers = 0;
    board.BackgammonPoints.forEach((point) => {
        if (!homeboardIds.has(point.id) &&
            point.checkers.length > 0 &&
            point.checkers[0].color === player.color) {
            outsideCheckers += point.checkers.length;
        }
    });
    // If there are any checkers outside the home board, cannot bear off
    if (outsideCheckers > 0) {
        return false;
    }
    // Must have some checkers still in play
    if (homeboardCheckers === 0) {
        return false;
    }
    return {
        player,
        moveKind: 'bear-off',
    };
};
BearOff.move = function bearOff(board, move) {
    const player = Object.assign(Object.assign({}, move.player), { stateKind: 'moving' });
    const direction = player.direction;
    const { dieValue } = move;
    // Verify all checkers are in home board
    if (!BearOff.isA(board, player)) {
        throw Error('Cannot bear off when checkers exist outside home board');
    }
    // Get the origin point
    const origin = move.origin;
    if (!origin || origin.checkers.length === 0) {
        throw Error('No checker to bear off');
    }
    if (origin.checkers[0].color !== player.color) {
        throw Error('Invalid checker to bear off');
    }
    // Verify the point is in the home board
    const homeboard = __1.Player.getHomeBoard(board, player);
    if (!homeboard.some((p) => p.id === origin.id)) {
        throw Error('Cannot bear off: selected point is outside the home board');
    }
    // Get the highest point with a checker in the home board
    const highestOccupiedPoint = homeboard
        .filter((p) => p.checkers.length > 0 && p.checkers[0].color === player.color)
        .sort((a, b) => {
        if (a.kind === 'point' && b.kind === 'point') {
            return b.position[direction] - a.position[direction];
        }
        return 0;
    })[0];
    if (!highestOccupiedPoint || highestOccupiedPoint.kind !== 'point') {
        throw Error('Cannot bear off: no valid points found in home board');
    }
    // If using a higher number and there are checkers on higher points, disallow it
    if (origin.kind === 'point' &&
        dieValue >
            (player.direction === 'clockwise'
                ? 24 - origin.position[direction] + 1
                : origin.position[direction]) &&
        homeboard.some((p) => p.position[direction] > origin.position[direction] &&
            p.checkers.some((c) => c.color === player.color))) {
        throw Error('Cannot use higher number when checkers exist on higher points');
    }
    // Move the checker off
    const destination = board.off[direction];
    board = __1.Board.moveChecker(board, origin, destination, direction);
    if (!board)
        throw Error('Failed to move checker off the board');
    return {
        board,
        move: Object.assign(Object.assign({}, move), { player, stateKind: 'completed', moveKind: 'bear-off', origin }),
    };
};
