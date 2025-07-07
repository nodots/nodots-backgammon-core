import { describe, expect, it } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'

describe('Position 24 Fix Tests', () => {
  it('should find possible moves from position 24 for clockwise player', () => {
    const board = Board.initialize()
    const clockwisePlayer = Player.initialize(
      'black',
      'clockwise',
      undefined,
      undefined,
      undefined,
      false
    )

    // Test Board.getPossibleMoves for position 24
    const possibleMoves = Board.getPossibleMoves(board, clockwisePlayer, 1)

    // Filter for moves from position 24
    const movesFromPosition24 = possibleMoves.filter(
      (move) =>
        move.origin.kind === 'point' && move.origin.position.clockwise === 24
    )

    // Should find moves from position 24 (24 - 1 = 23)
    expect(movesFromPosition24.length).toBeGreaterThan(0)

    if (movesFromPosition24.length > 0) {
      const move = movesFromPosition24[0]
      expect(move.destination.kind).toBe('point')
      if (move.destination.kind === 'point') {
        expect(move.destination.position.clockwise).toBe(23)
      }
    }
  })

  it('should find possible moves from position 8 for counterclockwise player', () => {
    const board = Board.initialize()
    const counterclockwisePlayer = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      undefined,
      undefined,
      false
    )

    // Test Board.getPossibleMoves for position 8 (counterclockwise)
    // In default setup, counterclockwise player has checkers at counterclockwise position 8 (their 17-point)
    const possibleMoves = Board.getPossibleMoves(
      board,
      counterclockwisePlayer,
      1
    )

    // Filter for moves from position 8 (counterclockwise) - this is their 17-point
    const movesFromPosition8 = possibleMoves.filter(
      (move) =>
        move.origin.kind === 'point' &&
        move.origin.position.counterclockwise === 8
    )

    // Should find moves from position 8 (8 - 1 = 7)
    expect(movesFromPosition8.length).toBeGreaterThan(0)

    if (movesFromPosition8.length > 0) {
      const move = movesFromPosition8[0]
      expect(move.destination.kind).toBe('point')
      if (move.destination.kind === 'point') {
        // Counterclockwise player moves from position 8 to position 7 (8 - 1 = 7)
        expect(move.destination.position.counterclockwise).toBe(7)
      }
    }
  })

  it('should verify clockwise movement direction (24→23, 8→7, 6→5, 13→12)', () => {
    const board = Board.initialize()
    const clockwisePlayer = Player.initialize(
      'white',
      'clockwise',
      undefined,
      undefined,
      undefined,
      false
    )

    const testCases = [
      { from: 24, to: 23 },
      { from: 8, to: 7 },
      { from: 6, to: 5 },
      { from: 13, to: 12 },
    ]

    testCases.forEach(({ from, to }) => {
      const possibleMoves = Board.getPossibleMoves(board, clockwisePlayer, 1)
      const movesFromPosition = possibleMoves.filter(
        (move) =>
          move.origin.kind === 'point' &&
          move.origin.position.clockwise === from
      )

      if (movesFromPosition.length > 0) {
        const move = movesFromPosition[0]
        expect(move.destination.kind).toBe('point')
        if (move.destination.kind === 'point') {
          expect(move.destination.position.clockwise).toBe(to)
        }
      }
    })
  })

  it('should verify counterclockwise movement direction (8→7, 6→5)', () => {
    const board = Board.initialize()
    const counterclockwisePlayer = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      undefined,
      undefined,
      false
    )

    // Use actual counterclockwise positions for counterclockwise player: 6, 8
    // All players move by subtracting die value (position - die = destination)
    // Note: position 13 is blocked by white checkers, so not tested here
    const testCases = [
      { from: 8, to: 7 }, // From their 17-point to their 16-point (8 - 1 = 7)
      { from: 6, to: 5 }, // From their 19-point to their 18-point (6 - 1 = 5)
    ]

    testCases.forEach(({ from, to }) => {
      const possibleMoves = Board.getPossibleMoves(
        board,
        counterclockwisePlayer,
        1
      )
      const movesFromPosition = possibleMoves.filter(
        (move) =>
          move.origin.kind === 'point' &&
          move.origin.position.counterclockwise === from
      )

      if (movesFromPosition.length > 0) {
        const move = movesFromPosition[0]
        expect(move.destination.kind).toBe('point')
        if (move.destination.kind === 'point') {
          expect(move.destination.position.counterclockwise).toBe(to)
        }
      }
    })
  })
})
