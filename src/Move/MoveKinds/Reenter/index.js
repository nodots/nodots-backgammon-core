"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reenter = void 0;
const __1 = require("../../..");
class Reenter {
}
exports.Reenter = Reenter;
Reenter.isA = function isAReenterMove(move) {
    const { player, origin } = move;
    if (!origin || origin.kind !== 'bar')
        return false;
    if (origin.checkers.length === 0)
        return false;
    if (origin.checkers[0].color !== player.color)
        return false;
    return Object.assign(Object.assign({}, move), { stateKind: 'in-progress', moveKind: 'reenter' });
};
Reenter.getDestination = (board, move) => {
    const { player, dieValue } = move;
    const direction = player.direction;
    // For reentry, we need to find points in the opponent's home board
    // For clockwise: points 19-24 map to die values 6-1
    // For counterclockwise: points 1-6 map to die values 1-6
    const targetPosition = direction === 'clockwise'
        ? 25 - dieValue // For clockwise, count down from 24 (e.g., die value 1 means point 24)
        : dieValue; // For counterclockwise, count up from 1 (e.g., die value 1 means point 1)
    // Find the point in opponent's home board
    const destination = board.BackgammonPoints.find((p) => {
        // Point must be either empty or have at most one opponent checker
        const isPointAvailable = p.checkers.length === 0 ||
            (p.checkers.length === 1 && p.checkers[0].color !== player.color);
        // Position must match the die value from the player's perspective
        const isCorrectPosition = p.position[direction] === targetPosition;
        return isPointAvailable && isCorrectPosition;
    });
    if (!destination) {
        throw new Error('Invalid reenter move: no valid destination found');
    }
    return destination;
};
Reenter.move = function move(board, move, isDryRun = false) {
    // Validate the move
    if (!Reenter.isA(move)) {
        throw new Error('Invalid reenter move: not a valid reenter move');
    }
    const { player } = move;
    const origin = move.origin;
    const direction = player.direction;
    // Get the destination point
    const destination = Reenter.getDestination(board, move);
    // If this is a dry run, return without modifying the board
    if (isDryRun) {
        return {
            board,
            move: Object.assign(Object.assign({}, move), { destination }),
        };
    }
    // Get the checker to move and preserve its color
    const checker = origin.checkers[origin.checkers.length - 1];
    if (!checker)
        throw Error('No checker found');
    const movingCheckerColor = checker.color;
    // Move the checker
    const updatedBoard = __1.Board.moveChecker(board, origin, destination, direction);
    // Get the updated destination point from the updated board
    const updatedDestination = updatedBoard.BackgammonPoints.find((p) => p.id === destination.id);
    if (!updatedDestination) {
        throw new Error('Could not find destination point after move');
    }
    // Verify the move was successful and the checker color was preserved
    const destinationChecker = updatedDestination.checkers[0];
    if (!destinationChecker ||
        destinationChecker.color !== movingCheckerColor) {
        throw new Error('Checker color was not preserved during move');
    }
    // Return the result with completed move
    const completedMove = {
        id: move.id,
        player: move.player,
        stateKind: 'completed',
        moveKind: 'reenter',
        origin: origin,
        destination: updatedDestination,
        dieValue: move.dieValue,
        possibleMoves: move.possibleMoves,
    };
    return {
        board: updatedBoard,
        move: completedMove,
    };
};
