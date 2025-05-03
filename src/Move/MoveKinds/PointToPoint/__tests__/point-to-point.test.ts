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
} from 'nodots-backgammon-types'

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
    }

    return { board, player, currentRoll }
  }

  describe('isA', () => {
    it('should return false for move with empty origin point', () => {
      const { board, player } = setupTestData()
      const emptyPoint = board.BackgammonPoints[0] // An empty point
      const destination = board.BackgammonPoints[1]

      const move = {
        id: '1',
        player,
        origin: emptyPoint,
        destination,
        stateKind: 'ready',
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
      const destination = board.BackgammonPoints[1]

      const move = {
        id: '1',
        player,
        origin: originWithBlackChecker,
        destination,
        stateKind: 'ready',
      }

      expect(PointToPoint.isA(move)).toBe(false)
    })

    it('should return false for move without destination', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5] // Point with checkers

      const move = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
      }

      expect(PointToPoint.isA(move)).toBe(false)
    })

    it('should return valid move for correct point-to-point setup', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5]
      const destination = board.BackgammonPoints[4]

      const move = {
        id: '1',
        player,
        origin,
        destination,
        stateKind: 'ready',
      }

      const result = PointToPoint.isA(move)
      expect(result).toBeTruthy()
      if (result) {
        expect(result.stateKind).toBe('in-progress')
        expect(result.moveKind).toBe('point-to-point')
      }
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
        possibleMoves: Board.getPossibleMoves(board, player, 1),
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
        possibleMoves: Board.getPossibleMoves(board, player, 1),
      }

      const destination = PointToPoint.getDestination(board, move)
      expect(destination.position.counterclockwise).toBe(
        origin.position.counterclockwise - 1
      )
    })
  })

  describe('move', () => {
    it('should throw error for invalid board', () => {
      const { player } = setupTestData()
      const move: BackgammonMoveReady = {
        id: '1',
        player,
        stateKind: 'ready',
        dieValue: 1,
        possibleMoves: [],
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
        possibleMoves: Board.getPossibleMoves(board, player, 1),
      }

      const result = PointToPoint.move(board, move)
      expect(result.board).toBeTruthy()
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.BackgammonPoints[5].checkers.length).toBe(
        initialCheckerCount - 1
      )
    })

    it('should perform a dry run without modifying the board', () => {
      const { board, player } = setupTestData()
      const origin = board.BackgammonPoints[5]
      const initialCheckerCount = origin.checkers.length

      const move: BackgammonMoveReady = {
        id: '1',
        player,
        origin,
        stateKind: 'ready',
        dieValue: 1,
        possibleMoves: Board.getPossibleMoves(board, player, 1),
      }

      const result = PointToPoint.move(board, move, true)
      expect(result.board).toBeTruthy()
      expect(result.move.stateKind).toBe('in-progress')
      expect(origin.checkers.length).toBe(initialCheckerCount) // Checkers should not have moved
    })
  })
})
