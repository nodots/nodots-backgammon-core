"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateError = void 0;
const GameStateError = (message) => {
    return {
        name: 'GameStateError',
        entity: 'game',
        message,
    };
};
exports.GameStateError = GameStateError;
