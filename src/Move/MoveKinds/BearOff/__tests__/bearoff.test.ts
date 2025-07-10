import { describe, expect, it } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDiceInactive,
  BackgammonDiceStateKind,
  BackgammonMoveKind,
  BackgammonMoveReady,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
  BackgammonPlayerRolled,
  BackgammonPoint,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { BearOff } from '..'
import { Dice, generateId } from '../../../../'
import { Board } from '../../../../Board'

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

const convertSkeletonsToMoves = (
  skeletons: BackgammonMoveSkeleton[],
  player: BackgammonPlayer,
  moveKind: BackgammonMoveKind
): Set<BackgammonMoveReady> =>
  new Set(
    skeletons.map((skeleton) =>
      convertSkeletonToMove(skeleton, player, moveKind)
    )
  )

describe('BearOff', () => {
  const setupTestBoard = (boardImport: BackgammonCheckerContainerImport[]) => {
    const diceId: string = generateId()
    const board = Board.initialize(boardImport)
    const color = 'white' // Use fixed color for predictable tests
    const direction = 'clockwise' // Use fixed direction for predictable tests
    const currentRoll: BackgammonRoll = [6, 4]
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
      id: generateId(),
      userId: generateId(),
      color: 'white',
      stateKind: 'rolled',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 6] as BackgammonRoll,
        total: 12,
        color: 'white' as BackgammonColor,
      },
      direction: 'clockwise',
      pipCount: 15, // All checkers in home board
      isRobot: true,
    }
    return { board, player, currentRoll }
  }

  describe('Valid Bear Off Scenarios', () => {
    it('should successfully bear off a checker with exact dice value', () => {
      // Setup board with all checkers in home board (points 1-6 for clockwise)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 1 (lowest point in home board)
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 14, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 6
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6,
        possibleMoves: [],
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.points.find((p) => p.position[player.direction] === 6)
          ?.checkers.length
      ).toBe(0)
      // Check that checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })

    it('should successfully bear off a checker with higher dice value when no checkers on higher points', () => {
      // Setup board with all checkers in home board, one on point 3, rest on point 1
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 1 (no checkers on higher points)
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 14, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 3
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6, // Using higher dice value
        possibleMoves: [],
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.points.find((p) => p.position[player.direction] === 3)
          ?.checkers.length
      ).toBe(0)
      // Check that checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })
  })

  describe('Invalid Bear Off Scenarios', () => {
    it('should not allow bearing off when checkers exist outside home board', () => {
      // Setup board with a checker outside home board (point 7)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 7, counterclockwise: 18 }, // Outside home board
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 1
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 3
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 4,
        possibleMoves: [],
      }

      expect(() => BearOff.move(board, move)).toThrow(
        'Cannot bear off when checkers exist outside home board'
      )
    })

    it('should not allow bearing off with higher dice when checkers exist on higher points', () => {
      // Setup board with checkers on points 3 and 6
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 6, counterclockwise: 19 }, // Higher point
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 1
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 3
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6, // Trying to use higher dice value
        possibleMoves: [],
      }

      expect(() => BearOff.move(board, move)).toThrow(
        'Cannot use higher number when checkers exist on higher points'
      )
    })

    it('should not allow bearing off from empty point', () => {
      // Setup board with all checkers on point 1
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 15, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 3
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 4,
        possibleMoves: [],
      }

      expect(() => BearOff.move(board, move)).toThrow('No checker to bear off')
    })
  })

  describe('Multiple Checkers Scenarios', () => {
    it('should bear off one checker at a time from a point with multiple checkers', () => {
      // Setup board with multiple checkers on point 6
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 2, color: 'white' },
        },
        // Rest of checkers on point 1
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.points.find(
        (p: BackgammonPoint) => p.position[player.direction] === 6
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6,
        possibleMoves: [],
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.points.find((p) => p.position[player.direction] === 6)
          ?.checkers.length
      ).toBe(1) // One checker should remain
      // Check that one checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })
  })
})
