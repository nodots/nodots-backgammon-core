/**
 * Test for the bug where a die that cannot be used for bar reentry
 * is marked as no-move instead of being available for regular moves
 * after successful reentry with the other die.
 *
 * Reproduces scenario from game 7d409f85-1a45-4845-9534-b1cbcbd01550:
 * - White checker on bar
 * - Rolled [1, 3]
 * - Point 24 (ccw) blocked by 3 black checkers -> die 1 cannot reenter
 * - Point 22 (ccw) open -> die 3 CAN reenter
 * - After reentering with 3, die 1 should be available for regular move
 */
import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonMoveReady,
} from '@nodots-llc/backgammon-types'

describe('Play.initialize - Blocked Bar Reentry Should Allow Regular Move', () => {
  it('should allow die 1 for regular move after die 3 reentry when die 1 cannot reenter', () => {
    // Reproduce exact scenario: white on bar, point 24 blocked, point 22 open
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar (counterclockwise direction)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' },
      },
      // Point 24 (ccw) / Point 1 (cw) - blocked by 3 black checkers
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 3, color: 'black' },
      },
      // Point 22 (ccw) / Point 3 (cw) - open (will receive the reentering checker)
      {
        position: { clockwise: 3, counterclockwise: 22 },
        checkers: { qty: 0, color: 'white' },
      },
    ]

    const board = Board.initialize(boardImport)

    // Create WHITE player with [1, 3] roll
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
    const initialMoves = Array.from(initialPlay.moves)

    console.log(
      'Initial moves:',
      initialMoves.map((m) => ({
        dieValue: m.dieValue,
        moveKind: m.moveKind,
        stateKind: m.stateKind,
        possibleMovesCount: m.possibleMoves.length,
      }))
    )

    // Should have 2 moves
    expect(initialMoves).toHaveLength(2)

    // Find the moves by die value
    const die1Move = initialMoves.find((m) => m.dieValue === 1)
    const die3Move = initialMoves.find((m) => m.dieValue === 3)

    expect(die1Move).toBeDefined()
    expect(die3Move).toBeDefined()

    // Die 3 should be a reentry move (can reenter to point 22)
    expect(die3Move!.moveKind).toBe('reenter')
    expect(die3Move!.stateKind).toBe('ready')
    expect(die3Move!.possibleMoves.length).toBeGreaterThan(0)

    // CRITICAL: Die 1 should NOT be marked as no-move
    // Instead, it should be evaluated for regular moves after simulated reentry
    // After die 3 reenters to point 22, die 1 can move from point 22 to point 23
    expect(die1Move!.stateKind).toBe('ready')
    expect(die1Move!.possibleMoves.length).toBeGreaterThan(0)

    // Die 1 should be a point-to-point move (not reenter, not no-move)
    // It's evaluated on the simulated board after reentry
    expect(die1Move!.moveKind).not.toBe('no-move')
  })

  it('should mark both dice as no-move when both are blocked for reentry and no moves possible after', () => {
    // Edge case: both dice blocked for reentry AND no regular moves possible
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' },
      },
      // Block all entry points for a [1, 2] roll
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 3, color: 'black' },
      },
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: { qty: 3, color: 'black' },
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
    rolledPlayer.dice.currentRoll = [1, 2]
    const movingPlayer = Player.toMoving(rolledPlayer)

    const initialPlay = Play.initialize(board, movingPlayer)
    const initialMoves = Array.from(initialPlay.moves)

    // Both moves should be no-move since both entry points are blocked
    expect(initialMoves).toHaveLength(2)
    expect(initialMoves.every((m) => m.moveKind === 'no-move')).toBe(true)
    expect(initialMoves.every((m) => m.stateKind === 'completed')).toBe(true)
  })
})
