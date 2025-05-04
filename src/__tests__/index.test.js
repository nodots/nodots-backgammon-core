"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const __1 = require("..");
(0, globals_1.describe)('Root utilities', () => {
    (0, globals_1.describe)('randomBoolean', () => {
        (0, globals_1.it)('should return a boolean value', () => {
            const result = (0, __1.randomBoolean)();
            (0, globals_1.expect)(typeof result).toBe('boolean');
        });
        (0, globals_1.it)('should have roughly equal distribution over many iterations', () => {
            const iterations = 10000;
            let trueCount = 0;
            for (let i = 0; i < iterations; i++) {
                if ((0, __1.randomBoolean)()) {
                    trueCount++;
                }
            }
            const ratio = trueCount / iterations;
            (0, globals_1.expect)(ratio).toBeGreaterThan(0.45); // Allow for some randomness
            (0, globals_1.expect)(ratio).toBeLessThan(0.55);
        });
    });
    (0, globals_1.describe)('randomBackgammonColor', () => {
        (0, globals_1.it)('should return either black or white', () => {
            const result = (0, __1.randomBackgammonColor)();
            (0, globals_1.expect)(['black', 'white']).toContain(result);
        });
        (0, globals_1.it)('should have roughly equal distribution over many iterations', () => {
            const iterations = 10000;
            let blackCount = 0;
            for (let i = 0; i < iterations; i++) {
                if ((0, __1.randomBackgammonColor)() === 'black') {
                    blackCount++;
                }
            }
            const ratio = blackCount / iterations;
            (0, globals_1.expect)(ratio).toBeGreaterThan(0.45);
            (0, globals_1.expect)(ratio).toBeLessThan(0.55);
        });
    });
    (0, globals_1.describe)('randomBackgammonDirection', () => {
        (0, globals_1.it)('should return either clockwise or counterclockwise', () => {
            const result = (0, __1.randomBackgammonDirection)();
            (0, globals_1.expect)(['clockwise', 'counterclockwise']).toContain(result);
        });
        (0, globals_1.it)('should have roughly equal distribution over many iterations', () => {
            const iterations = 10000;
            let clockwiseCount = 0;
            for (let i = 0; i < iterations; i++) {
                if ((0, __1.randomBackgammonDirection)() === 'clockwise') {
                    clockwiseCount++;
                }
            }
            const ratio = clockwiseCount / iterations;
            (0, globals_1.expect)(ratio).toBeGreaterThan(0.45);
            (0, globals_1.expect)(ratio).toBeLessThan(0.55);
        });
    });
    (0, globals_1.describe)('isValidUuid', () => {
        (0, globals_1.it)('should return true for valid UUIDs', () => {
            const validUuids = [
                '123e4567-e89b-12d3-a456-426614174000',
                'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                'ffffffff-ffff-4fff-8fff-ffffffffffff',
                '00000000-0000-4000-8000-000000000000',
            ];
            validUuids.forEach((uuid) => {
                (0, globals_1.expect)((0, __1.isValidUuid)(uuid)).toBe(true);
            });
        });
        (0, globals_1.it)('should return false for invalid UUIDs', () => {
            const invalidUuids = [
                '',
                'not-a-uuid',
                '123e4567-e89b-12d3-a456', // too short
                '123e4567-e89b-12d3-a456-4266141740000', // too long
                '123e4567-e89b-02d3-a456-426614174000', // invalid version
                '123e4567-e89b-42d3-7456-426614174000', // invalid variant
                '123e4567-e89b-42d3-a456_426614174000', // invalid separator
                'g23e4567-e89b-42d3-a456-426614174000', // invalid character
            ];
            invalidUuids.forEach((uuid) => {
                (0, globals_1.expect)((0, __1.isValidUuid)(uuid)).toBe(false);
            });
        });
    });
});
