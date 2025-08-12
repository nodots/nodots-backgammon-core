import { describe, expect, it } from '@jest/globals'
import {
  BackgammonChecker,
  BackgammonColor,
  BackgammonDiceInactive,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonPlayerRolled,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Reenter } from '..'
import { Dice, generateId } from '../../../../'
import { Board } from '../../../../Board'
import { BOARD_IMPORT_REENTER_TEST } from '../../../../Board/imports'

describe('Reenter', () => {
  const setupTest = (
    color: BackgammonColor = 'white',
    direction: BackgammonMoveDirection = 'clockwise',
    roll: BackgammonRoll = [1, 1]
  ) => {
    const diceId = generateId()
    const board = Board.initialize(BOARD_IMPORT_REENTER_TEST)
    let dice = Dice.initialize(color) as BackgammonDiceInactive
    const rolledDice = {
      ...dice,
      id: diceId,
      stateKind: 'rolled' as const,
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

  describe('isA', () => {
    it('should identify valid reenter moves', () => {
      const { board, player } = setupTest()
      const move = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      const result = Reenter.isA(move)
      expect(result).toBeTruthy()
      if (result) {
        expect(result.stateKind).toBe('in-progress')
        expect(result.moveKind).toBe('reenter')
      }
    })

    it('should reject moves from non-bar origins', () => {
      const { board, player } = setupTest()
      const move = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.points[0],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(Reenter.isA(move)).toBe(false)
    })

    it('should reject moves with empty bar', () => {
      const { board, player } = setupTest()
      board.bar[player.direction].checkers = []
      const move = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(Reenter.isA(move)).toBe(false)
    })

    it('should reject moves with opponent checkers on bar', () => {
      const { board, player } = setupTest()
      board.bar[player.direction].checkers[0].color =
        player.color === 'white' ? 'black' : 'white'
      const move = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(Reenter.isA(move)).toBe(false)
    })

    it('should hit opponent checker when reentering', () => {
      // Use white for clockwise player to match board import
      const { board, player } = setupTest('white', 'clockwise', [1, 2])

      // Ensure there's an opponent checker on point 24
      board.points[23].checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.points[23].id,
          isMovable: false,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(0)
      expect(result.board.bar['counterclockwise'].checkers.length).toBe(1)

      if (
        result.move.moveKind !== 'no-move' &&
        result.move.stateKind === 'completed'
      ) {
        expect(result.move.destination.checkers.length).toBe(1)
        expect(result.move.destination.checkers[0].color).toBe(player.color)
      }
    })
  })

  describe('getDestination', () => {
    it('should find valid destination for reenter', () => {
      const { board, player } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      const destination = Reenter.getDestination(board, move)
      expect(destination).toBeDefined()
      expect(destination.position[player.direction]).toBe(24) // For clockwise, should be point 24
    })

    it('should throw error when no valid destination exists', () => {
      const { board, player } = setupTest()
      // Block all opponent's home board points
      const opponentBoard =
        player.direction === 'clockwise'
          ? board.points.slice(18, 24) // Points 19-24
          : board.points.slice(0, 6) // Points 1-6
      opponentBoard.forEach((point) => {
        const checker: BackgammonChecker = {
          id: generateId(),
          color: player.color === 'white' ? 'black' : 'white',
          checkercontainerId: point.id,
          isMovable: false,
        }
        point.checkers = [checker, { ...checker, id: generateId() }]
      })
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(() => Reenter.getDestination(board, move)).toThrow(
        'Invalid reenter move'
      )
    })

    it('should throw error if no valid destination exists for reentry', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 2])
      // Remove all checkers from the bar and set up the bar for reentry
      const bar = board.bar[player.direction]
      bar.checkers = [
        {
          id: generateId(),
          color: player.color,
          checkercontainerId: bar.id,
          isMovable: false,
        },
      ]
      // Block all possible reentry points (points 24 for dieValue 1)
      const destPoint = board.points[23] // Point 24
      destPoint.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: destPoint.id,
          isMovable: false,
        },
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: destPoint.id,
          isMovable: false,
        },
      ]
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: bar,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'reenter',
        possibleMoves: [],
      }
      expect(() => Reenter.getDestination(board, move)).toThrow(
        'Invalid reenter move: no valid destination found'
      )
    })
  })

  describe('move', () => {
    it('should successfully reenter a checker', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 2])

      // Clear point 24 for reentry
      board.points[23].checkers = []

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(0)

      // Type guard to ensure we have a completed move with destination
      if (
        result.move.moveKind !== 'no-move' &&
        result.move.stateKind === 'completed'
      ) {
        expect(result.move.destination.checkers.length).toBe(1)
        expect(result.move.destination.checkers[0].color).toBe(player.color)
      }
    })

    it('should throw error for invalid board', () => {
      const { player, board } = setupTest()
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(() => Reenter.move(null as any, move)).toThrow('Invalid board')
    })

    it('should throw error for invalid move', () => {
      const { board } = setupTest()
      expect(() => Reenter.move(board, null as any)).toThrow('Invalid move')
    })

    it('should throw error for invalid reenter move', () => {
      const { board, player } = setupTest()
      // Block all opponent's home board points
      const opponentBoard =
        player.direction === 'clockwise'
          ? board.points.slice(18, 24) // Points 19-24
          : board.points.slice(0, 6) // Points 1-6
      opponentBoard.forEach((point) => {
        const checker: BackgammonChecker = {
          id: generateId(),
          color: player.color === 'white' ? 'black' : 'white',
          checkercontainerId: point.id,
          isMovable: false,
        }
        point.checkers = [checker, { ...checker, id: generateId() }]
      })
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }
      expect(() => Reenter.move(board, move)).toThrow('Invalid reenter move')
    })

    it('should prioritize bar moves over regular moves', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 2])

      // Add a regular checker that could move
      board.points[0].checkers.push({
        id: generateId(),
        color: player.color,
        checkercontainerId: board.points[0].id,
        isMovable: false,
      })

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      // Attempt to move the regular checker instead of the bar checker
      const invalidMove: BackgammonMoveReady = {
        ...move,
        origin: board.points[0],
        possibleMoves: [],
      }

      expect(Reenter.isA(invalidMove)).toBe(false) // Should reject non-bar move when checkers are on bar
      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(0)

      // Type guard to ensure we have a completed move with destination
      if (
        result.move.moveKind !== 'no-move' &&
        result.move.stateKind === 'completed'
      ) {
        expect(result.move.destination.checkers.length).toBe(1)
      }
    })

    it('should handle multiple checkers needing reentry', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 2])

      // Add another checker to the bar
      board.bar[player.direction].checkers.push({
        id: generateId(),
        color: player.color,
        checkercontainerId: board.bar[player.direction].id,
        isMovable: false,
      })

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(1) // One checker should remain on bar

      // Type guard to ensure we have a completed move with destination
      if (
        result.move.moveKind !== 'no-move' &&
        result.move.stateKind === 'completed'
      ) {
        expect(result.move.destination.checkers.length).toBe(1) // One checker should be on point 24
      }
    })

    it('should handle multiple checkers on bar', () => {
      const { board, player } = setupTest()
      // Add another checker to the bar
      const checker: BackgammonChecker = {
        id: generateId(),
        color: player.color,
        checkercontainerId: board.bar[player.direction].id,
        isMovable: false,
      }
      board.bar[player.direction].checkers.push(checker)

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(1) // One checker should remain on bar

      // Type guard to ensure we have a completed move with destination
      if (
        result.move.moveKind !== 'no-move' &&
        result.move.stateKind === 'completed'
      ) {
        expect(result.move.destination.checkers.length).toBe(1) // One checker should be on destination point
        expect(result.move.destination.checkers[0].color).toBe(player.color)
      }
    })

    // This test is artificial and only exists to cover the defensive check in Reenter.move
    // In normal gameplay, the destination point should always exist after a move.
    it('should throw error if destination point is missing after move (artificial test for coverage)', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 2])
      const bar = board.bar[player.direction]
      bar.checkers = [
        {
          id: generateId(),
          color: player.color,
          checkercontainerId: bar.id,
          isMovable: false,
        },
      ]
      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        origin: bar,
        stateKind: 'ready',
        dieValue: 1,
        moveKind: 'reenter',
        possibleMoves: [],
      }
      // Save original moveChecker
      const originalMoveChecker = Board.moveChecker
      // Mock moveChecker to replace the destination point with a dummy id
      Board.moveChecker = (b, o, d, dir) => {
        const dummyPoint = {
          ...(d as any),
          id: 'dummy-id',
          kind: 'point',
          position: { ...(d as any).position },
          checkers: [],
        }
        const updatedPoints = b.points.map((p) =>
          p.id === d.id ? dummyPoint : p
        )
        return { ...b, points: updatedPoints } as typeof b
      }
      expect(() => Reenter.move(board, move)).toThrow(
        'Could not find destination point after move'
      )
      // Restore original moveChecker
      Board.moveChecker = originalMoveChecker
    })
  })

  describe('dice combinations', () => {
    it('should handle all possible die values for reentry', () => {
      // Test each die value 1-6 and verify correct reentry point
      const dieValueToPoint: Record<BackgammonDieValue, number> = {
        6: 19, // Die 6 -> Point 19
        5: 20, // Die 5 -> Point 20
        4: 21, // Die 4 -> Point 21
        3: 22, // Die 3 -> Point 22
        2: 23, // Die 2 -> Point 23
        1: 24, // Die 1 -> Point 24
      }

      Object.entries(dieValueToPoint).forEach(([dieValueStr, pointNumber]) => {
        const dieValue = Number(dieValueStr) as BackgammonDieValue
        const { board, player } = setupTest('white', 'clockwise', [dieValue, 1])

        // Clear any checkers from the destination point
        const destPointIndex = pointNumber - 1
        board.points[destPointIndex].checkers = []

        const move: BackgammonMoveReady = {
          id: generateId(),
          player,
          stateKind: 'ready',
          moveKind: 'reenter',
          origin: board.bar[player.direction],
          dieValue,
          possibleMoves: [],
        }

        const result = Reenter.move(board, move)
        expect(result.move.stateKind).toBe('completed')
        if (
          result.move.stateKind === 'completed' &&
          result.move.moveKind !== 'no-move'
        ) {
          const position = result.move.destination.position
          if (position !== 'off') {
            expect(position.clockwise).toBe(pointNumber)
          }
        }
      })
    })

    it('should handle doubles for reentry', () => {
      const { board, player } = setupTest('white', 'clockwise', [1, 1])

      // Add multiple checkers to the bar
      for (let i = 0; i < 3; i++) {
        board.bar[player.direction].checkers.push({
          id: generateId(),
          color: player.color,
          checkercontainerId: board.bar[player.direction].id,
          isMovable: false,
        })
      }

      // Clear point 24 for reentry
      board.points[23].checkers = []

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'reenter',
        origin: board.bar[player.direction],
        dieValue: 1,
        possibleMoves: [],
      }

      // Should be able to reenter multiple checkers using doubles
      const result = Reenter.move(board, move)
      expect(result.move.stateKind).toBe('completed')
      expect(result.board.bar[player.direction].checkers.length).toBe(3) // Should still have remaining checkers
      if (
        result.move.stateKind === 'completed' &&
        result.move.moveKind !== 'no-move'
      ) {
        expect(result.move.destination.checkers.length).toBe(1) // One checker should be on point 24
      }
    })
  })
})
