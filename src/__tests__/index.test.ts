import { describe, it, expect } from '@jest/globals'
import {
  randomBoolean,
  randomBackgammonColor,
  randomBackgammonDirection,
  isValidUuid,
} from '..'

describe('Root utilities', () => {
  describe('randomBoolean', () => {
    it('should return a boolean value', () => {
      const result = randomBoolean()
      expect(typeof result).toBe('boolean')
    })

    it('should have roughly equal distribution over many iterations', () => {
      const iterations = 10000
      let trueCount = 0

      for (let i = 0; i < iterations; i++) {
        if (randomBoolean()) {
          trueCount++
        }
      }

      const ratio = trueCount / iterations
      expect(ratio).toBeGreaterThan(0.45) // Allow for some randomness
      expect(ratio).toBeLessThan(0.55)
    })
  })

  describe('randomBackgammonColor', () => {
    it('should return either black or white', () => {
      const result = randomBackgammonColor()
      expect(['black', 'white']).toContain(result)
    })

    it('should have roughly equal distribution over many iterations', () => {
      const iterations = 10000
      let blackCount = 0

      for (let i = 0; i < iterations; i++) {
        if (randomBackgammonColor() === 'black') {
          blackCount++
        }
      }

      const ratio = blackCount / iterations
      expect(ratio).toBeGreaterThan(0.45)
      expect(ratio).toBeLessThan(0.55)
    })
  })

  describe('randomBackgammonDirection', () => {
    it('should return either clockwise or counterclockwise', () => {
      const result = randomBackgammonDirection()
      expect(['clockwise', 'counterclockwise']).toContain(result)
    })

    it('should have roughly equal distribution over many iterations', () => {
      const iterations = 10000
      let clockwiseCount = 0

      for (let i = 0; i < iterations; i++) {
        if (randomBackgammonDirection() === 'clockwise') {
          clockwiseCount++
        }
      }

      const ratio = clockwiseCount / iterations
      expect(ratio).toBeGreaterThan(0.45)
      expect(ratio).toBeLessThan(0.55)
    })
  })

  describe('isValidUuid', () => {
    it('should return true for valid UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'ffffffff-ffff-4fff-8fff-ffffffffffff',
        '00000000-0000-4000-8000-000000000000',
      ]

      validUuids.forEach((uuid) => {
        expect(isValidUuid(uuid)).toBe(true)
      })
    })

    it('should return false for invalid UUIDs', () => {
      const invalidUuids = [
        '',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-02d3-a456-426614174000', // invalid version
        '123e4567-e89b-42d3-7456-426614174000', // invalid variant
        '123e4567-e89b-42d3-a456_426614174000', // invalid separator
        'g23e4567-e89b-42d3-a456-426614174000', // invalid character
      ]

      invalidUuids.forEach((uuid) => {
        expect(isValidUuid(uuid)).toBe(false)
      })
    })
  })
})
