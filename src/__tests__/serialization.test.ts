import { describe, expect, it } from '@jest/globals'
import {
  deserializeGameState,
  ensureMovesAreSet,
  serializeGameState,
} from '../utils/serialization'

// Mock move objects for testing serialization
interface MockMove {
  id: string
  origin: string
  destination: string
  dieValue: number
}

describe('Serialization utilities', () => {
  describe('serializeGameState', () => {
    it('should serialize objects without Set objects', () => {
      const simpleObject = { name: 'test', value: 42 }
      const result = serializeGameState(simpleObject)
      expect(result).toBe('{"name":"test","value":42}')
    })

    it('should convert Set objects to arrays during serialization', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 3,
      }
      const move2: MockMove = {
        id: 'move-2',
        origin: 'origin-2',
        destination: 'dest-2',
        dieValue: 5,
      }

      const gameState = {
        activePlay: {
          moves: new Set([move1, move2]),
        },
        otherData: 'test',
      }

      const result = serializeGameState(gameState)
      const parsed = JSON.parse(result)

      expect(Array.isArray(parsed.activePlay.moves)).toBe(true)
      expect(parsed.activePlay.moves).toHaveLength(2)
      expect(parsed.activePlay.moves).toContainEqual(move1)
      expect(parsed.activePlay.moves).toContainEqual(move2)
    })

    it('should handle nested objects with Set objects', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 2,
      }

      const complexState = {
        level1: {
          level2: {
            moves: new Set([move1]),
            other: 'value',
          },
        },
        simple: 'data',
      }

      const result = serializeGameState(complexState)
      const parsed = JSON.parse(result)

      expect(Array.isArray(parsed.level1.level2.moves)).toBe(true)
      expect(parsed.level1.level2.moves).toContainEqual(move1)
      expect(parsed.level1.level2.other).toBe('value')
      expect(parsed.simple).toBe('data')
    })

    it('should handle empty Set objects', () => {
      const gameState = {
        activePlay: {
          moves: new Set(),
        },
      }

      const result = serializeGameState(gameState)
      const parsed = JSON.parse(result)

      expect(Array.isArray(parsed.activePlay.moves)).toBe(true)
      expect(parsed.activePlay.moves).toHaveLength(0)
    })

    it('should handle null and undefined values', () => {
      const gameState = {
        nullValue: null,
        undefinedValue: undefined,
        moves: new Set(['test']),
      }

      const result = serializeGameState(gameState)
      const parsed = JSON.parse(result)

      expect(parsed.nullValue).toBe(null)
      expect(parsed.undefinedValue).toBeUndefined()
      expect(Array.isArray(parsed.moves)).toBe(true)
    })
  })

  describe('deserializeGameState', () => {
    it('should deserialize simple objects', () => {
      const jsonString = '{"name":"test","value":42}'
      const result = deserializeGameState(jsonString) as any

      expect(result).toEqual({ name: 'test', value: 42 })
    })

    it('should reconstruct Set objects from moves arrays', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 4,
      }
      const move2: MockMove = {
        id: 'move-2',
        origin: 'origin-2',
        destination: 'dest-2',
        dieValue: 6,
      }

      const jsonString = JSON.stringify({
        activePlay: {
          moves: [move1, move2],
        },
        otherData: 'test',
      })

      const result = deserializeGameState(jsonString) as any

      expect(result.activePlay.moves).toBeInstanceOf(Set)
      expect(result.activePlay.moves.size).toBe(2)
      expect(Array.from(result.activePlay.moves)).toEqual(
        expect.arrayContaining([move1, move2])
      )
      expect(result.otherData).toBe('test')
    })

    it('should handle nested objects with moves arrays', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 1,
      }

      const jsonString = JSON.stringify({
        level1: {
          level2: {
            moves: [move1],
            other: 'value',
          },
        },
        simple: 'data',
      })

      const result = deserializeGameState(jsonString) as any

      expect(result.level1.level2.moves).toBeInstanceOf(Set)
      expect(result.level1.level2.moves.size).toBe(1)
      expect(Array.from(result.level1.level2.moves)).toEqual([move1])
      expect(result.level1.level2.other).toBe('value')
      expect(result.simple).toBe('data')
    })

    it('should handle empty moves arrays', () => {
      const jsonString = JSON.stringify({
        activePlay: {
          moves: [],
        },
      })

      const result = deserializeGameState(jsonString) as any

      expect(result.activePlay.moves).toBeInstanceOf(Set)
      expect(result.activePlay.moves.size).toBe(0)
    })

    it('should handle arrays that are not moves', () => {
      const jsonString = JSON.stringify({
        regularArray: ['item1', 'item2'],
        activePlay: {
          moves: [],
        },
      })

      const result = deserializeGameState(jsonString) as any

      expect(Array.isArray(result.regularArray)).toBe(true)
      expect(result.regularArray).toEqual(['item1', 'item2'])
      expect(result.activePlay.moves).toBeInstanceOf(Set)
    })

    it('should handle null and primitive values', () => {
      const jsonString = JSON.stringify({
        nullValue: null,
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
      })

      const result = deserializeGameState(jsonString) as any

      expect(result.nullValue).toBe(null)
      expect(result.stringValue).toBe('test')
      expect(result.numberValue).toBe(42)
      expect(result.booleanValue).toBe(true)
    })
  })

  describe('ensureMovesAreSet', () => {
    it('should convert moves array to Set', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 2,
      }
      const move2: MockMove = {
        id: 'move-2',
        origin: 'origin-2',
        destination: 'dest-2',
        dieValue: 4,
      }

      const activePlay = {
        moves: [move1, move2],
        otherProperty: 'value',
      }

      const result = ensureMovesAreSet(activePlay) as any

      expect(result.moves).toBeInstanceOf(Set)
      expect(result.moves.has(move1)).toBe(true)
      expect(result.moves.has(move2)).toBe(true)
      expect(result.otherProperty).toBe('value')
    })

    it('should preserve existing Set objects', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 3,
      }

      const activePlay = {
        moves: new Set([move1]),
        otherProperty: 'value',
      }

      const result = ensureMovesAreSet(activePlay) as any

      expect(result.moves).toBeInstanceOf(Set)
      expect(result.moves.has(move1)).toBe(true)
      expect(result.otherProperty).toBe('value')
    })

    it('should handle null activePlay', () => {
      const result = ensureMovesAreSet(null)
      expect(result).toBe(null)
    })

    it('should handle undefined activePlay', () => {
      const result = ensureMovesAreSet(undefined)
      expect(result).toBe(undefined)
    })

    it('should handle activePlay without moves property', () => {
      const activePlay = {
        otherProperty: 'value',
      }

      const result = ensureMovesAreSet(activePlay) as any

      expect(result).toEqual(activePlay)
      expect(result.otherProperty).toBe('value')
    })

    it('should handle empty moves array', () => {
      const activePlay = {
        moves: [],
        otherProperty: 'value',
      }

      const result = ensureMovesAreSet(activePlay) as any

      expect(result.moves).toBeInstanceOf(Set)
      expect(result.moves.size).toBe(0)
      expect(result.otherProperty).toBe('value')
    })
  })


  describe('round-trip serialization', () => {
    it('should maintain data integrity through serialize-deserialize cycle', () => {
      const move1: MockMove = {
        id: 'move-1',
        origin: 'origin-1',
        destination: 'dest-1',
        dieValue: 2,
      }
      const move2: MockMove = {
        id: 'move-2',
        origin: 'origin-2',
        destination: 'dest-2',
        dieValue: 4,
      }

      const originalState = {
        activePlay: {
          moves: new Set([move1, move2]),
          player: 'test-player',
        },
        otherData: {
          nested: 'value',
        },
      }

      const serialized = serializeGameState(originalState)
      const deserialized = deserializeGameState(serialized) as any

      expect(deserialized.activePlay.moves).toBeInstanceOf(Set)
      expect(deserialized.activePlay.moves.size).toBe(2)
      expect(Array.from(deserialized.activePlay.moves)).toEqual(
        expect.arrayContaining([move1, move2])
      )
      expect(deserialized.activePlay.player).toBe('test-player')
      expect(deserialized.otherData.nested).toBe('value')
    })
  })
})
