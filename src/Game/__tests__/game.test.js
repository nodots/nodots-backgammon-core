"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Player_1 = require("../../Player");
const __2 = require("../../");
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('Game', () => {
    (0, globals_1.describe)('Initialization', () => {
        (0, globals_1.it)('should initialize the game correctly with minimal parameters', () => {
            const clockwiseColor = (0, __2.randomBackgammonColor)();
            const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black';
            const players = [
                Player_1.Player.initialize(clockwiseColor, 'clockwise'),
                Player_1.Player.initialize(counterclockwiseColor, 'counterclockwise'),
            ];
            const game = __1.Game.initialize(players);
            (0, globals_1.expect)(game).toBeDefined();
            (0, globals_1.expect)(game.stateKind).toBe('rolling-for-start');
            (0, globals_1.expect)(game.players).toBeDefined();
            (0, globals_1.expect)(game.players.length).toBe(2);
            (0, globals_1.expect)(game.board).toBeDefined();
            (0, globals_1.expect)(game.cube).toBeDefined();
            (0, globals_1.expect)(game.activeColor).toBeUndefined();
            (0, globals_1.expect)(game.activePlayer).toBeUndefined();
            (0, globals_1.expect)(game.inactivePlayer).toBeUndefined();
        });
        (0, globals_1.it)('should throw error when initializing in completed state', () => {
            const players = [
                Player_1.Player.initialize('black', 'clockwise'),
                Player_1.Player.initialize('white', 'counterclockwise'),
            ];
            (0, globals_1.expect)(() => __1.Game.initialize(players, undefined, 'completed')).toThrow('Game cannot be initialized in the completed state');
        });
        (0, globals_1.it)('should throw error when initializing in rolled-for-start state without required properties', () => {
            const players = [
                Player_1.Player.initialize('black', 'clockwise'),
                Player_1.Player.initialize('white', 'counterclockwise'),
            ];
            (0, globals_1.expect)(() => __1.Game.initialize(players, undefined, 'rolled-for-start')).toThrow('Active color must be provided');
        });
        (0, globals_1.it)('should throw error when initializing in rolling state without required properties', () => {
            const players = [
                Player_1.Player.initialize('black', 'clockwise'),
                Player_1.Player.initialize('white', 'counterclockwise'),
            ];
            (0, globals_1.expect)(() => __1.Game.initialize(players, undefined, 'rolling')).toThrow('Active color must be provided');
        });
        (0, globals_1.it)('should throw error when initializing in moving state without required properties', () => {
            const players = [
                Player_1.Player.initialize('black', 'clockwise'),
                Player_1.Player.initialize('white', 'counterclockwise'),
            ];
            (0, globals_1.expect)(() => __1.Game.initialize(players, undefined, 'moving')).toThrow('Active color must be provided');
        });
        (0, globals_1.it)('should throw error when initializing in moving state without active play', () => {
            const players = [
                Player_1.Player.initialize('black', 'clockwise'),
                Player_1.Player.initialize('white', 'counterclockwise'),
            ];
            const activePlayer = Object.assign(Object.assign({}, players[0]), { stateKind: 'rolling' });
            const inactivePlayer = Object.assign(Object.assign({}, players[1]), { stateKind: 'inactive' });
            (0, globals_1.expect)(() => __1.Game.initialize(players, undefined, 'moving', undefined, undefined, undefined, 'black', activePlayer, inactivePlayer)).toThrow('Active play must be provided');
        });
    });
    (0, globals_1.describe)('Game Flow', () => {
        const clockwiseColor = (0, __2.randomBackgammonColor)();
        const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black';
        const players = [
            Player_1.Player.initialize(clockwiseColor, 'clockwise'),
            Player_1.Player.initialize(counterclockwiseColor, 'counterclockwise'),
        ];
        (0, globals_1.it)('should transition from rolling-for-start to rolling', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            (0, globals_1.expect)(gameRolling.stateKind).toBe('rolling');
            (0, globals_1.expect)(gameRolling.activeColor).toBeDefined();
            (0, globals_1.expect)(gameRolling.activePlayer).toBeDefined();
            (0, globals_1.expect)(gameRolling.inactivePlayer).toBeDefined();
            (0, globals_1.expect)(gameRolling.activePlayer.color).toBe(gameRolling.activeColor);
            (0, globals_1.expect)(gameRolling.inactivePlayer.color).not.toBe(gameRolling.activeColor);
        });
        (0, globals_1.it)('should transition from rolling to moving', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            const gameMoving = __1.Game.roll(rolledForStartGame);
            (0, globals_1.expect)(gameMoving.stateKind).toBe('moving');
            (0, globals_1.expect)(gameMoving.activePlayer).toBeDefined();
            (0, globals_1.expect)(gameMoving.activePlay).toBeDefined();
            (0, globals_1.expect)(gameMoving.board).toBeDefined();
            (0, globals_1.expect)(gameMoving.activePlayer.dice.currentRoll).toBeDefined();
            (0, globals_1.expect)(gameMoving.activePlay.moves.size).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should handle moves correctly', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            const gameMoving = __1.Game.roll(rolledForStartGame);
            // Get the first available move
            (0, globals_1.expect)(gameMoving.activePlay.moves.size).toBeGreaterThan(0);
            const firstMove = Array.from(gameMoving.activePlay.moves)[0];
            (0, globals_1.expect)(firstMove).toBeDefined();
            // Get the move's origin and make the move
            (0, globals_1.expect)(firstMove.origin).toBeDefined();
            if (firstMove.origin) {
                const gameMoved = __1.Game.move(gameMoving, firstMove.origin);
                (0, globals_1.expect)(gameMoved).toBeDefined();
            }
        });
        (0, globals_1.it)('should throw error when rolling with invalid active color', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', activeColor: 'invalid', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            (0, globals_1.expect)(() => __1.Game.roll(rolledForStartGame)).toThrow('Players not found');
        });
    });
    (0, globals_1.describe)('Player Management', () => {
        const clockwiseColor = (0, __2.randomBackgammonColor)();
        const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black';
        const players = [
            Player_1.Player.initialize(clockwiseColor, 'clockwise'),
            Player_1.Player.initialize(counterclockwiseColor, 'counterclockwise'),
        ];
        (0, globals_1.it)('should get players for color correctly', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const [activePlayer, inactivePlayer] = __1.Game.getPlayersForColor(gameRolling.players, gameRolling.activeColor);
            (0, globals_1.expect)(activePlayer).toBeDefined();
            (0, globals_1.expect)(inactivePlayer).toBeDefined();
            (0, globals_1.expect)(activePlayer.color).toBe(gameRolling.activeColor);
            (0, globals_1.expect)(inactivePlayer.color).not.toBe(gameRolling.activeColor);
        });
        (0, globals_1.it)('should get active player correctly', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            const activePlayer = __1.Game.activePlayer(rolledForStartGame);
            (0, globals_1.expect)(activePlayer).toBeDefined();
            (0, globals_1.expect)(activePlayer.color).toBe(rolledForStartGame.activeColor);
            (0, globals_1.expect)(activePlayer.stateKind).not.toBe('inactive');
        });
        (0, globals_1.it)('should get inactive player correctly', () => {
            const gameStart = __1.Game.initialize(players);
            const gameRolling = __1.Game.rollForStart(gameStart);
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            const inactivePlayer = __1.Game.inactivePlayer(rolledForStartGame);
            (0, globals_1.expect)(inactivePlayer).toBeDefined();
            (0, globals_1.expect)(inactivePlayer.color).not.toBe(rolledForStartGame.activeColor);
            (0, globals_1.expect)(inactivePlayer.stateKind).toBe('inactive');
        });
        (0, globals_1.it)('should throw error when active player not found', () => {
            const gameStart = __1.Game.initialize(players);
            const invalidGame = Object.assign(Object.assign({}, gameStart), { activeColor: 'red' });
            (0, globals_1.expect)(() => __1.Game.activePlayer(invalidGame)).toThrow('Active player not found');
        });
        (0, globals_1.it)('should throw error when inactive player not found', () => {
            const gameStart = __1.Game.initialize(players);
            const invalidGame = Object.assign(Object.assign({}, gameStart), { activeColor: players[0].color, players: [
                    Object.assign(Object.assign({}, players[0]), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, players[0]), { stateKind: 'rolling' }),
                ] });
            (0, globals_1.expect)(() => __1.Game.inactivePlayer(invalidGame)).toThrow('Inactive player not found');
        });
        (0, globals_1.it)('should throw error when players not found for color', () => {
            const gameStart = __1.Game.initialize(players);
            const emptyPlayers = [
                Object.assign(Object.assign({}, players[0]), { stateKind: 'rolling' }),
                Object.assign(Object.assign({}, players[0]), { stateKind: 'rolling' }),
            ];
            (0, globals_1.expect)(() => __1.Game.getPlayersForColor(emptyPlayers, 'red')).toThrow('Players not found');
        });
    });
});
