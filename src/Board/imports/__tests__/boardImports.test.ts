import { BOARD_IMPORT_DEFAULT } from '../BOARD_IMPORT_DEFAULT'
import { BOARD_IMPORT_BOTH_REENTER } from '../BOARD_IMPORT_BOTH_REENTER'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../BOARD_IMPORT_BOTH_BEAROFF'
import {
  BackgammonCheckerContainerImport,
  BackgammonCheckerContainerPosition,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types'

describe('Board Imports', () => {
  const validateBoardImport = (
    boardImport: BackgammonCheckerContainerImport[]
  ) => {
    // Check that all checkers have valid colors
    boardImport.forEach((container) => {
      expect(['white', 'black']).toContain(container.checkers.color)
      expect(container.checkers.qty).toBeGreaterThan(0)
    })

    // Check that positions are valid
    boardImport.forEach((container) => {
      if (container.position === 'bar') {
        expect(['clockwise', 'counterclockwise']).toContain(container.direction)
      } else if (typeof container.position === 'object') {
        expect(container.position.clockwise).toBeGreaterThanOrEqual(1)
        expect(container.position.clockwise).toBeLessThanOrEqual(24)
        expect(container.position.counterclockwise).toBeGreaterThanOrEqual(1)
        expect(container.position.counterclockwise).toBeLessThanOrEqual(24)
        // Check that positions are correctly mirrored
        expect(
          container.position.clockwise + container.position.counterclockwise
        ).toBe(25)
      }
    })
  }

  const isPointPosition = (
    position: BackgammonCheckerContainerPosition
  ): position is BackgammonPoint['position'] => {
    return (
      typeof position === 'object' &&
      'clockwise' in position &&
      'counterclockwise' in position
    )
  }

  describe('BOARD_IMPORT_DEFAULT', () => {
    it('should have valid structure and positions', () => {
      validateBoardImport(BOARD_IMPORT_DEFAULT)
    })

    it('should have correct number of checkers for each player', () => {
      const whiteCheckers = BOARD_IMPORT_DEFAULT.reduce(
        (sum, container) =>
          container.checkers.color === 'white'
            ? sum + container.checkers.qty
            : sum,
        0
      )
      const blackCheckers = BOARD_IMPORT_DEFAULT.reduce(
        (sum, container) =>
          container.checkers.color === 'black'
            ? sum + container.checkers.qty
            : sum,
        0
      )

      expect(whiteCheckers).toBe(15)
      expect(blackCheckers).toBe(15)
    })

    it('should have correct initial positions', () => {
      const positions = BOARD_IMPORT_DEFAULT.map((container) =>
        isPointPosition(container.position)
          ? container.position.clockwise
          : null
      )
      expect(positions).toContain(1) // 2 checkers
      expect(positions).toContain(12) // 5 checkers
      expect(positions).toContain(17) // 3 checkers
      expect(positions).toContain(19) // 5 checkers
    })
  })

  describe('BOARD_IMPORT_BOTH_REENTER', () => {
    it('should have valid structure and positions', () => {
      validateBoardImport(BOARD_IMPORT_BOTH_REENTER)
    })

    it('should have checkers on the bar', () => {
      const barCheckers = BOARD_IMPORT_BOTH_REENTER.filter(
        (container) => container.position === 'bar'
      )

      expect(barCheckers).toHaveLength(2)
      expect(barCheckers[0].checkers.qty).toBe(2)
      expect(barCheckers[1].checkers.qty).toBe(2)
      expect(barCheckers[0].direction).toBeDefined()
      expect(barCheckers[1].direction).toBeDefined()
    })

    it('should have correct number of checkers for each player', () => {
      const whiteCheckers = BOARD_IMPORT_BOTH_REENTER.reduce(
        (sum, container) =>
          container.checkers.color === 'white'
            ? sum + container.checkers.qty
            : sum,
        0
      )
      const blackCheckers = BOARD_IMPORT_BOTH_REENTER.reduce(
        (sum, container) =>
          container.checkers.color === 'black'
            ? sum + container.checkers.qty
            : sum,
        0
      )

      expect(whiteCheckers).toBe(15)
      expect(blackCheckers).toBe(16) // One extra black checker on point 24 for testing hitting
    })

    it('should have correct total number of checkers including bar', () => {
      const totalCheckers = BOARD_IMPORT_BOTH_REENTER.reduce(
        (sum, container) => sum + container.checkers.qty,
        0
      )
      expect(totalCheckers).toBe(31) // 15 white + 16 black checkers
    })
  })

  describe('BOARD_IMPORT_BOTH_BEAROFF', () => {
    it('should have valid structure and positions', () => {
      validateBoardImport(BOARD_IMPORT_BOTH_BEAROFF)
    })

    it('should have checkers in home board positions', () => {
      const homePositions = BOARD_IMPORT_BOTH_BEAROFF.filter(
        (container) =>
          isPointPosition(container.position) &&
          (container.position.clockwise <= 6 ||
            container.position.clockwise >= 19)
      )

      expect(homePositions.length).toBeGreaterThan(0)
    })

    it('should have correct number of checkers for each player', () => {
      const whiteCheckers = BOARD_IMPORT_BOTH_BEAROFF.reduce(
        (sum, container) =>
          container.checkers.color === 'white'
            ? sum + container.checkers.qty
            : sum,
        0
      )
      const blackCheckers = BOARD_IMPORT_BOTH_BEAROFF.reduce(
        (sum, container) =>
          container.checkers.color === 'black'
            ? sum + container.checkers.qty
            : sum,
        0
      )

      expect(whiteCheckers).toBe(15)
      expect(blackCheckers).toBe(15)
    })

    it('should have checkers only in home boards', () => {
      BOARD_IMPORT_BOTH_BEAROFF.forEach((container) => {
        if (isPointPosition(container.position)) {
          if (container.checkers.color === 'white') {
            expect(container.position.clockwise).toBeLessThanOrEqual(6)
          } else if (container.checkers.color === 'black') {
            expect(container.position.clockwise).toBeGreaterThanOrEqual(19)
          }
        }
      })
    })

    it('should have correct distribution of checkers in home boards', () => {
      const whiteHomeBoard = BOARD_IMPORT_BOTH_BEAROFF.filter(
        (container) =>
          isPointPosition(container.position) &&
          container.position.clockwise <= 6 &&
          container.checkers.color === 'white'
      )

      const blackHomeBoard = BOARD_IMPORT_BOTH_BEAROFF.filter(
        (container) =>
          isPointPosition(container.position) &&
          container.position.clockwise >= 19 &&
          container.checkers.color === 'black'
      )

      expect(whiteHomeBoard.length).toBe(4) // Checkers on points 1-4
      expect(blackHomeBoard.length).toBe(5) // Checkers on points 21-24 (24 has two entries)

      // Check specific points have correct number of checkers
      const point1 = whiteHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 1
      )
      expect(point1?.checkers.qty).toBe(4)

      const point2 = whiteHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 2
      )
      expect(point2?.checkers.qty).toBe(4)

      const point3 = whiteHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 3
      )
      expect(point3?.checkers.qty).toBe(4)

      const point4 = whiteHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 4
      )
      expect(point4?.checkers.qty).toBe(3)

      const point21 = blackHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 21
      )
      expect(point21?.checkers.qty).toBe(3)

      const point22 = blackHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 22
      )
      expect(point22?.checkers.qty).toBe(4)

      const point23 = blackHomeBoard.find(
        (c) => isPointPosition(c.position) && c.position.clockwise === 23
      )
      expect(point23?.checkers.qty).toBe(4)

      const point24Entries = blackHomeBoard.filter(
        (c) => isPointPosition(c.position) && c.position.clockwise === 24
      )
      expect(point24Entries.length).toBe(2)
      const totalPoint24Checkers = point24Entries.reduce(
        (sum, entry) => sum + entry.checkers.qty,
        0
      )
      expect(totalPoint24Checkers).toBe(4) // Two entries with 2 checkers each
    })
  })
})
