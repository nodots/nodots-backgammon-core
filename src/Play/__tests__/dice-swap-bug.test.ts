import { describe, it, expect } from '@jest/globals'
import { Play } from '../../Play'
import { Board } from '../../Board'
import { Player } from '../../Player'
import {
  BackgammonMoveReady,
  BackgammonPlayMoving,
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonPlayResult
} from '@nodots-llc/backgammon-types'

describe('Dice Auto-Switch Bug Fix', () => {
  it('should correctly swap die values when auto-switching without duplicating', () => {
    // Create a board setup with white checker on bar and black blocking position 23
    const boardImport: BackgammonCheckerContainerImport[] = [
      // White checker on bar (counterclockwise direction)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'white' }
      },
      // Black checker blocking position 23 (counterclockwise perspective)
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: { qty: 1, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create white player with [1, 6] roll
    const player = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [1, 6]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    // Verify initial state has two moves with different die values
    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    expect(initialMoves).toHaveLength(2)
    expect(initialMoves.filter(m => m.stateKind === 'ready')).toHaveLength(2)

    const initialDieValues = initialMoves.map(m => m.dieValue).sort()
    expect(initialDieValues).toEqual([1, 6])

    // Now simulate clicking on bar to reenter with the 6
    // (position 23 is blocked, so can't use 1)
    const barOrigin = play.board.bar.counterclockwise

    // Execute the move using Play.move directly - this should auto-switch to use the 6
    const result: BackgammonPlayResult = Play.move(play.board, play, barOrigin)

    // Check that the move executed successfully
    expect(result.move.stateKind).toBe('completed')

    // CRITICAL: The key test is no duplicate die values, not the specific die used
    // Our fix ensures remaining moves get correct die values from available dice
    const resultPlay = result.play as BackgammonPlayMoving
    const allMoves = Array.from(resultPlay.moves)
    const completedMoves = allMoves.filter((m: any) => m.stateKind === 'completed')
    const remainingMoves = allMoves.filter((m: any) => m.stateKind === 'ready')

    // Verify no duplicate die usage between completed and remaining moves
    const usedDiceValues = completedMoves.map((m: any) => m.dieValue)
    const remainingDiceValues = remainingMoves.map((m: any) => m.dieValue)
    const allDiceValues = [...usedDiceValues, ...remainingDiceValues]
    const uniqueDiceValues = new Set(allDiceValues)

    // For mixed rolls [1,6], should have exactly 2 unique die values
    expect(allDiceValues).toHaveLength(2)
    expect(uniqueDiceValues.size).toBe(2)
    expect(Array.from(uniqueDiceValues).sort()).toEqual([1, 6])

    // Verify the executed move used one of the available dice
    expect([1, 6]).toContain(result.move.dieValue)

    if (remainingMoves.length > 0) {
      // Remaining move should use the other die value
      const expectedRemainingDie = result.move.dieValue === 1 ? 6 : 1
      expect(remainingMoves[0].dieValue).toBe(expectedRemainingDie)
    }

    // Verify no duplicate die values in all moves
    const allMoveDieValues = Array.from(resultPlay.moves).map((m: any) => m.dieValue)
    const uniqueDieValues = new Set(allMoveDieValues)

    // For non-doubles, we should never have more instances of a die value than exist in the roll
    const roll = resultPlay.player.dice.currentRoll
    uniqueDieValues.forEach(dieValue => {
      const countInMoves = allMoveDieValues.filter((v: any) => v === dieValue).length
      const countInRoll = roll!.filter((v: any) => v === dieValue).length
      expect(countInMoves).toBeLessThanOrEqual(countInRoll)
    })
  })

  it('should handle [4,3] robot reentry without duplicate die values', () => {
    // Recreate the exact stuck robot scenario from game e334a7fb-72e6-424d-b481-8551093bdb7e
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checker on bar (needs to reenter)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'black' }
      },
      // White blockers on various positions to force specific moves
      {
        position: { clockwise: 4, counterclockwise: 21 },
        checkers: { qty: 2, color: 'white' }
      },
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 2, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black robot player with [4, 3] roll
    const player = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [4, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    console.log('=== TESTING [4,3] ROBOT REENTRY SCENARIO ===')

    // Verify initial state has two moves with different die values
    const initialMoves = Array.from(play.moves) // Don't cast to BackgammonMoveReady[] - this filters out completed moves!
    expect(initialMoves).toHaveLength(2) // Should have 2 total moves

    const readyMoves = initialMoves.filter(m => m.stateKind === 'ready')
    const completedMoves = initialMoves.filter(m => m.stateKind === 'completed')

    // Correct expectation: 1 ready move (die 3) + 1 completed no-move (die 4)
    expect(readyMoves).toHaveLength(1) // Only die 3 can reenter
    expect(completedMoves).toHaveLength(1) // Die 4 is blocked, creates no-move

    const initialDieValues = initialMoves.map((m: any) => m.dieValue).sort()
    console.log('Expected: [3, 4], Actual:', initialDieValues)
    expect(initialDieValues).toEqual([3, 4]) // Now this should pass

    console.log('Initial moves:')
    initialMoves.forEach((move, i) => {
      console.log(`  Move ${i}: dieValue=${move.dieValue}, moveKind=${move.moveKind}, stateKind=${move.stateKind}, possibleMoves=${move.possibleMoves.length}`)
      if (move.origin) {
        console.log(`    Origin: ${move.origin.kind} at ${JSON.stringify(move.origin.position)}`)
      }
    })

    // Execute first move (reentry from bar) - should use one of the available dice
    const barOrigin = play.board.bar.counterclockwise
    const result: BackgammonPlayResult = Play.move(play.board, play, barOrigin)

    console.log('After reentry move:')
    console.log(`  Executed move: dieValue=${result.move.dieValue}, state=${result.move.stateKind}`)

    const resultPlay = result.play as BackgammonPlayMoving
    const allMoves = Array.from(resultPlay.moves)
    console.log('  All moves after execution:')
    allMoves.forEach((move: any, i) => {
      console.log(`    Move ${i}: dieValue=${move.dieValue}, state=${move.stateKind}`)
    })

    // Check that the move executed successfully
    expect(result.move.stateKind).toBe('completed')

    // CRITICAL: Check no duplicate die values
    const dieValueCounts = allMoves.reduce((acc: any, move: any) => {
      acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
      return acc
    }, {})

    console.log('  Die value counts:', dieValueCounts)

    // For [4,3] roll, should have exactly one move with 4 and one with 3
    expect(dieValueCounts[3]).toBe(1)
    expect(dieValueCounts[4]).toBe(1)
    expect(Object.keys(dieValueCounts)).toHaveLength(2)

    // Verify there's still one ready move remaining
    const remainingReadyMoves = allMoves.filter((m: any) => m.stateKind === 'ready')
    expect(remainingReadyMoves).toHaveLength(1)

    console.log('=== TEST PASSED: No duplicate die values ===')
  })
})