"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Move = void 0;
const __1 = require("..");
const BearOff_1 = require("./MoveKinds/BearOff");
const PointToPoint_1 = require("./MoveKinds/PointToPoint");
const Reenter_1 = require("./MoveKinds/Reenter");
class Move {
    constructor() {
        this.moveKind = undefined;
        this.origin = undefined;
        this.destination = undefined;
    }
}
exports.Move = Move;
Move.initialize = function initializeMove({ move, origin, }) {
    const id = move.id ? move.id : (0, __1.generateId)();
    const stateKind = move.stateKind ? move.stateKind : 'ready';
    return Object.assign(Object.assign({}, move), { id,
        stateKind,
        origin });
};
// Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
Move.isPointOpen = function isPointOpen(point, player) {
    if (point.checkers.length < 2)
        return true;
    if (point.checkers.length >= 2 && point.checkers[0].color === player.color)
        return true;
    if (point.checkers.length > 1 && point.checkers[0].color !== player.color)
        return false;
    if (point.checkers.length === 1 && point.checkers[0].color !== player.color)
        return true;
    return false;
};
Move.move = function move(board, move, isDryRun = false) {
    const { moveKind } = move;
    const { player } = move;
    if (!player)
        throw Error('Player not found');
    if (player.stateKind !== 'rolled')
        throw Error('Invalid player state for move');
    switch (moveKind) {
        case 'point-to-point':
            return PointToPoint_1.PointToPoint.move(board, move, isDryRun);
        case 'reenter':
            return Reenter_1.Reenter.move(board, move, isDryRun);
        case 'bear-off':
            return BearOff_1.BearOff.move(board, move);
        case 'no-move':
        case undefined:
            return {
                board,
                move: Object.assign(Object.assign({}, move), { moveKind: 'no-move', stateKind: 'completed', origin: undefined, destination: undefined, isHit: false }),
            };
    }
};
Move.confirmMove = function confirmMove(move) {
    var _a;
    if (move.moveKind === 'no-move') {
        return Object.assign(Object.assign({}, move), { stateKind: 'confirmed', origin: undefined, destination: undefined, isHit: false });
    }
    return Object.assign(Object.assign({}, move), { stateKind: 'confirmed', isHit: move.moveKind === 'point-to-point' &&
            ((_a = move.destination) === null || _a === void 0 ? void 0 : _a.checkers.length) === 1 &&
            move.destination.checkers[0].color !== move.player.color });
};
