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
import { PointToPoint } from '.'
import { generateId } from '../../..'
import { Board } from '../../../Board'

describe('PointToPoint', () => {
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

      // Add a black checker to point 13 (index 12)
      board.points[12].checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.points[12].id,
        },
      ]
    })

    it('should move a checker from one point to another', () => {
      const origin = board.points[12] // Point 13
      board.points[11].checkers = [] // Ensure destination is empty
      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'point-to-point',
        origin,
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)
      const completedMove = result.move as BackgammonMoveCompleted
      expect(result.board).toBeDefined()
      expect(completedMove.stateKind).toBe('completed')
      expect(completedMove.isHit).toBe(false)
      expect(result.board.points[12].checkers.length).toBe(0) // Origin point should be empty
      expect(result.board.points[11].checkers.length).toBe(1) // Destination point should have one checker
      expect(result.board.points[11].checkers[0].color).toBe('black')
    })

    it('should hit an opponent checker', () => {
      const origin = board.points[12] // Point 13
      const destination = board.points[11] // Point 12
      // Add a white checker to the destination point
      destination.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: destination.id,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'point-to-point',
        origin,
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)
      const completedMove = result.move as BackgammonMoveCompleted
      expect(result.board).toBeDefined()
      expect(completedMove.stateKind).toBe('completed')
      expect(completedMove.isHit).toBe(true)
      expect(result.board.points[12].checkers.length).toBe(0) // Origin point should be empty
      expect(result.board.points[11].checkers.length).toBe(1) // Destination point should have one checker
      expect(result.board.points[11].checkers[0].color).toBe('black')
      expect(result.board.bar.counterclockwise.checkers.length).toBe(1) // Hit checker should be on the bar
      expect(result.board.bar.counterclockwise.checkers[0].color).toBe('white')
    })

    it('should not allow moving to a point with two or more opponent checkers', () => {
      const origin = board.points[12] // Point 13
      const destination = board.points[11] // Point 12
      // Add two white checkers to the destination point
      destination.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: destination.id,
        },
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: destination.id,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        stateKind: 'ready',
        player,
        dieValue: 1 as BackgammonDieValue,
        moveKind: 'point-to-point',
        origin,
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)
      const completedMove = result.move as BackgammonMoveCompleted
      expect(completedMove.moveKind).toBe('no-move')
      expect(completedMove.stateKind).toBe('completed')
      expect(completedMove.isHit).toBe(false)
      expect(completedMove.origin).toBeUndefined()
      expect(completedMove.destination).toBeUndefined()
    })
  })
})
