"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDbError = exports.PlayerStateError = void 0;
const PlayerStateError = (message) => {
    return {
        name: 'PlayerStateError',
        entity: 'player',
        message,
    };
};
exports.PlayerStateError = PlayerStateError;
const PlayerDbError = (message) => {
    return {
        name: 'PlayerDbError',
        entity: 'player',
        message,
    };
};
exports.PlayerDbError = PlayerDbError;
