"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const __1 = require("..");
const Board_1 = require("../Board");
const Cube_1 = require("../Cube");
const Play_1 = require("../Play");
class Game {
}
exports.Game = Game;
Game.initialize = function initializeGame(players, id = (0, __1.generateId)(), stateKind = 'rolling-for-start', board = Board_1.Board.initialize(), cube = Cube_1.Cube.initialize(), activePlay, activeColor, activePlayer, inactivePlayer, origin) {
    switch (stateKind) {
        case 'rolling-for-start':
            return {
                id,
                stateKind,
                players,
                board,
                cube,
            };
        case 'rolled-for-start':
            if (!activeColor)
                throw new Error('Active color must be provided');
            if (!activePlayer)
                throw new Error('Active player must be provided');
            if (!inactivePlayer)
                throw new Error('Inactive player must be provided');
            return {
                id,
                stateKind,
                players,
                board,
                cube,
                activeColor,
                activePlayer,
                inactivePlayer,
            };
        case 'rolling':
            if (!activeColor)
                throw new Error('Active color must be provided');
            if (!activePlayer)
                throw new Error('Active player must be provided');
            if (!inactivePlayer)
                throw new Error('Inactive player must be provided');
            return {
                id,
                stateKind,
                players,
                board,
                cube,
                activeColor,
                activePlayer,
                inactivePlayer,
            };
        case 'moving':
            if (!activeColor)
                throw new Error('Active color must be provided');
            if (!activePlayer)
                throw new Error('Active player must be provided');
            if (!inactivePlayer)
                throw new Error('Inactive player must be provided');
            if (!activePlay)
                throw new Error('Active play must be provided');
            return {
                id,
                stateKind,
                players,
                board,
                cube,
                activeColor,
                activePlayer,
                inactivePlayer,
                activePlay,
            };
        case 'completed':
            throw new Error('Game cannot be initialized in the completed state');
    }
};
Game.rollForStart = function rollForStart(game) {
    const activeColor = (0, __1.randomBackgammonColor)();
    const [activePlayerRolledForStart, inactivePlayerRolledForStart] = Game.getPlayersForColor(game.players, activeColor);
    const activePlayer = activePlayerRolledForStart;
    const inactivePlayer = inactivePlayerRolledForStart;
    return Object.assign(Object.assign({}, game), { stateKind: 'rolling', activeColor,
        activePlayer,
        inactivePlayer });
};
Game.roll = function roll(game) {
    const { id, players, board, cube, activeColor } = game;
    if (!activeColor)
        throw new Error('Active color must be provided');
    let [activePlayerForColor, inactivePlayerForColor] = Game.getPlayersForColor(players, activeColor);
    let activePlayer = activePlayerForColor;
    if (!activePlayer)
        throw new Error('Active player not found');
    const inactivePlayer = inactivePlayerForColor;
    if (!inactivePlayer)
        throw new Error('Inactive player not found');
    const playerRolled = __1.Player.roll(activePlayer);
    const activePlay = Play_1.Play.initialize(board, playerRolled);
    // Convert the play state to moving
    const movingPlay = Object.assign(Object.assign({}, activePlay), { stateKind: 'moving', player: Object.assign(Object.assign({}, playerRolled), { stateKind: 'moving' }) });
    return Object.assign(Object.assign({}, game), { stateKind: 'moving', activePlayer: playerRolled, activePlay: movingPlay, board });
};
Game.move = function move(game, origin) {
    const { id, players, cube, activeColor, activePlay } = game;
    let board = game.board;
    const activePlayer = Game.activePlayer(game);
    const playResult = __1.Player.move(board, activePlay, origin);
    board = playResult.board;
    return {
        id,
        stateKind: 'moving',
        players,
        board,
        cube,
        activePlay,
        activeColor,
        activePlayer,
    };
};
Game.activePlayer = function activePlayer(game) {
    const activePlayer = game.players.find((p) => p.color === game.activeColor && p.stateKind !== 'inactive');
    if (!activePlayer) {
        throw new Error('Active player not found');
    }
    return activePlayer;
};
Game.inactivePlayer = function inactivePlayer(game) {
    const inactivePlayer = game.players.find((p) => p.color !== game.activeColor && p.stateKind === 'inactive');
    if (!inactivePlayer) {
        throw new Error('Inactive player not found');
    }
    return inactivePlayer;
};
Game.getPlayersForColor = function getPlayersForColor(players, color) {
    const activePlayerForColor = players.find((p) => p.color === color);
    const inactivePlayerForColor = players.find((p) => p.color !== color);
    if (!activePlayerForColor || !inactivePlayerForColor) {
        throw new Error('Players not found');
    }
    return [
        activePlayerForColor,
        inactivePlayerForColor,
    ];
};
Game.sanityCheckMovingGame = (game) => {
    if (game.stateKind !== 'moving')
        return false;
    return game;
};
