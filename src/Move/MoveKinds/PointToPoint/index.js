"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointToPoint = void 0;
const Board_1 = require("../../../Board");
class PointToPoint {
}
exports.PointToPoint = PointToPoint;
PointToPoint.isA = function isAPointToPoint(move) {
    const { player, origin } = move;
    if (origin.checkers.length === 0)
        return false;
    if (origin.checkers[0].color !== player.color)
        return false;
    return Object.assign(Object.assign({}, move), { stateKind: 'in-progress', moveKind: 'point-to-point' });
};
PointToPoint.getDestination = (board, move) => {
    const { player, dieValue } = move;
    const direction = player.direction;
    const originPoint = move.origin;
    const originPosition = originPoint.position[direction];
    const destinationPosition = originPosition - dieValue;
    const destination = board.BackgammonPoints.find((point) => point.position[direction] === destinationPosition);
    return destination;
};
PointToPoint.move = function pointToPoint(board, move, isDryRun = false) {
    if (!board)
        throw Error('Invalid board');
    if (!move)
        throw Error('Invalid move');
    console.log('PointToPoint.move board', Board_1.Board.displayAsciiBoard(board));
    Board_1.Board.displayAsciiBoard(board);
    const destination = PointToPoint.getDestination(board, move);
    const moveWithDestination = Object.assign(Object.assign({}, move), { moveKind: 'point-to-point' });
    const pointToPoint = PointToPoint.isA(moveWithDestination);
    if (!pointToPoint)
        throw Error('Invalid point-to-point move');
    const originPoint = move.origin;
    const player = move.player;
    if (!isDryRun) {
        board = Board_1.Board.moveChecker(board, originPoint, destination, player.direction);
        if (!board)
            throw Error('Invalid board after move');
        const movedPlayer = Object.assign(Object.assign({}, player), { stateKind: 'moving' });
        const completedMove = Object.assign(Object.assign({}, moveWithDestination), { player: movedPlayer, stateKind: 'completed', destination, isHit: destination.checkers.length > 0 &&
                destination.checkers[0].color !== player.color });
        return { board, move: completedMove };
    }
    else {
        const dryRunMove = Object.assign(Object.assign({}, moveWithDestination), { stateKind: 'in-progress' });
        return { board, move: dryRunMove };
    }
};
