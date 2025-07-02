import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDiceRolled,
  BackgammonDieValue,
  BackgammonMoveCompleted,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Reenter } from '.'
import { generateId } from '../../..'
import { Board } from '../../../Board'

describe('Reenter', () => {
  describe('move', () => {
    let board: BackgammonBoard
    let player: BackgammonPlayerRolled

    beforeEach(() => {
      board = Board.initialize()
      player = {
        id: generateId(),
        userId: generateId(),
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

      // Clear the reentry point (point 24 for clockwise)
      board.points[23].checkers = []
    })

    it('should reenter a checker from the bar', () => {
      // Add a checker to the bar
      board.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.bar.clockwise.id,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'reenter',
        origin: board.bar.clockwise,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      const completedMove = result.move as BackgammonMoveCompleted
      expect(result.board).toBeDefined()
      expect(completedMove.stateKind).toBe('completed')
      expect(completedMove.isHit).toBe(false)
      expect(result.board.bar.clockwise.checkers.length).toBe(0) // Bar should be empty
      expect(result.board.points[23].checkers.length).toBe(1) // Point 24 should have one checker
      expect(result.board.points[23].checkers[0].color).toBe('black')
    })

    it('should hit an opponent checker when reentering', () => {
      // Add a checker to the bar
      board.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.bar.clockwise.id,
        },
      ]

      // Add an opponent checker to the reentry point
      const reentryPoint = board.points[23] // Point 24 for clockwise
      reentryPoint.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: reentryPoint.id,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'reenter',
        origin: board.bar.clockwise,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      const completedMove = result.move as BackgammonMoveCompleted
      expect(result.board).toBeDefined()
      expect(completedMove.stateKind).toBe('completed')
      expect(completedMove.isHit).toBe(true)
      expect(result.board.bar.clockwise.checkers.length).toBe(0) // Bar should be empty
      expect(result.board.points[23].checkers.length).toBe(1) // Point 24 should have one checker
      expect(result.board.points[23].checkers[0].color).toBe('black')
      expect(result.board.bar.counterclockwise.checkers.length).toBe(1) // Hit checker should be on opponent's bar
      expect(result.board.bar.counterclockwise.checkers[0].color).toBe('white')
    })

    it('should not allow reentering to a point with two or more opponent checkers', () => {
      // Add a checker to the bar
      board.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.bar.clockwise.id,
        },
      ]

      // Add two opponent checkers to the reentry point
      const reentryPoint = board.points[23] // Point 24 for clockwise
      reentryPoint.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: reentryPoint.id,
        },
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: reentryPoint.id,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'reenter',
        origin: board.bar.clockwise,
        possibleMoves: [],
      }

      expect(() => Reenter.move(board, move)).toThrow(
        'Invalid reenter move: no valid destination found'
      )
    })
  })
})
