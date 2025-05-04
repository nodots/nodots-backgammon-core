"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cube = void 0;
const __1 = require("..");
class Cube {
    constructor() {
        this.stateKind = 'initialized';
        this.value = undefined;
        this.owner = undefined;
    }
}
exports.Cube = Cube;
Cube.initialize = function initializeCube(cube) {
    if (!cube) {
        cube = {};
    }
    let { id, stateKind, value, owner } = cube;
    if (!id) {
        id = (0, __1.generateId)();
    }
    if (!stateKind) {
        stateKind = 'initialized';
    }
    return {
        id,
        stateKind,
        value,
        owner: owner !== null && owner !== void 0 ? owner : undefined,
    };
};
Cube.double = function doubleCube(cube, player, players) {
    if (cube.owner !== undefined && cube.owner !== player)
        throw Error(`Player ${JSON.stringify(player)} does not own Cube ${JSON.stringify(cube)}`);
    const owner = players.find((p) => p.id !== player.id);
    const newValue = cube.value ? (cube.value * 2) : 2;
    const stateKind = newValue === 64 ? 'maxxed' : 'doubled';
    return stateKind === 'doubled'
        ? Object.assign(Object.assign({}, cube), { value: newValue, stateKind,
            owner })
        : Object.assign(Object.assign({}, cube), { value: 64, stateKind, owner: undefined });
};
