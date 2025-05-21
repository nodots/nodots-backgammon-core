import { Board } from '../Board'
import { Move } from '.'
import { generateId } from '..'
import {
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonPoint,
  BackgammonDieValue,
  BackgammonDiceRolled,
  BackgammonRoll,
  BackgammonMoveSkeleton,
  BackgammonMoves,
} from 'nodots-backgammon-types'

describe('Move', () => {
  describe('initialize', () => {
    it('should initialize a move with default values', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        color: 'black' as BackgammonColor,
        direction: 'clockwise' as BackgammonMoveDirection,
        stateKind: 'rolled',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
      }

      const board = Board.initialize()
      const origin = board.BackgammonPoints[0]
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.initialize({ move, origin })

      expect(result.id).toBeDefined()
      expect(result.stateKind).toBe('ready')
      expect(result.player).toBe(player)
      expect(result.dieValue).toBe(1)
      expect(result.origin).toBe(origin)
    })
  })

  describe('isPointOpen', () => {
    it('should return true for empty point', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point' as const,
        position: {
          clockwise: 1,
          counterclockwise: 24,
        },
        checkers: [],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return true for point with one checker of different color', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point' as const,
        position: {
          clockwise: 1,
          counterclockwise: 24,
        },
        checkers: [
          {
            id: generateId(),
            color: 'white',
            checkercontainerId: generateId(),
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return true for point with multiple checkers of same color', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point' as const,
        position: {
          clockwise: 1,
          counterclockwise: 24,
        },
        checkers: [
          {
            id: generateId(),
            color: 'black',
            checkercontainerId: generateId(),
          },
          {
            id: generateId(),
            color: 'black',
            checkercontainerId: generateId(),
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return false for point with multiple checkers of different color', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point' as const,
        position: {
          clockwise: 1,
          counterclockwise: 24,
        },
        checkers: [
          {
            id: generateId(),
            color: 'white',
            checkercontainerId: generateId(),
          },
          {
            id: generateId(),
            color: 'white',
            checkercontainerId: generateId(),
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(false)
    })
  })
})
