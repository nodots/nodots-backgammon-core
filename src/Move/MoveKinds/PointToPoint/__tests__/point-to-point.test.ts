import { describe, it, expect } from '@jest/globals'
import { PointToPoint } from '..'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../../../'
import { Board } from '../../../../Board'
import { BOARD_IMPORT_DEFAULT } from '../../../../Board/imports'
import {
  BackgammonDiceInactive,
  BackgammonDiceStateKind,
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonRoll,
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonDieValue,
} from '@nodots-llc/backgammon-types'

describe('PointToPoint', () => {
  const setupTestData = (
    color: BackgammonColor = 'white',
    direction: BackgammonMoveDirection = 'clockwise',
    dieValue: BackgammonDieValue = 1
  ) => {
    const diceId: string = generateId()
    const board = Board.initialize(BOARD_IMPORT_DEFAULT)
    const currentRoll: BackgammonRoll = [dieValue, 1]
    let dice = Dice.initialize(color) as BackgammonDiceInactive
    const diceStateKind: BackgammonDiceStateKind = 'rolled'
    const rolledDice = {
      ...dice,
      id: diceId,
      stateKind: diceStateKind,
      currentRoll,
      total: 2,
    }
    const player: BackgammonPlayerRolled = {
      id: '1',
      color,
      stateKind: 'rolled',
      dice: rolledDice,
      direction,
      pipCount: 167,
      isRobot: true,
    }

    return { board, player, currentRoll }
  }

  describe('isA', () => {
    it('should return false for move with empty origin point', () => {
      const { board, player } = setupTestData()
      const emptyPoint = board.BackgammonPoints[2] // An empty point

      const move = {
        id: '1',
        player,
        origin: emptyPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      expect(PointToPoint.isA(move)).toBe(false)
    })

    it('should return false for move with wrong color checker', () => {
      const { board, player } = setupTestData('white')
      // Find a point with black checkers
      const originWithBlackChecker = board.BackgammonPoints.find(
        (point) =>
          point.checkers.length > 0 && point.checkers[0].color === 'black'
      )

      const move = {
        id: '1',
        player,
        origin: originWithBlackChecker,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      expect(PointToPoint.isA(move)).toBe(false)
    })

    it('should return false for move without dieValue', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5] // Point with checkers

      const move = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        moveKind: 'point-to-point',
      }

      expect(PointToPoint.isA(move)).toBe(false)
    })

    it('should return valid move for correct point-to-point setup', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5]
      const destination = board.BackgammonPoints[4]

      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      const result = PointToPoint.isA(move)
      expect(result).toBeTruthy()
      if (result) {
        expect(result.stateKind).toBe('in-progress')
        expect(result.moveKind).toBe('point-to-point')
      }
    })

    it('should return false for move with origin.kind not equal to "point"', () => {
      const { board, player } = setupTestData()
      const origin = { ...board.BackgammonPoints[5], kind: 'bar' }
      const move = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      expect(PointToPoint.isA(move)).toBe(false)
    })
  })

  describe('getDestination', () => {
    it('should calculate correct destination for clockwise movement', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5] // Point 6

      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      const destination = PointToPoint.getDestination(board, move)
      expect(destination.position.clockwise).toBe(origin.position.clockwise - 1)
    })

    it('should calculate correct destination for counterclockwise movement', () => {
      const { board, player } = setupTestData('black', 'counterclockwise', 1)
      const origin = board.BackgammonPoints[18] // A point with black checkers

      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      const destination = PointToPoint.getDestination(board, move)
      expect(destination.position.counterclockwise).toBe(
        origin.position.counterclockwise - 1
      )
    })

    it('should throw error if destination point does not exist', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = { ...board.BackgammonPoints[5] }
      // Set up origin so that destination position will not match any point
      origin.position = { ...origin.position, clockwise: 1 }
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 2,
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.getDestination(board, move)).toThrow(
        'Invalid destination point'
      )
    })
  })

  describe('move', () => {
    it('should throw error for invalid board', () => {
      const { player, board } = setupTestData()
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
      }

      expect(() => PointToPoint.move(null as any, move)).toThrow(
        'Invalid board'
      )
    })

    it('should throw error for invalid move', () => {
      const { board } = setupTestData()
      expect(() => PointToPoint.move(board, null as any)).toThrow(
        'Invalid move'
      )
    })

    it('should perform a valid move', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5]
      const initialCheckerCount = origin.checkers.length

      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }

      const result = PointToPoint.move(board, move)
      expect(result.board).toBeTruthy()
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.BackgammonPoints[5].checkers.length).toBe(
        initialCheckerCount - 1
      )
    })

    it('should return a no-move result if destination is blocked by 2+ opponent checkers', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      // Set up destination with 2 black checkers
      const destination = board.BackgammonPoints[4]
      destination.checkers = [
        { color: 'black', id: 'b1', checkercontainerId: destination.id },
        { color: 'black', id: 'b2', checkercontainerId: destination.id },
      ]
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      const result = PointToPoint.move(board, move)
      expect(result.move.moveKind).toBe('no-move')
      expect(result.move.stateKind).toBe('completed')
      expect(result.move.origin).toBeUndefined()
      expect(result.move.destination).toBeUndefined()
      expect(result.move.isHit).toBe(false)
    })

    it('should throw error if destination point is missing after move', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      // Save original moveChecker
      const originalMoveChecker = Board.moveChecker
      // Mock moveChecker to remove the destination point
      Board.moveChecker = (b, o, d, dir) => {
        const dummyPoint = {
          ...(d as any),
          id: 'dummy-id',
          kind: 'point',
          position: { ...(d as any).position },
          checkers: [],
        }
        const updatedPoints = b.BackgammonPoints.map((p) =>
          p.id === d.id ? dummyPoint : p
        )
        return { ...b, BackgammonPoints: updatedPoints } as typeof b
      }
      expect(() => PointToPoint.move(board, move)).toThrow(
        'Could not find destination point after move'
      )
      // Restore original moveChecker
      Board.moveChecker = originalMoveChecker
    })

    it('should hit a blot and send opponent checker to the bar', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      // Set up destination with 1 black checker (a blot)
      const destination = board.BackgammonPoints[4]
      destination.checkers = [
        { color: 'black', id: 'b1', checkercontainerId: destination.id },
      ]
      // Save original moveChecker
      const originalMoveChecker = Board.moveChecker
      // Mock moveChecker to simulate sending the checker to the bar
      Board.moveChecker = (b, o, d, dir) => {
        // Remove checker from destination and add to the correct bar
        const updatedPoints = b.BackgammonPoints.map((p) => {
          if (p.id === d.id) {
            // Place the moving checker (from origin) on the destination
            return {
              ...p,
              checkers: [
                {
                  ...o.checkers[o.checkers.length - 1],
                  checkercontainerId: d.id,
                },
              ],
            }
          }
          return p
        })
        // Add the hit checker to the correct bar (counterclockwise for black)
        const updatedBar = {
          ...b.bar,
          counterclockwise: {
            ...b.bar.counterclockwise,
            checkers: [
              ...b.bar.counterclockwise.checkers,
              {
                color: 'black',
                id: 'b1',
                checkercontainerId: b.bar.counterclockwise.id,
              },
            ],
          },
        }
        return {
          ...b,
          BackgammonPoints: updatedPoints,
          bar: updatedBar,
        } as typeof b
      }
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      const result = PointToPoint.move(board, move)
      expect(result.move.isHit).toBe(true)
      // Restore original moveChecker
      Board.moveChecker = originalMoveChecker
    })

    it('should not allow moving from a point with no checkers', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      // Find an empty point
      const emptyPoint = board.BackgammonPoints.find(
        (p) => p.checkers.length === 0
      )
      expect(emptyPoint).toBeDefined()
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin: emptyPoint!,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      // Should throw via isA or move
      expect(() => PointToPoint.move(board, move)).toThrow()
    })

    it('should allow moving to a point occupied by own checkers', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      const destination = board.BackgammonPoints[4]
      // Set up destination with 2 white checkers
      destination.checkers = [
        { color: 'white', id: 'w1', checkercontainerId: destination.id },
        { color: 'white', id: 'w2', checkercontainerId: destination.id },
      ]
      const initialOriginCount = origin.checkers.length
      const initialDestCount = destination.checkers.length
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      const result = PointToPoint.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.move.destination?.checkers[0].color).toBe('white')
      expect(result.board.BackgammonPoints[5].checkers.length).toBe(
        initialOriginCount - 1
      )
      expect(result.board.BackgammonPoints[4].checkers.length).toBe(
        initialDestCount + 1
      )
    })

    it('should not allow moving to a point blocked by 2+ opponent checkers', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      const destination = board.BackgammonPoints[4]
      // Set up destination with 2 black checkers
      destination.checkers = [
        { color: 'black', id: 'b1', checkercontainerId: destination.id },
        { color: 'black', id: 'b2', checkercontainerId: destination.id },
      ]
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      const result = PointToPoint.move(board, move)
      expect(result.move.moveKind).toBe('no-move')
      expect(result.move.stateKind).toBe('completed')
      expect(result.move.origin).toBeUndefined()
      expect(result.move.destination).toBeUndefined()
      expect(result.move.isHit).toBe(false)
    })

    it('should allow moving to an empty point', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      // Find an empty destination
      const destination = board.BackgammonPoints.find(
        (p) => p.checkers.length === 0
      )!
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: (destination.position.clockwise -
          origin.position.clockwise) as BackgammonDieValue,
        moveKind: 'point-to-point',
      }
      // Adjust dieValue so the move is legal
      move.dieValue = Math.abs(
        origin.position.clockwise - destination.position.clockwise
      ) as BackgammonDieValue
      const result = PointToPoint.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.move.destination?.id).toBe(destination.id)
      expect(result.move.destination?.checkers[0].color).toBe('white')
    })

    it('should not allow moving with dieValue 0 or undefined', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      const origin = board.BackgammonPoints[5]
      // dieValue 0
      const moveZero: any = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 0,
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.move(board, moveZero)).toThrow()
      // dieValue undefined
      const moveUndef: any = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.move(board, moveUndef)).toThrow()
    })

    it('should not allow moving from a point with an opponent checker', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      // Find a point with a black checker
      const origin = board.BackgammonPoints.find(
        (p) => p.checkers.length > 0 && p.checkers[0].color === 'black'
      )!
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.move(board, move)).toThrow()
    })

    it('should not allow moving from a non-point origin (bar or off)', () => {
      const { board, player } = setupTestData('white', 'clockwise', 1)
      // Use the bar as origin
      const barOrigin: any = board.bar.clockwise
      const moveBar: any = {
        id: '1',
        player,
        origin: barOrigin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.move(board, moveBar)).toThrow()
      // Use the off as origin
      const offOrigin: any = board.off.clockwise
      const moveOff: any = {
        id: '1',
        player,
        origin: offOrigin,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
      }
      expect(() => PointToPoint.move(board, moveOff)).toThrow()
    })
  })
})
