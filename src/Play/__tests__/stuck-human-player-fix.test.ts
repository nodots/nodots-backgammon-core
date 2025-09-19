/**
 * Test to reproduce and fix the exact stuck human player bug
 * From GitHub issue #46 and game ID: 23162b67-2786-40f6-b3fc-c43534072e35
 *
 * Bug: Human player gets stuck after making 1 move out of 2 dice [5,6]
 * when having checker on bar. Game prematurely transitions to "moved" state.
 */

import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import { Game } from '../../Game'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonGameMoving,
  BackgammonPlayResult,
  BackgammonPlayMoving
} from '@nodots-llc/backgammon-types'

describe('Stuck Human Player Bug Fix - GitHub Issue #46', () => {

  it('should NOT prematurely transition to moved state after bar reentry with mixed dice [5,6]', () => {
    // Create the exact scenario: white checker on bar, [5,6] roll
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar (counterclockwise direction) - this is the key setup
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' }
      },
      // Add some other checkers to make it realistic
      { position: { clockwise: 13, counterclockwise: 12 }, checkers: { qty: 5, color: 'white' } },
      { position: { clockwise: 24, counterclockwise: 1 }, checkers: { qty: 2, color: 'black' } }
    ]

    const board = Board.initialize(boardImport)

    // Create WHITE player with [5,6] roll (exact scenario from bug report)
    const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [5, 6] // Critical: mixed dice that caused the bug
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize play - should create 2 moves initially
    const initialPlay = Play.initialize(board, movingPlayer)
    const initialMoves = Array.from(initialPlay.moves)

    console.log('🎲 Initial Play State:', {
      stateKind: initialPlay.stateKind,
      movesCount: initialMoves.length,
      moves: initialMoves.map(m => ({
        dieValue: m.dieValue,
        moveKind: m.moveKind,
        stateKind: m.stateKind,
        hasPossibleMoves: m.possibleMoves && m.possibleMoves.length > 0
      }))
    })

    // CRITICAL ASSERTION: Should have 2 moves initially (one for each die)
    expect(initialMoves).toHaveLength(2)
    const readyMoves = initialMoves.filter(m => m.stateKind === 'ready')
    expect(readyMoves).toHaveLength(2)

    // Should have moves for both dice values
    const diceValues = initialMoves.map(m => m.dieValue).sort()
    expect(diceValues).toEqual([5, 6])

    // Execute the first move (bar reentry) using Play.move (core level)
    const barOrigin = initialPlay.board.bar.counterclockwise
    const moveResult: BackgammonPlayResult = Play.move(initialPlay.board, initialPlay, barOrigin)

    const resultPlay = moveResult.play as BackgammonPlayMoving

    console.log('🎯 After First Move:', {
      playStateKind: resultPlay.stateKind,
      movesCount: Array.from(resultPlay.moves).length,
      moves: Array.from(resultPlay.moves).map((m: any) => ({
        dieValue: m.dieValue,
        moveKind: m.moveKind,
        stateKind: m.stateKind,
        hasPossibleMoves: m.possibleMoves && m.possibleMoves.length > 0
      }))
    })

    // 🚨 CRITICAL BUG TEST: Check if Play transitions to 'moved' state (type-casted)
    const playStateKind = (resultPlay as any).stateKind
    if (playStateKind === 'moved') {
      console.error('🚨 BUG REPRODUCED: Play prematurely transitioned to "moved" state!')
      console.error('This is the exact bug that causes human players to get stuck.')
      console.error('Expected: moving, Actual: moved')
    }

    // PRIMARY ASSERTION: Play should still be in 'moving' state
    expect(resultPlay.stateKind).toBe('moving')

    // Verify move counts
    const finalMoves = Array.from(resultPlay.moves)
    const completedMoves = finalMoves.filter((m: any) => m.stateKind === 'completed')
    const remainingReadyMoves = finalMoves.filter((m: any) => m.stateKind === 'ready')

    // Should have exactly 1 completed and 1 ready move
    expect(completedMoves).toHaveLength(1)
    expect(remainingReadyMoves).toHaveLength(1)

    // Verify dice usage
    const usedDie = (completedMoves[0] as any).dieValue
    const remainingDie = (remainingReadyMoves[0] as any).dieValue
    expect([5, 6]).toContain(usedDie)
    expect([5, 6]).toContain(remainingDie)
    expect(usedDie).not.toBe(remainingDie)

    // Verify remaining move has valid possible moves
    expect((remainingReadyMoves[0] as any).possibleMoves).toBeDefined()
    expect((remainingReadyMoves[0] as any).possibleMoves.length).toBeGreaterThan(0)

    console.log('✅ Bug fix verified: Human player can make second move!')
  })

  it('should detect when allMovesCompleted logic is working correctly', () => {
    // This test verifies the specific logic that was causing the bug
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)
    const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [5, 6]
    const movingPlayer = Player.toMoving(rolledPlayer)

    const initialPlay = Play.initialize(board, movingPlayer)

    // Execute move using Play.move directly (lower level than Game.move)
    const barOrigin = initialPlay.board.bar.counterclockwise
    const moveResult: BackgammonPlayResult = Play.move(initialPlay.board, initialPlay, barOrigin)

    const resultPlay = moveResult.play as BackgammonPlayMoving

    // Test the specific logic that was causing the premature transition
    const allMoves = Array.from(resultPlay.moves)
    const allMovesCompleted = allMoves.every(m => m.stateKind === 'completed')

    console.log('🔍 Move Completion Analysis:', {
      totalMoves: allMoves.length,
      completedMoves: allMoves.filter(m => m.stateKind === 'completed').length,
      readyMoves: allMoves.filter(m => m.stateKind === 'ready').length,
      allMovesCompleted,
      resultPlayStateKind: resultPlay.stateKind
    })

    // The bug was: allMovesCompleted was incorrectly returning true
    // This should be false because there's still 1 ready move
    expect(allMovesCompleted).toBe(false)
    expect(resultPlay.stateKind).toBe('moving')
  })

  it('should handle edge case where bar reentry uses specific die value', () => {
    // Test different dice orders to ensure the fix works consistently
    const testCases = [
      { dice: [5, 6], name: '[5,6]' },
      { dice: [6, 5], name: '[6,5]' },
      { dice: [3, 4], name: '[3,4]' },
      { dice: [1, 6], name: '[1,6]' }
    ]

    testCases.forEach(({ dice, name }) => {
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: 'bar',
          direction: 'counterclockwise',
          checkers: { qty: 1, color: 'white' }
        }
      ]

      const board = Board.initialize(boardImport)
      const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
      const rolledPlayer = Player.roll(player)
      rolledPlayer.dice.currentRoll = dice as [1|2|3|4|5|6, 1|2|3|4|5|6]
      const movingPlayer = Player.toMoving(rolledPlayer)

      const initialPlay = Play.initialize(board, movingPlayer)

      // Should always create 2 moves for mixed dice
      const initialMoves = Array.from(initialPlay.moves)
      expect(initialMoves).toHaveLength(2)

      // Execute first move
      const barOrigin = initialPlay.board.bar.counterclockwise
      const moveResult = Play.move(initialPlay.board, initialPlay, barOrigin)
      const resultPlay = moveResult.play as BackgammonPlayMoving

      // Should never transition to moved after just first move
      expect(resultPlay.stateKind).toBe('moving')

      console.log(`✅ ${name} dice order works correctly`)
    })
  })
})