import { describe, it, expect } from '@jest/globals'
import { BearOff } from '..'
import { Dice, generateId } from '../../../../'
import { Board } from '../../../../Board'
import {
  BackgammonDiceInactive,
  BackgammonDiceStateKind,
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonRoll,
  BackgammonPoint,
  BackgammonCheckercontainerImport,
  BackgammonBoard,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonMoveKind,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
} from 'nodots-backgammon-types'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../../../../Board/imports'

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
  const setupTestBoard = (boardImport: BackgammonCheckercontainerImport[]) => {
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
      id: '1',
      color,
      stateKind: 'rolled',
      dice: rolledDice,
      direction,
      pipCount: 15, // All checkers in home board
    }
    return { board, player, currentRoll }
  }

  describe('Valid Bear Off Scenarios', () => {
    it('should successfully bear off a checker with exact dice value', () => {
      // Setup board with all checkers in home board (points 19-24 for clockwise)
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 19 (lowest point in home board)
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 14, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 24
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6,
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.BackgammonPoints.find(
          (p) => p.position[player.direction] === 24
        )?.checkers.length
      ).toBe(0)
      // Check that checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })

    it('should successfully bear off a checker with higher dice value when no checkers on higher points', () => {
      // Setup board with all checkers in home board, one on point 22, rest on point 19
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 22, counterclockwise: 3 },
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 19 (no checkers on higher points)
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 14, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 22
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6, // Using higher dice value
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.BackgammonPoints.find(
          (p) => p.position[player.direction] === 22
        )?.checkers.length
      ).toBe(0)
      // Check that checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })
  })

  describe('Invalid Bear Off Scenarios', () => {
    it('should not allow bearing off when checkers exist outside home board', () => {
      // Setup board with a checker outside home board (point 18)
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 22, counterclockwise: 3 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 18, counterclockwise: 7 }, // Outside home board
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 19
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 22
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 4,
      }

      expect(() => BearOff.move(board, move)).toThrow(
        'Cannot bear off when checkers exist outside home board'
      )
    })

    it('should not allow bearing off with higher dice when checkers exist on higher points', () => {
      // Setup board with checkers on points 22 and 24
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 22, counterclockwise: 3 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 24, counterclockwise: 1 }, // Higher point
          checkers: { qty: 1, color: 'white' },
        },
        // Rest of checkers on point 19
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 22
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6, // Trying to use higher dice value
      }

      expect(() => BearOff.move(board, move)).toThrow(
        'Cannot use higher number when checkers exist on higher points'
      )
    })

    it('should not allow bearing off from empty point', () => {
      // Setup board with all checkers on point 19
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 15, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 22
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 4,
      }

      expect(() => BearOff.move(board, move)).toThrow('No checker to bear off')
    })
  })

  describe('Multiple Checkers Scenarios', () => {
    it('should bear off one checker at a time from a point with multiple checkers', () => {
      // Setup board with multiple checkers on point 24
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 2, color: 'white' },
        },
        // Rest of checkers on point 19
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 13, color: 'white' },
        },
      ]
      const { board, player } = setupTestBoard(boardImport)

      const origin = board.BackgammonPoints.find(
        (p: BackgammonPoint) => p.position[player.direction] === 24
      )!

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin,
        dieValue: 6,
      }

      const moveResult = BearOff.move(board, move)
      expect(moveResult.move.stateKind).toBe('completed')
      expect(
        moveResult.board.BackgammonPoints.find(
          (p) => p.position[player.direction] === 24
        )?.checkers.length
      ).toBe(1) // One checker should remain
      // Check that one checker was moved to the off position
      expect(moveResult.board.off[player.direction].checkers.length).toBe(1)
    })
  })
})
