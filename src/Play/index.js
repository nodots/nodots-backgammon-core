"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Play = void 0;
const __1 = require("..");
class Play {
    constructor() {
        this.id = (0, __1.generateId)();
        this.moves = new Set();
    }
}
exports.Play = Play;
Play.move = function move(board, play, origin) {
    const movesArray = Array.from(play.moves);
    let move = movesArray.find((m) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin));
    if (!move)
        throw new Error('No move ready');
    const possibleMoves = __1.Board.getPossibleMoves(board, move.player, move.dieValue);
    const destinationMove = possibleMoves.find((m) => m.origin === origin);
    if (!destinationMove)
        throw new Error('Invalid move');
    board = __1.Board.moveChecker(board, origin, destinationMove.destination, move.player.direction);
    const updatedMoves = new Set(movesArray.map((m) => {
        if ((m.stateKind === 'ready' || m.stateKind === 'in-progress') &&
            !('origin' in m)) {
            const moveKind = origin.kind === 'bar' ? 'reenter' : 'point-to-point';
            const inProgressMove = {
                id: move.id,
                player: move.player,
                dieValue: move.dieValue,
                stateKind: 'in-progress',
                moveKind,
                origin,
                destination: destinationMove.destination,
            };
            return inProgressMove;
        }
        return m;
    }));
    play = Object.assign(Object.assign({}, play), { moves: updatedMoves, board });
    const completedMove = {
        id: move.id,
        player: move.player,
        dieValue: move.dieValue,
        stateKind: 'completed',
        moveKind: origin.kind === 'bar' ? 'reenter' : 'point-to-point',
        origin,
        destination: destinationMove.destination,
        isHit: false,
    };
    return {
        play,
        board,
        move: completedMove,
    };
};
Play.initialize = function initialize(board, player) {
    const moves = new Set();
    const roll = player.dice.currentRoll;
    const possibleMoves0 = __1.Board.getPossibleMoves(board, player, roll[0]);
    const possibleMoves1 = __1.Board.getPossibleMoves(board, player, roll[1]);
    if (possibleMoves0.length > 0) {
        const move0 = {
            id: (0, __1.generateId)(),
            player,
            dieValue: roll[0],
            stateKind: 'ready',
            moveKind: 'point-to-point',
            origin: possibleMoves0[0].origin,
        };
        moves.add(move0);
    }
    if (possibleMoves1.length > 0) {
        const move1 = {
            id: (0, __1.generateId)(),
            player,
            dieValue: roll[1],
            stateKind: 'ready',
            moveKind: 'point-to-point',
            origin: possibleMoves1[0].origin,
        };
        moves.add(move1);
    }
    if (roll[0] === roll[1]) {
        const possibleMoves2 = __1.Board.getPossibleMoves(board, player, roll[0]);
        const possibleMoves3 = __1.Board.getPossibleMoves(board, player, roll[1]);
        if (possibleMoves2.length > 0) {
            const move2 = {
                id: (0, __1.generateId)(),
                player,
                dieValue: roll[0],
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: possibleMoves2[0].origin,
            };
            moves.add(move2);
        }
        if (possibleMoves3.length > 0) {
            const move3 = {
                id: (0, __1.generateId)(),
                player,
                dieValue: roll[1],
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: possibleMoves3[0].origin,
            };
            moves.add(move3);
        }
    }
    if (moves.size === 0) {
        // If no moves are possible, create a no-move move
        const noMove = {
            id: (0, __1.generateId)(),
            player,
            dieValue: roll[0],
            stateKind: 'completed',
            moveKind: 'no-move',
            isHit: false,
        };
        moves.add(noMove);
    }
    return {
        id: (0, __1.generateId)(),
        stateKind: 'rolled',
        board,
        player,
        moves,
    };
};
