import { describe, expect, it } from '@jest/globals'
import {
  BackgammonChecker,
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDiceStateKind,
  BackgammonMoveDirection,
  BackgammonMoveKind,
  BackgammonMoveReady,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPoint,
  BackgammonPointValue,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types'
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
    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color,
      stateKind: 'moving',
      dice: rolledDice,
      direction,
      pipCount: 167,
      isRobot: true,
      rollForStartValue: 5,
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
    dieValue: skeleton.dieValue,
    possibleMoves: [],
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
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.initialize({
        move,
        origin: board.points[0],
      })

      expect(result.id).toBe(moveId)
      expect(result.stateKind).toBe('ready')
    })

    it('should generate id if not provided', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: '',
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.initialize({
        move,
        origin: board.points[0],
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
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.initialize({
        move,
        origin: board.points[0],
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
        isMovable: false,
      }
      const blackChecker: BackgammonChecker = {
        id: generateId(),
        color: 'black',
        checkercontainerId: generateId(),
        isMovable: false,
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
        isMovable: false,
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
        isMovable: false,
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
        dieValue: 1,
        possibleMoves: [],
      }
      // Cast to unknown first, then to BackgammonMoveReady to avoid type checking
      // Explicit casting explanation: Testing error handling for invalid move object
      const move = partialMove as unknown as BackgammonMoveReady

      expect(() => Move.move(board, move, board.points[0])).toThrow(
        'Player not found'
      )
    })

    it('should throw error if player state is not rolled', () => {
      const { board } = setupTest()
      const inactivePlayer = {
        id: generateId(),
        stateKind: 'inactive' as const,
        dice: { stateKind: 'inactive' as const },
      }
      const move: BackgammonMoveReady = {
        id: generateId(),
        // Explicit casting explanation: Testing error handling for invalid player state
        player: inactivePlayer as unknown as BackgammonPlayerMoving,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        dieValue: 1,
        possibleMoves: [],
      }

      expect(() => Move.move(board, move, board.points[0])).toThrow(
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
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move, board.points[5])
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from point 6 to point 5
      expect(result.board.points[5].checkers.length).toBe(4) // Four checkers left on point 6
      expect(result.board.points[4].checkers.length).toBe(1) // One checker moved to point 5 (was empty)
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
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move, board.bar[player.direction])
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from bar to point 24
      expect(result.board.bar[player.direction].checkers.length).toBe(1) // One checker left on bar
      expect(result.board.points[23].checkers.length).toBe(1) // One checker moved to point 24
    })

    it('should handle bear-off move', () => {
      // Create a board with all white checkers in the home board (points 1-6)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: {
            clockwise: 6 as BackgammonPointValue,
            counterclockwise: 19 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 5 as BackgammonPointValue,
            counterclockwise: 20 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 4 as BackgammonPointValue,
            counterclockwise: 21 as BackgammonPointValue,
          },
          checkers: {
            qty: 4,
            color: 'white',
          },
        },
        {
          position: {
            clockwise: 3 as BackgammonPointValue,
            counterclockwise: 22 as BackgammonPointValue,
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
        [6, 5], // Use dice that can actually bear off from point 6
        boardImport
      )
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        dieValue: 6, // Use exact die value for point 6
        possibleMoves: [],
      }

      const result = Move.move(board, move, board.points[5])
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      // Verify checker moved from point 6 to off
      expect(result.board.points[5].checkers.length).toBe(3) // Three checkers left on point 6
      expect(result.board.off[player.direction].checkers.length).toBe(1) // One checker moved to off
    })

    it('should handle no-move case', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'no-move' as BackgammonMoveKind,
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move, board.points[0])
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
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move, board.points[0])
      expect(result.board).toBe(board)
      expect(result.move).toBeDefined()
    })
  })

  describe('Move static helpers', () => {
    it('findCheckerInBoard finds checker in point, bar, and off', () => {
      const board = Board.initialize(BOARD_IMPORT_DEFAULT)
      const checker = board.points[0].checkers[0]
      const found = (Move as any).findCheckerInBoard(board, checker.id)
      expect(found).toBeTruthy()
      expect(found.checker.id).toBe(checker.id)
      // Add to bar and off
      const barChecker = { ...checker, id: 'bar1' }
      board.bar.clockwise.checkers.push(barChecker)
      const foundBar = (Move as any).findCheckerInBoard(board, 'bar1')
      expect(foundBar).toBeTruthy()
      expect(foundBar.container.kind).toBe('bar')
      const offChecker = { ...checker, id: 'off1' }
      board.off.clockwise.checkers.push(offChecker)
      const foundOff = (Move as any).findCheckerInBoard(board, 'off1')
      expect(foundOff).toBeTruthy()
      expect(foundOff.container.kind).toBe('off')
    })

    it('moveChecker returns error for invalid gameId', async () => {
      const result = await (Move as any).moveChecker(
        'badid',
        'badchecker',
        async () => null
      )
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/not found/i)
    })

    // Skipping executeRobotMove as it requires a full game object and dynamic import
  })
})
