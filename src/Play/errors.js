"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayDbError = void 0;
const PlayDbError = (message) => {
    return {
        name: 'PlayDbError',
        entity: 'play',
        message,
    };
};
exports.PlayDbError = PlayDbError;
