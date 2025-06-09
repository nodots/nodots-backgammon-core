import { describe, expect, it } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonPointValue,
} from '@nodots-llc/backgammon-types/dist'
import { Board } from '..'
import { ascii } from '../ascii'

describe('ascii', () => {
  it('should display an empty board correctly', () => {
    const board = Board.initialize([])
    const display = ascii(board)

    // Verify board structure
    expect(display).toContain('+-13-14-15-16-17-18--------19-20-21-22-23-24-+')
    expect(display).toContain('+-12-11-10--9-8--7--------6--5--4--3--2--1--+')
    expect(display).toContain('|BAR|')

    // Verify empty points
    expect(display.match(/   /g)?.length).toBeGreaterThan(0) // Should have empty spaces

    // Verify initial bar and off counts
    expect(display).toContain('BLACK BAR: 0')
    expect(display).toContain('WHITE BAR: 0')
    expect(display).toContain('BLACK OFF: 0')
    expect(display).toContain('WHITE OFF: 0')
  })

  it('should display checkers with correct symbols', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: 'black' },
      },
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 2, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Check for black checkers (X)
    expect(display).toMatch(/ X /)
    // Check for white checkers (O)
    expect(display).toMatch(/ O /)
  })

  it('should display checkers on bar correctly', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'bar',
        direction: 'clockwise',
        checkers: { qty: 3, color: 'white' },
      },
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 2, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    expect(display).toContain('BLACK BAR: 2')
    expect(display).toContain('WHITE BAR: 3')
  })

  it('should display checkers in off position correctly', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'off',
        direction: 'clockwise',
        checkers: { qty: 4, color: 'white' },
      },
      {
        position: 'off',
        direction: 'counterclockwise',
        checkers: { qty: 5, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    expect(display).toContain('BLACK OFF: 5')
    expect(display).toContain('WHITE OFF: 4')
  })

  it('should display stacked checkers correctly', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 5, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should show 5 X symbols stacked vertically
    const lines = display.split('\n')
    let xCount = 0
    for (const line of lines) {
      if (line.includes(' X ')) xCount++
    }
    expect(xCount).toBe(5)
  })

  it('should display a full game board correctly', () => {
    const board = Board.initialize() // Uses default board setup
    const display = ascii(board)

    // Verify initial setup positions
    expect(display).toBeDefined()
    expect(display.length).toBeGreaterThan(0)

    // Check for standard starting position elements
    expect(display).toContain('BLACK BAR: 0')
    expect(display).toContain('WHITE BAR: 0')
    expect(display).toContain('BLACK OFF: 0')
    expect(display).toContain('WHITE OFF: 0')
  })

  it('should handle maximum checkers per point', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 15, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should only display up to 5 checkers vertically
    const lines = display.split('\n')
    let oCount = 0
    for (const line of lines) {
      if (line.includes(' O ')) oCount++
    }
    expect(oCount).toBe(5) // Maximum visible checkers
  })

  it('should display multiple checkers on bar correctly', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'bar',
        direction: 'clockwise',
        checkers: { qty: 3, color: 'black' },
      },
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 2, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Check that bar section shows checkers
    const lines = display.split('\n')
    // Look for black checkers in the top half (clockwise)
    const hasBlackCheckers = lines
      .slice(0, 6)
      .some((line) => line.includes('| X |'))
    // Look for white checkers in the bottom half (counterclockwise)
    const hasWhiteCheckers = lines
      .slice(7)
      .some((line) => line.includes('| O |'))

    expect(hasBlackCheckers).toBe(true)
    expect(hasWhiteCheckers).toBe(true)
    expect(display).toContain('BLACK BAR: 3')
    expect(display).toContain('WHITE BAR: 2')
  })

  it('should display mixed color checkers in off position correctly', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'off',
        direction: 'clockwise',
        checkers: { qty: 5, color: 'black' },
      },
      {
        position: 'off',
        direction: 'counterclockwise',
        checkers: { qty: 5, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Verify total counts for each color in off position
    expect(display).toContain('BLACK OFF: 5')
    expect(display).toContain('WHITE OFF: 5')
  })

  it('should handle points with maximum number of checkers', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 15, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should still only show 5 checkers vertically even with 15 checkers on the point
    const lines = display.split('\n')
    let xCount = 0
    for (const line of lines) {
      if (line.includes(' X ')) xCount++
    }
    expect(xCount).toBe(5)

    // Should show all checkers in the total count
    expect(display).toContain('BLACK BAR: 0')
    expect(display).toContain('BLACK OFF: 0')
  })

  it('should handle points with mixed color checkers', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 2, color: 'black' },
      },
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 1, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should show both black and white checkers on the same point
    const lines = display.split('\n')
    const point13Lines = lines.filter(
      (line) =>
        line.includes('|') && (line.includes(' X ') || line.includes(' O '))
    )
    expect(point13Lines.length).toBeGreaterThan(0)
  })

  it('should handle checkers on all points', () => {
    const boardImport: BackgammonCheckerContainerImport[] = Array.from(
      { length: 24 },
      (_, i) => ({
        position: {
          clockwise: (i + 1) as BackgammonPointValue,
          counterclockwise: (24 - i) as BackgammonPointValue,
        },
        checkers: { qty: 1, color: i % 2 === 0 ? 'black' : 'white' },
      })
    )
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should show alternating black and white checkers on all points
    const lines = display.split('\n').filter((line) => line.includes('|'))
    const hasCheckers = lines.some(
      (line) => line.includes(' X ') || line.includes(' O ')
    )
    expect(hasCheckers).toBe(true)
  })

  it('should handle empty points between occupied points', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 1, color: 'black' },
      },
      {
        position: { clockwise: 15, counterclockwise: 10 },
        checkers: { qty: 1, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should show empty spaces between checkers
    const lines = display.split('\n')
    const hasEmptySpaces = lines.some(
      (line) => line.includes(' X ') && line.includes('   ')
    )
    expect(hasEmptySpaces).toBe(true)
  })

  it('should handle maximum checkers on bar', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'bar',
        direction: 'clockwise',
        checkers: { qty: 15, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should show bar checkers and correct count
    const lines = display.split('\n')
    const barLines = lines.filter(
      (line) => line.includes('|') && line.includes('X')
    )
    expect(barLines.length).toBeGreaterThan(0)
    expect(display).toContain('BLACK BAR: 15')
  })

  it('should handle invalid point numbers gracefully', () => {
    // This test verifies that the ascii display handles points outside the valid range
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 25 as any, counterclockwise: 0 as any },
        checkers: { qty: 1, color: 'black' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Should still produce a valid board display
    expect(display).toContain('+-13-14-15-16-17-18--------19-20-21-22-23-24-+')
    expect(display).toContain('+-12-11-10--9-8--7--------6--5--4--3--2--1--+')
  })

  it('should handle undefined or null checker properties', () => {
    const board = Board.initialize([])
    // @ts-ignore - Intentionally testing undefined case
    board.off.clockwise.checkers[0] = { color: undefined }
    // @ts-ignore - Intentionally testing null case
    board.off.counterclockwise.checkers[0] = { color: null }

    const display = ascii(board)

    // Should not crash and should display empty spaces
    expect(display).toBeDefined()
    expect(display.length).toBeGreaterThan(0)
    expect(display).toContain('BLACK OFF: 0')
    expect(display).toContain('WHITE OFF: 0')
  })

  it('should handle empty spaces between occupied points', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 1, color: 'black' },
      },
      {
        position: { clockwise: 16, counterclockwise: 9 },
        checkers: { qty: 1, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Check for empty spaces between points
    const lines = display.split('\n')
    const emptyPointLine = lines.find(
      (line) => line.includes('   ') && line.startsWith(' |')
    )
    expect(emptyPointLine).toBeDefined()
  })

  it('should handle off position with maximum checkers', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'off',
        direction: 'clockwise',
        checkers: { qty: 15, color: 'black' },
      },
      {
        position: 'off',
        direction: 'counterclockwise',
        checkers: { qty: 15, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    expect(display).toContain('BLACK OFF: 15')
    expect(display).toContain('WHITE OFF: 15')
  })

  it('should handle mixed colors in off position', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'off',
        direction: 'clockwise',
        checkers: { qty: 5, color: 'black' },
      },
      {
        position: 'off',
        direction: 'counterclockwise',
        checkers: { qty: 5, color: 'white' },
      },
    ]
    const board = Board.initialize(boardImport)
    const display = ascii(board)

    // Verify total counts for each color in off position
    expect(display).toContain('BLACK OFF: 5')
    expect(display).toContain('WHITE OFF: 5')
  })
})
