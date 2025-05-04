"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const __2 = require("../..");
const globals_1 = require("@jest/globals");
let cube;
let players = undefined;
(0, globals_1.describe)('Cube', () => {
    (0, globals_1.beforeAll)(() => {
        cube = __1.Cube.initialize({});
        const clockwiseColor = (0, __2.randomBackgammonColor)();
        const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white';
        const player = {
            id: (0, __2.generateId)(),
            stateKind: 'rolled',
            color: clockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: clockwiseColor,
                stateKind: 'rolled',
                currentRoll: [1, 2],
                total: 3,
            },
            pipCount: 167,
        };
        const opponent = {
            id: (0, __2.generateId)(),
            stateKind: 'inactive',
            color: counterclockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: counterclockwiseColor,
                stateKind: 'inactive',
                currentRoll: undefined,
            },
            pipCount: 167,
        };
        players = [player, opponent];
    });
    (0, globals_1.it)('should initialize the cube', () => {
        (0, globals_1.expect)(cube.id).toBeDefined();
        (0, globals_1.expect)(cube.stateKind).toBe('initialized');
        (0, globals_1.expect)(cube.value).toBeUndefined();
        (0, globals_1.expect)(cube.owner).toBeUndefined();
    });
    (0, globals_1.it)('should set the value to 2 when it is doubled the first time', () => {
        const clockwiseColor = (0, __2.randomBackgammonColor)();
        const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white';
        const player = {
            id: (0, __2.generateId)(),
            stateKind: 'rolled',
            color: clockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: clockwiseColor,
                stateKind: 'rolled',
                currentRoll: [1, 2],
                total: 3,
            },
            pipCount: 167,
        };
        const opponent = {
            id: (0, __2.generateId)(),
            stateKind: 'inactive',
            color: counterclockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: counterclockwiseColor,
                stateKind: 'inactive',
                currentRoll: undefined,
            },
            pipCount: 167,
        };
        players = [player, opponent];
        cube = __1.Cube.double(cube, player, players);
        (0, globals_1.expect)(cube.value).toBe(2);
        (0, globals_1.expect)(cube.owner).toBe(opponent);
    });
    (0, globals_1.it)('should double the value each time until it reaches 64', () => {
        const clockwiseColor = (0, __2.randomBackgammonColor)();
        const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white';
        const player = {
            id: (0, __2.generateId)(),
            stateKind: 'rolled',
            color: clockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: clockwiseColor,
                stateKind: 'rolled',
                currentRoll: [1, 2],
                total: 3,
            },
            pipCount: 167,
        };
        const opponent = {
            id: (0, __2.generateId)(),
            stateKind: 'inactive',
            color: counterclockwiseColor,
            direction: 'clockwise',
            dice: {
                id: (0, __2.generateId)(),
                color: counterclockwiseColor,
                stateKind: 'inactive',
                currentRoll: undefined,
            },
            pipCount: 167,
        };
        cube = __1.Cube.initialize({
            value: undefined,
        });
        players = [player, opponent];
        cube = __1.Cube.double(cube, player, players);
        (0, globals_1.expect)(cube.value).toBe(2);
        (0, globals_1.expect)(cube.owner).toBe(opponent);
        (0, globals_1.expect)(cube.stateKind).toBe('doubled');
        cube = __1.Cube.double(cube, opponent, players);
        (0, globals_1.expect)(cube.value).toBe(4);
        (0, globals_1.expect)(cube.owner).toBe(player);
        (0, globals_1.expect)(cube.stateKind).toBe('doubled');
        cube = __1.Cube.double(cube, player, players);
        (0, globals_1.expect)(cube.value).toBe(8);
        (0, globals_1.expect)(cube.owner).toBe(opponent);
        (0, globals_1.expect)(cube.stateKind).toBe('doubled');
        cube = __1.Cube.double(cube, opponent, players);
        (0, globals_1.expect)(cube.value).toBe(16);
        (0, globals_1.expect)(cube.owner).toBe(player);
        cube = __1.Cube.double(cube, player, players);
        (0, globals_1.expect)(cube.value).toBe(32);
        (0, globals_1.expect)(cube.owner).toBe(opponent);
        cube = __1.Cube.double(cube, opponent, players);
        (0, globals_1.expect)(cube.value).toBe(64);
        (0, globals_1.expect)(cube.owner).toBe(undefined);
        (0, globals_1.expect)(cube.stateKind).toBe('maxxed');
    });
});
