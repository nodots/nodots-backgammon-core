import { describe, expect, it } from '@jest/globals'
import {
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
} from '@nodots-llc/backgammon-types'
import { PointToPoint } from '..'
import { generateId } from '../../../../'
import { Board } from '../../../../Board'

describe('PointToPoint isHit Flag Bug Investigation', () => {
  const createTestPlayer = (
    color: BackgammonColor = 'white',
    direction: BackgammonMoveDirection = 'clockwise'
  ): BackgammonPlayerMoving => ({
    id: generateId(),
    userId: generateId(),
    color: color,
    stateKind: 'moving',
    dice: {
      id: generateId(),
      stateKind: 'rolled',
      currentRoll: [1, 2],
      total: 3,
      color: color,
    },
    direction: direction,
    pipCount: 167,
    isRobot: true,
    rollForStartValue: 6,
  })

  const createBoardWithBlot = (
    blotColor: BackgammonColor,
    blotPosition: number,
    movingCheckerColor: BackgammonColor,
    movingCheckerPosition: number
  ) => {
    const board = Board.initialize([])

    // Set up the blot (single opponent checker) at the destination
    const blotPoint = board.points.find(
      (p) => p.position.clockwise === blotPosition
    )
    if (!blotPoint) throw new Error(`Point ${blotPosition} not found`)
    
    blotPoint.checkers = [
      {
        id: generateId(),
        color: blotColor,
        checkercontainerId: blotPoint.id,
        isMovable: false,
      },
    ]

    // Set up the moving checker at the origin
    const originPoint = board.points.find(
      (p) => p.position.clockwise === movingCheckerPosition
    )
    if (!originPoint) throw new Error(`Point ${movingCheckerPosition} not found`)
    
    originPoint.checkers = [
      {
        id: generateId(),
        color: movingCheckerColor,
        checkercontainerId: originPoint.id,
        isMovable: false,
      },
    ]

    return { board, blotPoint, originPoint }
  }

  describe('Hit Detection Logic', () => {
    it('should correctly identify a hitting move and set isHit: true', () => {
      // Set up: white checker on position 7, black blot on position 6
      const { board, blotPoint, originPoint } = createBoardWithBlot(
        'black', // blot color
        6,       // blot position (destination)
        'white', // moving checker color
        7        // moving checker position (origin)
      )

      const player = createTestPlayer('white', 'clockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1, // Moving from 7 to 6
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      // Before the move: verify setup
      expect(blotPoint.checkers.length).toBe(1)
      expect(blotPoint.checkers[0].color).toBe('black')
      expect(originPoint.checkers.length).toBe(1)
      expect(originPoint.checkers[0].color).toBe('white')

      // Execute the move
      const result = PointToPoint.move(board, move)

      // Verify the move was completed
      expect(result.move.stateKind).toBe('completed')
      expect(result.move.moveKind).toBe('point-to-point')

      // CRITICAL TEST: Verify isHit flag is correctly set
      expect(result.move.isHit).toBe(true)

      // Verify the hit checker was moved to the bar
      const blackBar = result.board.bar.counterclockwise // black moves counterclockwise
      expect(blackBar.checkers.length).toBe(1)
      expect(blackBar.checkers[0].color).toBe('black')

      // Verify the white checker moved to the destination
      const updatedDestination = result.board.points.find(
        (p) => p.position.clockwise === 6
      )
      expect(updatedDestination?.checkers.length).toBe(1)
      expect(updatedDestination?.checkers[0].color).toBe('white')

      // Verify the origin is now empty
      const updatedOrigin = result.board.points.find(
        (p) => p.position.clockwise === 7
      )
      expect(updatedOrigin?.checkers.length).toBe(0)
    })

    it('should set isHit: false for moves to empty points', () => {
      // Set up: white checker on position 7, empty position 6
      const board = Board.initialize([])
      
      const originPoint = board.points.find(
        (p) => p.position.clockwise === 7
      )!
      originPoint.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: originPoint.id,
          isMovable: false,
        },
      ]

      const player = createTestPlayer('white', 'clockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)

      expect(result.move.isHit).toBe(false)
      expect(result.move.stateKind).toBe('completed')
    })

    it('should set isHit: false for moves to points with own checkers', () => {
      // Set up: white checker on position 7, white checker on position 6
      const { board, originPoint } = createBoardWithBlot(
        'white', // "blot" is actually same color
        6,       // destination position
        'white', // moving checker color
        7        // origin position
      )

      const player = createTestPlayer('white', 'clockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)

      expect(result.move.isHit).toBe(false)
      expect(result.move.stateKind).toBe('completed')

      // Verify stacking occurred
      const destination = result.board.points.find(
        (p) => p.position.clockwise === 6
      )
      expect(destination?.checkers.length).toBe(2)
      expect(destination?.checkers.every(c => c.color === 'white')).toBe(true)
    })

    it('should handle counterclockwise player hitting clockwise player', () => {
      // Set up: black checker on counterclockwise position 7, white blot on counterclockwise position 6
      const board = Board.initialize([])
      
      // For counterclockwise player, position 7 counterclockwise = position 18 clockwise
      const originPoint = board.points.find(
        (p) => p.position.counterclockwise === 7
      )!
      originPoint.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: originPoint.id,
          isMovable: false,
        },
      ]

      // For counterclockwise player, position 6 counterclockwise = position 19 clockwise
      const blotPoint = board.points.find(
        (p) => p.position.counterclockwise === 6
      )!
      blotPoint.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: blotPoint.id,
          isMovable: false,
        },
      ]

      const player = createTestPlayer('black', 'counterclockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)

      // CRITICAL TEST: isHit should be true
      expect(result.move.isHit).toBe(true)

      // White checker should be on clockwise bar (white moves clockwise)
      const whiteBar = result.board.bar.clockwise
      expect(whiteBar.checkers.length).toBe(1)
      expect(whiteBar.checkers[0].color).toBe('white')

      // Black checker should be on the destination
      const destination = result.board.points.find(
        (p) => p.position.counterclockwise === 6
      )
      expect(destination?.checkers.length).toBe(1)
      expect(destination?.checkers[0].color).toBe('black')
    })

    it('should not hit when destination has 2+ opponent checkers (blocked point)', () => {
      // Set up: white checker on position 7, 2 black checkers on position 6
      const board = Board.initialize([])
      
      const originPoint = board.points.find(
        (p) => p.position.clockwise === 7
      )!
      originPoint.checkers = [
        {
          id: generateId(),
          color: 'white',
          checkercontainerId: originPoint.id,
          isMovable: false,
        },
      ]

      const blockedPoint = board.points.find(
        (p) => p.position.clockwise === 6
      )!
      blockedPoint.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: blockedPoint.id,
          isMovable: false,
        },
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: blockedPoint.id,
          isMovable: false,
        },
      ]

      const player = createTestPlayer('white', 'clockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      const result = PointToPoint.move(board, move)

      // Should result in a no-move
      expect(result.move.moveKind).toBe('no-move')
      expect(result.move.isHit).toBe(false)
      expect(result.move.stateKind).toBe('completed')

      // Board should be unchanged
      expect(result.board).toBe(board)
    })
  })

  describe('Timing and State Consistency', () => {
    it('should maintain consistent isHit flag even when Board.moveChecker modifies state', () => {
      // This test specifically targets the suspected bug where the timing
      // of isHit calculation vs Board.moveChecker execution causes inconsistency
      
      const { board, blotPoint, originPoint } = createBoardWithBlot(
        'black', // blot color
        6,       // blot position
        'white', // moving checker color
        7        // moving checker position
      )

      const player = createTestPlayer('white', 'clockwise')
      
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: originPoint,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'point-to-point',
        possibleMoves: [],
      }

      // Capture the original state before the move
      const originalDestinationCheckers = [...blotPoint.checkers]
      
      // Execute the move
      const result = PointToPoint.move(board, move)

      // The key assertion: isHit should be true because there WAS a blot
      // at the destination when the move was initiated
      expect(result.move.isHit).toBe(true)

      // Verify the state transformation was correct
      expect(originalDestinationCheckers.length).toBe(1)
      expect(originalDestinationCheckers[0].color).toBe('black')

      // After the move, the hit checker should be on the bar
      const blackBar = result.board.bar.counterclockwise
      expect(blackBar.checkers.length).toBe(1)
      expect(blackBar.checkers[0].color).toBe('black')

      // The destination should now have only the moving checker
      const finalDestination = result.board.points.find(
        (p) => p.position.clockwise === 6
      )
      expect(finalDestination?.checkers.length).toBe(1)
      expect(finalDestination?.checkers[0].color).toBe('white')
    })
  })
})