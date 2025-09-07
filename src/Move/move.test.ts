import {
  BackgammonColor,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonPoint,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Move } from '.'
import { generateId } from '..'
import { Board } from '../Board'

describe('Move', () => {
  describe('initialize', () => {
    it('should initialize a move with default values', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        userId: generateId(),
        color: 'black' as BackgammonColor,
        direction: 'clockwise' as BackgammonMoveDirection,
        stateKind: 'rolled',
        pipCount: 167,
        rollForStartValue: 3,
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
      const origin = board.points[0]
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
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
        userId: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        rollForStartValue: 3,
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
        userId: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        rollForStartValue: 3,
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
            isMovable: false,
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return true for point with multiple checkers of same color', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        userId: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        rollForStartValue: 3,
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
            isMovable: false,
          },
          {
            id: generateId(),
            color: 'black',
            checkercontainerId: generateId(),
            isMovable: false,
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return false for point with multiple checkers of different color', () => {
      const player: BackgammonPlayerRolled = {
        id: generateId(),
        userId: generateId(),
        color: 'black',
        direction: 'clockwise',
        stateKind: 'rolled',
        pipCount: 167,
        rollForStartValue: 3,
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
            isMovable: false,
          },
          {
            id: generateId(),
            color: 'white',
            checkercontainerId: generateId(),
            isMovable: false,
          },
        ],
      }

      expect(Move.isPointOpen(point, player)).toBe(false)
    })
  })
})
