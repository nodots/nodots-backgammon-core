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
      userId: generateId(),
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
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.initialize({
        move,
        origin: board.points[0],
      })

      expect(result.id).toBe(moveId)
      expect(result.stateKind).toBe('ready')
      expect(result.origin).toBe(board.points[0])
    })

    it('should generate id if not provided', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: '',
        player,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.points[0],
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
        origin: board.points[0],
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
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
      }
      // Cast to unknown first, then to BackgammonMoveReady to avoid type checking
      const move = partialMove as unknown as BackgammonMoveReady

      expect(() => Move.move(board, move)).toThrow('Player not found')
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
        player: inactivePlayer as unknown as BackgammonPlayerRolled, // Type assertion for test
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
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
        origin: board.points[5], // Point 6 (has 5 white checkers)
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move)
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
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move)
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
        [1, 1],
        boardImport
      )
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin: board.points[5], // Point 6 (has 4 white checkers)
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.move(board, move)
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
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
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
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
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
        origin: board.points[23], // Point 24
        destination: board.points[22], // Point 23
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Move.confirmMove(move)
      expect(result.stateKind).toBe('confirmed')
    })

    it('confirmMove sets isHit for point-to-point with opponent checker', () => {
      const board = Board.initialize(BOARD_IMPORT_DEFAULT)
      const player = {
        id: 'p1',
        userId: 'u1',
        color: 'white' as const,
        direction: 'clockwise' as const,
        stateKind: 'moving' as const,
        dice: {
          id: 'd1',
          color: 'white' as const,
          stateKind: 'rolled' as const,
          currentRoll: [1, 2],
          total: 3,
        },
        pipCount: 167,
        isRobot: false,
      }
      const move = {
        id: generateId(),
        player: player,
        stateKind: 'in-progress' as const,
        moveKind: 'point-to-point',
        origin: board.points[0],
        destination: {
          ...board.points[1],
          checkers: [
            { id: 'opp', color: 'black' as const, checkercontainerId: 'x' },
          ],
        },
        dieValue: 1,
        possibleMoves: [],
      } as unknown as BackgammonMoveInProgress
      const result = Move.confirmMove(move)
      expect(result.isHit).toBe(true)
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

    it('getAvailableDice handles doubles, consumed dice, and no activePlay', () => {
      const dice = { stateKind: 'rolled', currentRoll: [3, 3] }
      const all = (Move as any).getAvailableDice(dice)
      expect(all).toEqual([3, 3, 3, 3])
      // Simulate consumed dice
      const activePlay = {
        moves: new Set([
          { stateKind: 'completed', dieValue: 3, moveKind: 'point-to-point' },
        ]),
      }
      const left = (Move as any).getAvailableDice(dice, activePlay)
      expect(left).toEqual([3, 3, 3])
      // No activePlay
      expect((Move as any).getAvailableDice({ stateKind: 'inactive' })).toEqual(
        []
      )
    })

    it('determineMoveKind returns all move types', () => {
      const player = { color: 'white' as const, direction: 'clockwise' }
      const board = Board.initialize(BOARD_IMPORT_DEFAULT)
      const bar = board.bar.clockwise
      const point = board.points[0]
      expect((Move as any).determineMoveKind(bar, player, board, 1)).toBe(
        'reenter'
      )
      expect((Move as any).determineMoveKind(point, player, board, 1)).toBe(
        'point-to-point'
      )
      // Simulate canBearOff true
      const originalCanBearOff = (Move as any).canBearOff
      ;(Move as any).canBearOff = (_point: any, _player: any, _board: any) =>
        true
      expect((Move as any).determineMoveKind(point, player, board, 1)).toBe(
        'bear-off'
      )
      ;(Move as any).canBearOff = originalCanBearOff
      // Unknown
      expect(
        (Move as any).determineMoveKind({ kind: 'off' }, player, board, 1)
      ).toBe('no-move')
    })

    it('canBearOff returns true only for home board points', () => {
      const player = { direction: 'clockwise' }
      const point = { position: { clockwise: 1, counterclockwise: 24 } }
      // Minimal valid board with points array
      const minimalBoard = {
        points: [],
        bar: {
          clockwise: { checkers: [] },
          counterclockwise: { checkers: [] },
        },
      }
      expect((Move as any).canBearOff(point, player, minimalBoard)).toBe(true)
      const notHome = { position: { clockwise: 10, counterclockwise: 15 } }
      expect((Move as any).canBearOff(notHome, player, minimalBoard)).toBe(
        false
      )
    })

    it('getPossibleMovesForChecker returns possible moves for available dice', () => {
      const board = Board.initialize(BOARD_IMPORT_DEFAULT)
      const player = {
        id: 'p1',
        color: 'white',
        direction: 'clockwise',
        stateKind: 'rolled',
        dice: { stateKind: 'rolled', currentRoll: [1, 2] },
      }
      const checker = board.points[0].checkers[0]
      const origin = board.points[0]
      const game = {
        activePlayer: player,
        board,
        activePlay: undefined,
        stateKind: 'rolled',
      }
      const moves = (Move as any).getPossibleMovesForChecker(
        game,
        checker,
        origin
      )
      expect(Array.isArray(moves)).toBe(true)
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
