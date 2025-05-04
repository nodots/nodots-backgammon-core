"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dice = void 0;
const __1 = require("..");
class Dice {
}
exports.Dice = Dice;
_a = Dice;
Dice.initialize = function initializeDice(color, stateKind = 'inactive', id = (0, __1.generateId)(), currentRoll = undefined) {
    const total = currentRoll ? currentRoll[0] + currentRoll[1] : undefined;
    return {
        id,
        stateKind: 'inactive',
        color,
        currentRoll,
        total,
    };
};
Dice.roll = function rollDice(dice) {
    const currentRoll = [
        _a.rollDie(),
        _a.rollDie(),
    ];
    return Object.assign(Object.assign({}, dice), { stateKind: 'rolled', currentRoll, total: currentRoll[0] + currentRoll[1] });
};
Dice.switchDice = function switchDice(dice) {
    return Object.assign(Object.assign({}, dice), { currentRoll: [
            dice.currentRoll[1],
            dice.currentRoll[0],
        ] });
};
Dice.isDouble = function isDouble(dice) {
    return dice.currentRoll[0] === dice.currentRoll[1];
};
Dice.rollDie = function rollDie() {
    return (Math.floor(Math.random() * 6) + 1);
};
// Convenience  mostly for tests
Dice._RandomRoll = [_a.rollDie(), _a.rollDie()];
