import {
  findMatchingHint,
  findMatchingHintOrdered,
  findMatchingHintUnordered,
  findMatchingHintSubset,
  areSimplifiedMovesIndependent,
  SimplifiedMove,
} from '../MoveComparator'
import type { MoveHint } from '@nodots-llc/gnubg-hints'

describe('MoveComparator', () => {
  describe('areSimplifiedMovesIndependent', () => {
    it('should return true for empty sequence', () => {
      expect(areSimplifiedMovesIndependent([])).toBe(true)
    })

    it('should return true for single move', () => {
      expect(areSimplifiedMovesIndependent([{ from: 8, to: 3 }])).toBe(true)
    })

    it('should return true for independent moves (no overlaps)', () => {
      // 8/3 6/3 - different sources, same destination is NOT independent
      // 8/3 6/1 - different sources, different destinations is independent
      expect(areSimplifiedMovesIndependent([
        { from: 8, to: 3 },
        { from: 6, to: 1 },
      ])).toBe(true)
    })

    it('should return false when same destination', () => {
      // 8/3 6/3 - both landing on 3
      expect(areSimplifiedMovesIndependent([
        { from: 8, to: 3 },
        { from: 6, to: 3 },
      ])).toBe(false)
    })

    it('should return true when same source with different destinations', () => {
      // 8/3 8/5 - both from 8 to different places
      // This IS independent - just moving two different checkers from same point
      expect(areSimplifiedMovesIndependent([
        { from: 8, to: 3 },
        { from: 8, to: 5 },
      ])).toBe(true)
    })

    it('should return true for identical moves repeated (doubles)', () => {
      // 13/7 13/7 13/7 - same move repeated with doubles
      expect(areSimplifiedMovesIndependent([
        { from: 13, to: 7 },
        { from: 13, to: 7 },
        { from: 13, to: 7 },
      ])).toBe(true)
    })

    it('should return true for identical moves plus independent move', () => {
      // 13/7 13/7 13/7 22/16 - three identical plus one independent
      expect(areSimplifiedMovesIndependent([
        { from: 13, to: 7 },
        { from: 13, to: 7 },
        { from: 13, to: 7 },
        { from: 22, to: 16 },
      ])).toBe(true)
    })

    it('should return false for chained moves (dest = source)', () => {
      // 8/5 5/3 - first lands where second starts
      expect(areSimplifiedMovesIndependent([
        { from: 8, to: 5 },
        { from: 5, to: 3 },
      ])).toBe(false)
    })
  })

  describe('findMatchingHintOrdered', () => {
    const createHint = (moves: SimplifiedMove[], equity: number): MoveHint => ({
      moves: moves.map(m => ({
        from: m.from,
        to: m.to,
        player: 'white',
        moveKind: 'point-to-point',
        fromContainer: 'point',
        toContainer: 'point',
        isHit: false,
      })),
      equity,
      rank: 1,
      difference: 0,
    })

    it('should find exact ordered match', () => {
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5),
        createHint([{ from: 8, to: 3 }, { from: 6, to: 3 }], 0.4),
      ]

      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]
      const result = findMatchingHintOrdered(hints, playerMove)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.4)
    })

    it('should not match when order differs', () => {
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5),
      ]

      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]
      const result = findMatchingHintOrdered(hints, playerMove)

      expect(result).toBeUndefined()
    })
  })

  describe('findMatchingHintUnordered', () => {
    const createHint = (moves: SimplifiedMove[], equity: number): MoveHint => ({
      moves: moves.map(m => ({
        from: m.from,
        to: m.to,
        player: 'white',
        moveKind: 'point-to-point',
        fromContainer: 'point',
        toContainer: 'point',
        isHit: false,
      })),
      equity,
      rank: 1,
      difference: 0,
    })

    it('should match moves regardless of order', () => {
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 5 }], 0.5),
      ]

      const playerMove = [{ from: 8, to: 5 }, { from: 6, to: 3 }]
      const result = findMatchingHintUnordered(hints, playerMove)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.5)
    })

    it('should handle duplicate move values', () => {
      // Two moves to the same point (if allowed)
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5),
      ]

      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]
      const result = findMatchingHintUnordered(hints, playerMove)

      expect(result).toBeDefined()
    })
  })

  describe('findMatchingHint', () => {
    const createHint = (moves: SimplifiedMove[], equity: number): MoveHint => ({
      moves: moves.map(m => ({
        from: m.from,
        to: m.to,
        player: 'white',
        moveKind: 'point-to-point',
        fromContainer: 'point',
        toContainer: 'point',
        isHit: false,
      })),
      equity,
      rank: 1,
      difference: 0,
    })

    it('should find ordered match first', () => {
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5),
        createHint([{ from: 8, to: 3 }, { from: 6, to: 3 }], 0.4),
      ]

      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]
      const result = findMatchingHint(hints, playerMove)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.4)
    })

    it('should fall back to unordered match for independent moves', () => {
      // Only one hint, with different order
      const hints = [
        createHint([{ from: 6, to: 1 }, { from: 8, to: 3 }], 0.5),
      ]

      // Player played in reverse order (independent moves)
      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 1 }]
      const result = findMatchingHint(hints, playerMove)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.5)
    })

    it('should NOT do unordered match for dependent moves (same destination)', () => {
      // Moves to same point - order could matter if there's a hit
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5),
      ]

      // Player played different order - but these are NOT independent (same dest)
      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]

      // areSimplifiedMovesIndependent([{ from: 8, to: 3 }, { from: 6, to: 3 }]) = false
      // because both go to 3
      // So it will only try ordered match, which fails
      // Then it checks independence - fails - so no unordered match
      const result = findMatchingHint(hints, playerMove)

      // Should still match because unordered check uses same-dest detection
      // Wait - same dest means NOT independent, so no unordered match
      // This should be undefined
      expect(result).toBeUndefined()
    })

    it('should handle the 8/3 6/3 vs 6/3 8/3 case correctly', () => {
      // This is the bug scenario from the issue
      // Player played: 8/3 6/3
      // Best move: 6/3 8/3
      // These moves land on the same destination (3), so they're NOT independent
      // Order matters because the second checker is the one that makes the point

      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 3 }], 0.5), // Best
        createHint([{ from: 8, to: 3 }, { from: 6, to: 3 }], 0.5), // Same equity
      ]

      const playerMove = [{ from: 8, to: 3 }, { from: 6, to: 3 }]
      const result = findMatchingHint(hints, playerMove)

      // Since both moves land on 3, they are NOT independent
      // So we only try ordered match - which should find the second hint
      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.5)
    })

    it('real scenario: moves that ARE independent should match unordered', () => {
      // Player played: 13/8 6/1
      // Best move: 6/1 13/8
      // These go to different destinations, so order doesn't matter

      const hints = [
        createHint([{ from: 6, to: 1 }, { from: 13, to: 8 }], 0.5), // Best
      ]

      const playerMove = [{ from: 13, to: 8 }, { from: 6, to: 1 }]
      const result = findMatchingHint(hints, playerMove)

      // Independent moves - should match via unordered
      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.5)
    })

    it('same-source scenario: 6/2 6/5 should match 6/5 6/2', () => {
      // Real bug scenario: moves from same point to different destinations
      // Player played: 6/2 6/5
      // Hint #2: 6/5 6/2
      // These are equivalent - just moving two checkers from point 6

      const hints = [
        createHint([{ from: 3, to: 2 }, { from: 8, to: 4 }], -0.191), // Best
        createHint([{ from: 6, to: 5 }, { from: 6, to: 2 }], -0.328), // #2
      ]

      const playerMove = [
        { from: 6, to: 2 },
        { from: 6, to: 5 },
      ]
      const result = findMatchingHint(hints, playerMove)

      // Should match hint #2 - same moves just reordered
      expect(result).toBeDefined()
      expect(result?.equity).toBe(-0.328)
    })

    it('doubles scenario: 13/7 13/7 13/7 22/16 should match 22/16 13/7 13/7 13/7', () => {
      // Real bug scenario: player rolled 6-6
      // Player played: 13/7 13/7 13/7 22/16
      // Best move: 22/16 13/7 13/7 13/7
      // These are functionally identical - same final position

      const hints = [
        createHint([
          { from: 22, to: 16 },
          { from: 13, to: 7 },
          { from: 13, to: 7 },
          { from: 13, to: 7 },
        ], 0.362),
      ]

      const playerMove = [
        { from: 13, to: 7 },
        { from: 13, to: 7 },
        { from: 13, to: 7 },
        { from: 22, to: 16 },
      ]
      const result = findMatchingHint(hints, playerMove)

      // Should match - identical moves just reordered
      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.362)
    })
  })

  describe('findMatchingHintSubset (partial plays)', () => {
    const createHint = (moves: SimplifiedMove[], equity: number): MoveHint => ({
      moves: moves.map(m => ({
        from: m.from,
        to: m.to,
        player: 'white',
        moveKind: 'point-to-point',
        fromContainer: 'point',
        toContainer: 'point',
        isHit: false,
      })),
      equity,
      rank: 1,
      difference: 0,
    })

    it('should match 3 of 4 doubles moves as subset', () => {
      // Hint returns 4-move play for doubles [5,5]
      // Player only used 3 dice (4th was blocked)
      const hints = [
        createHint([
          { from: 0, to: 20 },
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
        ], 0.45),
      ]

      const playerMoves = [
        { from: 0, to: 20 },
        { from: 0, to: 20 },
        { from: 8, to: 3 },
      ]
      const result = findMatchingHintSubset(hints, playerMoves)

      // Player's 3 moves should NOT match: 0->20 appears twice in player
      // but only once in hint
      expect(result).toBeUndefined()
    })

    it('should match when player moves are true subset of hint', () => {
      const hints = [
        createHint([
          { from: 0, to: 20 },
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
        ], 0.45),
      ]

      // Player used 3 of 4 dice with moves that ARE a subset
      const playerMoves = [
        { from: 0, to: 20 },
        { from: 13, to: 8 },
        { from: 8, to: 3 },
      ]
      const result = findMatchingHintSubset(hints, playerMoves)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.45)
    })

    it('should not match when player has moves not in hint', () => {
      const hints = [
        createHint([
          { from: 13, to: 8 },
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
        ], 0.45),
      ]

      const playerMoves = [
        { from: 13, to: 8 },
        { from: 6, to: 1 },  // Not in hint
        { from: 8, to: 3 },
      ]
      const result = findMatchingHintSubset(hints, playerMoves)

      expect(result).toBeUndefined()
    })

    it('should not activate for same-length hints', () => {
      const hints = [
        createHint([{ from: 6, to: 3 }, { from: 8, to: 5 }], 0.5),
      ]

      const playerMoves = [{ from: 6, to: 3 }, { from: 8, to: 5 }]
      const result = findMatchingHintSubset(hints, playerMoves)

      // Same length - subset matching should not apply
      expect(result).toBeUndefined()
    })

    it('should return best (first) matching hint', () => {
      const hints = [
        createHint([
          { from: 13, to: 8 },
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 6, to: 1 },
        ], 0.60),  // Best hint
        createHint([
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
          { from: 6, to: 1 },
        ], 0.55),  // Second best
      ]

      // Player's 3 moves are subset of both hints
      const playerMoves = [
        { from: 13, to: 8 },
        { from: 8, to: 3 },
        { from: 6, to: 1 },
      ]
      const result = findMatchingHintSubset(hints, playerMoves)

      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.60)
    })
  })

  describe('findMatchingHint with partial plays', () => {
    const createHint = (moves: SimplifiedMove[], equity: number): MoveHint => ({
      moves: moves.map(m => ({
        from: m.from,
        to: m.to,
        player: 'white',
        moveKind: 'point-to-point',
        fromContainer: 'point',
        toContainer: 'point',
        isHit: false,
      })),
      equity,
      rank: 1,
      difference: 0,
    })

    it('should match partial play via findMatchingHint main entry', () => {
      // Issue scenario: doubles [5,5], 4-move hints, player used 3 dice
      const hints = [
        createHint([
          { from: 0, to: 20 },
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
        ], 0.45),
      ]

      const playerMoves = [
        { from: 0, to: 20 },
        { from: 13, to: 8 },
        { from: 8, to: 3 },
      ]
      const result = findMatchingHint(hints, playerMoves)

      // Should fall through ordered and unordered, then match via subset
      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.45)
    })

    it('should prefer exact match over subset match', () => {
      const hints = [
        createHint([
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 8, to: 3 },
          { from: 6, to: 1 },
        ], 0.60),  // 4-move hint
        createHint([
          { from: 13, to: 8 },
          { from: 8, to: 3 },
          { from: 6, to: 1 },
        ], 0.40),  // 3-move exact match
      ]

      const playerMoves = [
        { from: 13, to: 8 },
        { from: 8, to: 3 },
        { from: 6, to: 1 },
      ]
      const result = findMatchingHint(hints, playerMoves)

      // Should match the exact 3-move hint, not the 4-move subset
      expect(result).toBeDefined()
      expect(result?.equity).toBe(0.40)
    })
  })
})
