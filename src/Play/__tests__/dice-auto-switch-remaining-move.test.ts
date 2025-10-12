/**
 * Test for the bug where after dice auto-switching occurs during first move,
 * the remaining die value is incorrectly marked as no-move or has wrong value.
 *
 * Your hunch: "The same bug would present itself in a regular point-to-point move
 * if the user attempted to move a checker on the first move that can only be moved
 * with the dieValue in the second move."
 */
import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
} from '@nodots-llc/backgammon-types'

describe('Play - Dice Auto-Switch Remaining Move Bug', () => {
  it('should preserve remaining die value after auto-switch on first move', () => {
    // Setup: White has checker on point 20, rolled [1, 3]
    // Point 21 is blocked (cannot use die 1)
    // Point 23 is open (can use die 3)
    // User clicks checker on point 20, which forces auto-switch to use die 3
    // After move, die 1 should still be available for other checkers

    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on point 20 (ccw) - can ONLY move with die 3, not die 1
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 1, color: 'white' },
      },
      // Point 19 (ccw) blocked - prevents die 1 move from point 20
      {
        position: { clockwise: 6, counterclockwise: 19 },
        checkers: { qty: 2, color: 'black' },
      },
      // Point 17 (ccw) open - allows die 3 move from point 20
      {
        position: { clockwise: 8, counterclockwise: 17 },
        checkers: { qty: 0, color: 'white' },
      },
      // Another white checker on point 10 that CAN use die 1
      {
        position: { clockwise: 15, counterclockwise: 10 },
        checkers: { qty: 1, color: 'white' },
      },
    ]

    const board = Board.initialize(boardImport)

    const player = Player.initialize(
      'white',
      'counterclockwise',
      'rolling',
      false
    ) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [1, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize play
    const initialPlay = Play.initialize(board, movingPlayer)

    console.log('Initial moves:', initialPlay.moves.map(m => ({
      dieValue: m.dieValue,
      stateKind: m.stateKind,
      moveKind: m.moveKind,
      possibleMovesCount: m.possibleMoves.length,
    })))

    // User clicks checker on point 20 (which can only move with die 3, not die 1)
    const point20 = board.points.find(
      p => p.position.counterclockwise === 20
    )!

    // Execute first move - should auto-switch to use die 3
    const moveResult: BackgammonPlayResult = Play.move(
      initialPlay.board,
      initialPlay,
      point20
    )

    const resultPlay = moveResult.play as BackgammonPlayMoving

    console.log('After first move:', resultPlay.moves.map(m => ({
      dieValue: m.dieValue,
      stateKind: m.stateKind,
      moveKind: m.moveKind,
      possibleMovesCount: m.possibleMoves.length,
    })))

    // CRITICAL: After first move, die 1 should still be available
    const remainingMoves = resultPlay.moves.filter(m => m.stateKind === 'ready')
    expect(remainingMoves).toHaveLength(1)

    const remainingMove = remainingMoves[0]
    expect(remainingMove.dieValue).toBe(1)
    expect(remainingMove.stateKind).toBe('ready')
    expect(remainingMove.possibleMoves.length).toBeGreaterThan(0)
  })
})
