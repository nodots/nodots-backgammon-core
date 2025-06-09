import { describe, expect, it } from '@jest/globals'
import {
  BackgammonChecker,
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDiceStateKind,
  BackgammonMoveDirection,
  BackgammonMoveInProgress,
  BackgammonMoveKind,
  BackgammonMoveReady,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
  BackgammonPointValue,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Move } from '..'
import { generateId } from '../..'
import { Board } from '../../Board'
import {
  BOARD_IMPORT_BOTH_REENTER,
  BOARD_IMPORT_DEFAULT,
} from '../../Board/imports'

describe('Move', () => {
  const setupTest = (
    color: BackgammonColor = 'white',
    direction: BackgammonMoveDirection = 'clockwise',
    roll: BackgammonRoll = [1, 1],
    boardImport = BOARD_IMPORT_DEFAULT
  ) => {
    const diceId = generateId()
    const board = Board.initialize(boardImport)
    const diceStateKind: BackgammonDiceStateKind = 'rolled'
    const rolledDice = {
      id: diceId,
      color,
      stateKind: diceStateKind,
      currentRoll: roll,
      total: roll[0] + roll[1],
    }
    const player: BackgammonPlayerRolled = {
      id: generateId(),
      color,
      stateKind: 'rolled',
      dice: rolledDice,
      direction,
      pipCount: 167,
      isRobot: true,
    }
    return { board, player, rolledDice }
  }

  const convertSkeletonToMove = (
    skeleton: BackgammonMoveSkeleton,
    player: BackgammonPlayer,
    moveKind: BackgammonMoveKind
  ): BackgammonMoveReady => ({
    id: generateId(),
    player,
    stateKind: 'ready',
    moveKind,
    origin: skeleton.origin,
    dieValue: skeleton.dieValue,
  })

  describe('initialize', () => {
    it('should initialize a move with provided values', () => {
      const { board, player } = setupTest()
      const moveId = generateId()
      const move: BackgammonMoveReady = {
        id: moveId,
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.initialize({
        move,
        origin: board.BackgammonPoints[0],
      })

      expect(result.id).toBe(moveId)
      expect(result.stateKind).toBe('ready')
      expect(result.origin).toBe(board.BackgammonPoints[0])
    })

    it('should generate id if not provided', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: '',
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.initialize({
        move,
        origin: board.BackgammonPoints[0],
      })

      expect(result.id).toBeDefined()
      expect(result.id.length).toBeGreaterThan(0)
    })

    it('should use default stateKind if not provided', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.initialize({
        move,
        origin: board.BackgammonPoints[0],
      })

      expect(result.stateKind).toBe('ready')
    })
  })

  describe('isPointOpen', () => {
    it('should return true for empty point', () => {
      const { player } = setupTest()
      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point',
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return true for point with one checker of any color', () => {
      const { player } = setupTest('white')
      const whiteChecker: BackgammonChecker = {
        id: generateId(),
        color: 'white',
        checkercontainerId: generateId(),
      }
      const blackChecker: BackgammonChecker = {
        id: generateId(),
        color: 'black',
        checkercontainerId: generateId(),
      }

      const pointWithWhite: BackgammonPoint = {
        id: generateId(),
        kind: 'point',
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [whiteChecker],
      }
      const pointWithBlack: BackgammonPoint = {
        id: generateId(),
        kind: 'point',
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [blackChecker],
      }

      expect(Move.isPointOpen(pointWithWhite, player)).toBe(true)
      expect(Move.isPointOpen(pointWithBlack, player)).toBe(true)
    })

    it('should return true for point with multiple checkers of player color', () => {
      const { player } = setupTest('white')
      const whiteChecker: BackgammonChecker = {
        id: generateId(),
        color: 'white',
        checkercontainerId: generateId(),
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point',
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [whiteChecker, { ...whiteChecker, id: generateId() }],
      }

      expect(Move.isPointOpen(point, player)).toBe(true)
    })

    it('should return false for point with multiple opponent checkers', () => {
      const { player } = setupTest('white')
      const blackChecker: BackgammonChecker = {
        id: generateId(),
        color: 'black',
        checkercontainerId: generateId(),
      }

      const point: BackgammonPoint = {
        id: generateId(),
        kind: 'point',
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [blackChecker, { ...blackChecker, id: generateId() }],
      }

      expect(Move.isPointOpen(point, player)).toBe(false)
    })
  })

  describe('move', () => {
    it('should throw error if player not found', () => {
      const { board } = setupTest()
      // Create a partial move object without player for testing
      const partialMove = {
        id: generateId(),
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }
      // Cast to unknown first, then to BackgammonMoveReady to avoid type checking
      const move = partialMove as unknown as BackgammonMoveReady

      expect(() => Move.move(board, move)).toThrow('Player not found')
    })

    it('should throw error if player state is not rolled', () => {
      const { board, player } = setupTest()
      const movingPlayer: BackgammonPlayerMoving = {
        ...player,
        stateKind: 'moving',
      }
      const move: BackgammonMoveReady = {
        id: generateId(),
        player: movingPlayer as unknown as BackgammonPlayerRolled, // Type assertion for test
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      expect(() => Move.move(board, move)).toThrow(
        'Invalid player state for move'
      )
    })

    it('should handle point-to-point move', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[23], // Point 24 (has 2 white checkers)
        dieValue: 1,
      }

      const result = Move.move(board, move)
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from point 24 to point 23
      expect(result.board.BackgammonPoints[23].checkers.length).toBe(1) // One checker left on point 24
      expect(result.board.BackgammonPoints[22].checkers.length).toBe(1) // One checker moved to point 23
    })

    it('should handle reenter move', () => {
      const { board, player } = setupTest(
        'white',
        'clockwise',
        [1, 1],
        BOARD_IMPORT_BOTH_REENTER
      )
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
      }

      const result = Move.move(board, move)
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from bar to point 24
      expect(result.board.bar[player.direction].checkers.length).toBe(1) // One checker left on bar
      expect(result.board.BackgammonPoints[23].checkers.length).toBe(1) // One checker moved to point 24
    })

    it('should handle bear-off move', () => {
      // Create a board with all white checkers in the home board (points 19-24)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: {
            clockwise: 24 as BackgammonPointValue,
            counterclockwise: 1 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 23 as BackgammonPointValue,
            counterclockwise: 2 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 22 as BackgammonPointValue,
            counterclockwise: 3 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 21 as BackgammonPointValue,
            counterclockwise: 4 as BackgammonPointValue,
          },
          checkers: {
            qty: 3,
            color: 'white',
          },
        },
      ]

      const { board, player } = setupTest(
        'white',
        'clockwise',
        [1, 1],
        boardImport
      )
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin: board.BackgammonPoints[23], // Point 24 (has 4 white checkers)
        dieValue: 1,
      }

      const result = Move.move(board, move)
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from point 24 to off
      expect(result.board.BackgammonPoints[23].checkers.length).toBe(3) // Three checkers left on point 24
      expect(result.board.off[player.direction].checkers.length).toBe(1) // One checker moved to off
    })

    it('should handle no-move case', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'no-move' as BackgammonMoveKind,
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.move(board, move)
      expect(result.board).toBe(board)
      expect(result.move).toBeDefined()
    })

    it('should handle undefined moveKind case', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'no-move' as BackgammonMoveKind,
        origin: board.BackgammonPoints[0],
        dieValue: 1,
      }

      const result = Move.move(board, move)
      expect(result.board).toBe(board)
      expect(result.move).toBeDefined()
    })
  })

  describe('confirmMove', () => {
    it('should confirm a move', () => {
      const { board, player } = setupTest()
      const movingPlayer: BackgammonPlayerMoving = {
        ...player,
        stateKind: 'moving',
      }
      const move: BackgammonMoveInProgress = {
        id: generateId(),
        player: movingPlayer,
        stateKind: 'in-progress',
        moveKind: 'point-to-point',
        origin: board.BackgammonPoints[23], // Point 24
        destination: board.BackgammonPoints[22], // Point 23
        dieValue: 1,
      }

      const result = Move.confirmMove(move)
      expect(result.stateKind).toBe('confirmed')
    })
  })
})
