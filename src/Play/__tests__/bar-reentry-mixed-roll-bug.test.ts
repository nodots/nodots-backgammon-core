/**
 * Test to reproduce the bug where Play.initialize() only generates 1 move
 * instead of 2 for mixed rolls when player has checker on bar.
 *
 * Reproduces the exact scenario from game 23162b67-2786-40f6-b3fc-c43534072e35
 * where human player rolled [5,6] but only got 1 move (bar reentry with 5).
 */
import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonMoveReady,
  BackgammonPlayResult,
  BackgammonPlayMoving
} from '@nodots-llc/backgammon-types'

describe('Play.initialize - Bar Reentry Mixed Roll Bug', () => {
  it('should execute bar reentry and then generate second move correctly', () => {
    // This test reproduces the exact bug: after executing bar reentry,
    // the remaining move should still be available
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar (counterclockwise direction)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create WHITE player with [5,6] roll
    const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [5, 6]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize play - this should create 2 moves
    const initialPlay = Play.initialize(board, movingPlayer)
    const initialMoves = Array.from(initialPlay.moves)

    console.log('Initial moves:', initialMoves.map(m => ({
      id: m.id,
      dieValue: m.dieValue,
      moveKind: m.moveKind,
      stateKind: m.stateKind
    })))

    // Should have 2 moves initially
    expect(initialMoves).toHaveLength(2)
    const readyMoves = initialMoves.filter(m => m.stateKind === 'ready')
    expect(readyMoves).toHaveLength(2)

    // Execute the first move (bar reentry)
    const barOrigin = initialPlay.board.bar.counterclockwise
    const moveResult: BackgammonPlayResult = Play.move(initialPlay.board, initialPlay, barOrigin)

    // Cast to the correct type
    const resultPlay = moveResult.play as BackgammonPlayMoving

    console.log('After first move, remaining moves:', Array.from(resultPlay.moves).map((m: any) => ({
      id: m.id,
      dieValue: m.dieValue,
      moveKind: m.moveKind,
      stateKind: m.stateKind
    })))

    // CRITICAL TEST: After executing first move, should still have a second ready move
    const finalMoves = Array.from(resultPlay.moves)
    const completedMoves = finalMoves.filter((m: any) => m.stateKind === 'completed')
    const remainingReadyMoves = finalMoves.filter((m: any) => m.stateKind === 'ready')

    expect(completedMoves).toHaveLength(1) // One move completed
    expect(remainingReadyMoves).toHaveLength(1) // One move still ready

    // The remaining move should have the unused die value
    const usedDie = (completedMoves[0] as any).dieValue
    const remainingDie = (remainingReadyMoves[0] as any).dieValue
    expect([5, 6]).toContain(usedDie)
    expect([5, 6]).toContain(remainingDie)
    expect(usedDie).not.toBe(remainingDie)

    // Game should still be in 'moving' state, not 'moved'
    expect(resultPlay.stateKind).toBe('moving')

    // CRITICAL TEST: The remaining move should have valid possibleMoves
    // This is crucial - if possibleMoves is empty, the frontend might not show the move
    expect(remainingReadyMoves[0].possibleMoves).toBeDefined()
    expect(remainingReadyMoves[0].possibleMoves.length).toBeGreaterThan(0)
  })

  it('should handle bar reentry correctly without dice duplication for [3,4]', () => {
    // This test focuses on the dice tracking logic that causes the bug
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar (counterclockwise direction)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create WHITE player with [3,4] roll
    const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [3, 4] // Different dice values to test the bug
    const movingPlayer = Player.toMoving(rolledPlayer)

    const activePlay = Play.initialize(board, movingPlayer)
    const movesArray = Array.from(activePlay.moves)

    // Should generate 2 moves with different die values
    expect(movesArray).toHaveLength(2)

    const diceValues = movesArray.map(m => m.dieValue).sort()
    expect(diceValues).toEqual([3, 4])

    // Check that usedDiceValues tracking doesn't cause duplicate prevention
    const readyMoves = movesArray.filter(m => m.stateKind === 'ready')
    expect(readyMoves).toHaveLength(2)
  })
})