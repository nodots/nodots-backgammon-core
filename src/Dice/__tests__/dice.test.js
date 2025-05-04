"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
const __2 = require("../..");
const monteCarloRuns = 100000;
const randomColor = (0, __2.randomBackgammonColor)();
(0, globals_1.describe)('Dice', () => {
    (0, globals_1.describe)('Initialization', () => {
        (0, globals_1.it)('should initialize the dice correctly with minimal parameters', () => {
            const dice = __1.Dice.initialize(randomColor);
            (0, globals_1.expect)(dice).toBeDefined();
            (0, globals_1.expect)(dice.id).toBeDefined();
            (0, globals_1.expect)(dice.stateKind).toBe('inactive');
            (0, globals_1.expect)(dice.color).toBe(randomColor);
            (0, globals_1.expect)(dice.currentRoll).toBeUndefined();
            (0, globals_1.expect)(dice.total).toBeUndefined();
        });
        (0, globals_1.it)('should initialize the dice correctly with all parameters', () => {
            const id = 'test-id';
            const currentRoll = [3, 4];
            const dice = __1.Dice.initialize(randomColor, 'inactive', id, currentRoll);
            (0, globals_1.expect)(dice.id).toBe(id);
            (0, globals_1.expect)(dice.stateKind).toBe('inactive');
            (0, globals_1.expect)(dice.color).toBe(randomColor);
            (0, globals_1.expect)(dice.currentRoll).toEqual(currentRoll);
            (0, globals_1.expect)(dice.total).toBe(7);
        });
    });
    (0, globals_1.describe)('Rolling', () => {
        const dice = __1.Dice.initialize(randomColor);
        (0, globals_1.it)('should roll the dice correctly', () => {
            const rolledDice = __1.Dice.roll(dice);
            (0, globals_1.expect)(rolledDice).toBeDefined();
            (0, globals_1.expect)(rolledDice.id).toBe(dice.id);
            (0, globals_1.expect)(rolledDice.stateKind).toBe('rolled');
            (0, globals_1.expect)(rolledDice.color).toBe(dice.color);
            (0, globals_1.expect)(rolledDice.currentRoll).toBeDefined();
            (0, globals_1.expect)(rolledDice.currentRoll.length).toBe(2);
            (0, globals_1.expect)(rolledDice.currentRoll[0]).toBeGreaterThanOrEqual(1);
            (0, globals_1.expect)(rolledDice.currentRoll[0]).toBeLessThanOrEqual(6);
            (0, globals_1.expect)(rolledDice.currentRoll[1]).toBeGreaterThanOrEqual(1);
            (0, globals_1.expect)(rolledDice.currentRoll[1]).toBeLessThanOrEqual(6);
            (0, globals_1.expect)(rolledDice.total).toBe(rolledDice.currentRoll[0] + rolledDice.currentRoll[1]);
        });
        test('should have approximately uniform distribution for individual dice', () => {
            const rolls = [];
            for (let i = 0; i < monteCarloRuns; i++) {
                const roll = __1.Dice.roll(dice);
                rolls.push(roll.currentRoll);
            }
            const counts = new Array(6).fill(0);
            rolls.forEach((roll) => {
                counts[roll[0] - 1]++;
                counts[roll[1] - 1]++;
            });
            const expectedCount = (monteCarloRuns * 2) / 6;
            counts.forEach((count, index) => {
                const deviation = Math.abs(count - expectedCount) / expectedCount;
                (0, globals_1.expect)(deviation).toBeLessThan(0.05); // Allowing 5% deviation
                console.log(`Die value ${index + 1} appeared ${count} times (${((count / (monteCarloRuns * 2)) *
                    100).toFixed(2)}%)`);
            });
        });
        test('should have correct probability distribution for totals', () => {
            const rolls = [];
            for (let i = 0; i < monteCarloRuns; i++) {
                const roll = __1.Dice.roll(dice);
                rolls.push(roll.currentRoll);
            }
            // Expected probabilities for each total (2-12)
            const expectedProbabilities = {
                2: 1 / 36, // (1,1)
                3: 2 / 36, // (1,2), (2,1)
                4: 3 / 36, // (1,3), (2,2), (3,1)
                5: 4 / 36, // (1,4), (2,3), (3,2), (4,1)
                6: 5 / 36, // (1,5), (2,4), (3,3), (4,2), (5,1)
                7: 6 / 36, // (1,6), (2,5), (3,4), (4,3), (5,2), (6,1)
                8: 5 / 36, // (2,6), (3,5), (4,4), (5,3), (6,2)
                9: 4 / 36, // (3,6), (4,5), (5,4), (6,3)
                10: 3 / 36, // (4,6), (5,5), (6,4)
                11: 2 / 36, // (5,6), (6,5)
                12: 1 / 36, // (6,6)
            };
            const totalCounts = new Array(13).fill(0); // 0-12, ignore 0-1
            rolls.forEach((roll) => {
                const total = roll[0] + roll[1];
                totalCounts[total]++;
            });
            // Check each total's probability
            for (let total = 2; total <= 12; total++) {
                const actualProbability = totalCounts[total] / monteCarloRuns;
                const expectedProbability = expectedProbabilities[total];
                const deviation = Math.abs(actualProbability - expectedProbability) /
                    expectedProbability;
                (0, globals_1.expect)(deviation).toBeLessThan(0.1); // Allowing 10% deviation
                console.log(`Total ${total}: Expected ${(expectedProbability * 100).toFixed(2)}%, Actual ${(actualProbability * 100).toFixed(2)}%`);
            }
        });
    });
    (0, globals_1.describe)('Switching Dice', () => {
        (0, globals_1.it)('should switch dice correctly', () => {
            const dice = __1.Dice.initialize(randomColor);
            const rolledDice = __1.Dice.roll(dice);
            const originalRoll = [...rolledDice.currentRoll];
            const switchedDice = __1.Dice.switchDice(rolledDice);
            (0, globals_1.expect)(switchedDice.currentRoll[0]).toBe(originalRoll[1]);
            (0, globals_1.expect)(switchedDice.currentRoll[1]).toBe(originalRoll[0]);
            (0, globals_1.expect)(switchedDice.total).toBe(rolledDice.total);
        });
        (0, globals_1.it)('should maintain dice properties after switching', () => {
            const dice = __1.Dice.initialize(randomColor);
            const rolledDice = __1.Dice.roll(dice);
            const switchedDice = __1.Dice.switchDice(rolledDice);
            (0, globals_1.expect)(switchedDice.id).toBe(rolledDice.id);
            (0, globals_1.expect)(switchedDice.stateKind).toBe(rolledDice.stateKind);
            (0, globals_1.expect)(switchedDice.color).toBe(rolledDice.color);
        });
    });
    (0, globals_1.describe)('Double Detection', () => {
        (0, globals_1.it)('should correctly identify doubles', () => {
            const dice = __1.Dice.initialize(randomColor);
            const mockRoll = [4, 4];
            const rolledDice = Object.assign(Object.assign({}, dice), { stateKind: 'rolled', currentRoll: mockRoll, total: 8 });
            (0, globals_1.expect)(__1.Dice.isDouble(rolledDice)).toBe(true);
        });
        (0, globals_1.it)('should correctly identify non-doubles', () => {
            const dice = __1.Dice.initialize(randomColor);
            const mockRoll = [3, 4];
            const rolledDice = Object.assign(Object.assign({}, dice), { stateKind: 'rolled', currentRoll: mockRoll, total: 7 });
            (0, globals_1.expect)(__1.Dice.isDouble(rolledDice)).toBe(false);
        });
        test('should have correct probability of doubles', () => {
            const dice = __1.Dice.initialize(randomColor);
            const rolls = [];
            for (let i = 0; i < monteCarloRuns; i++) {
                const roll = __1.Dice.roll(dice);
                rolls.push(roll);
            }
            const doubles = rolls.filter((roll) => __1.Dice.isDouble(roll));
            const doublesProbability = doubles.length / monteCarloRuns;
            const expectedProbability = 1 / 6; // 6 possible doubles out of 36 possible rolls
            const deviation = Math.abs(doublesProbability - expectedProbability) / expectedProbability;
            (0, globals_1.expect)(deviation).toBeLessThan(0.1); // Allowing 10% deviation
            console.log(`Doubles probability: Expected ${(expectedProbability * 100).toFixed(2)}%, Actual ${(doublesProbability * 100).toFixed(2)}%`);
        });
    });
});
