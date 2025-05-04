"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const __1 = require("..");
const Play_1 = require("../Play");
class Player {
    constructor() {
        this.id = (0, __1.generateId)();
        this.stateKind = 'inactive';
        this.pipCount = 167;
    }
}
exports.Player = Player;
Player.initialize = function initializePlayer(color, direction, dice = __1.Dice.initialize(color), id = (0, __1.generateId)(), stateKind = 'inactive') {
    switch (stateKind) {
        case 'inactive':
            return {
                id,
                color,
                direction,
                stateKind,
                dice: __1.Dice.initialize(color),
                pipCount: 167,
            };
        case 'rolling-for-start':
            return {
                id,
                color,
                direction,
                stateKind,
                dice: __1.Dice.initialize(color),
                pipCount: 167,
            };
        case 'rolled-for-start': {
            return {
                id,
                color,
                direction,
                stateKind,
                dice: __1.Dice.initialize(color),
                pipCount: 167,
            };
        }
        case 'rolling':
            return {
                id,
                color,
                direction,
                stateKind,
                dice,
                pipCount: 167,
            };
        case 'rolled':
            const rolledDice = dice;
            return {
                id,
                color,
                direction,
                stateKind,
                dice: rolledDice,
                pipCount: 167,
            };
        case 'moving':
            return {
                id,
                color,
                direction,
                stateKind,
                dice,
                pipCount: 167,
            };
        case 'moved':
            return {
                id,
                color,
                direction,
                stateKind,
                dice,
                pipCount: 167,
            };
        case 'winner':
            return {
                id,
                color,
                direction,
                stateKind: 'winner',
                dice,
                pipCount: 0,
            };
    }
};
Player.roll = function roll(player) {
    const inactiveDice = __1.Dice.initialize(player.color);
    const rolledDice = __1.Dice.roll(inactiveDice);
    return Object.assign(Object.assign({}, player), { stateKind: 'rolled', dice: rolledDice });
};
Player.move = function move(board, play, origin) {
    const moveResults = Play_1.Play.move(board, play, origin);
    return Object.assign({}, moveResults);
};
Player.getHomeBoard = function getHomeBoard(board, player) {
    return player.direction === 'clockwise'
        ? board.BackgammonPoints.filter((p) => p.kind === 'point' &&
            p.position[player.direction] >= 19 &&
            p.position[player.direction] <= 24)
        : board.BackgammonPoints.filter((p) => p.kind === 'point' &&
            p.position[player.direction] >= 1 &&
            p.position[player.direction] <= 6);
};
Player.getOpponentBoard = function getOpponentBoard(board, player) {
    const points = player.direction === 'clockwise'
        ? board.BackgammonPoints.slice(0, 6) // Points 1-6 for clockwise player
        : board.BackgammonPoints.slice(18, 24); // Points 19-24 for counterclockwise player
    return points;
};
