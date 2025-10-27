import { BackgammonColor, BackgammonDice, BackgammonDiceInactive, BackgammonDiceRolled, BackgammonDiceRolledForStart, BackgammonDiceRolling, BackgammonDiceRollingForStart, BackgammonDiceStateKind, BackgammonDieValue, BackgammonRoll, BackgammonRollForStart } from '@nodots-llc/backgammon-types';
export declare class Dice {
    static initialize(color: BackgammonColor): BackgammonDiceInactive;
    static initialize(color: BackgammonColor, stateKind: 'inactive', id?: string, currentRoll?: undefined): BackgammonDiceInactive;
    static initialize(color: BackgammonColor, stateKind: 'rolling', id?: string, currentRoll?: BackgammonRoll): BackgammonDiceRolling;
    static initialize(color: BackgammonColor, stateKind: 'rolling-for-start', id?: string, currentRoll?: BackgammonRollForStart): BackgammonDiceRollingForStart;
    static initialize(color: BackgammonColor, stateKind: 'rolled-for-start', id?: string, currentRoll?: BackgammonRollForStart): BackgammonDiceRolledForStart;
    static initialize(color: BackgammonColor, stateKind: 'rolled', id?: string, currentRoll?: BackgammonRoll): BackgammonDiceRolled;
    static initialize(color: BackgammonColor, stateKind?: BackgammonDiceStateKind, id?: string, currentRoll?: BackgammonRoll | BackgammonRollForStart): BackgammonDice;
    static roll: (dice: BackgammonDiceInactive | BackgammonDiceRolling) => BackgammonDiceRolled;
    static switchDice: (dice: BackgammonDiceRolled) => BackgammonDiceRolled;
    static isDouble: (dice: BackgammonDiceRolled) => boolean;
    static rollForStart: (dice: BackgammonDiceRollingForStart) => BackgammonDiceRolledForStart;
    static rollDie: () => BackgammonDieValue;
    static _RandomRoll: BackgammonRoll;
}
//# sourceMappingURL=index.d.ts.map