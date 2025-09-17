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

describe('Comprehensive Auto-Switch Testing', () => {
  it('should handle [5,2] robot reentry scenario correctly', () => {
    // Recreate the exact scenario from the stuck robot game
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checker on bar (needs to reenter)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'black' }
      },
      // White checker blocking position 20 (counterclockwise perspective)
      // This blocks the 5 die for reentry
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 2, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black robot player with [5, 2] roll
    const player = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [5, 2]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    // Get initial moves and check dice values
    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    expect(initialMoves).toHaveLength(2)

    const initialDieValues = initialMoves.map(m => m.dieValue).sort()
    expect(initialDieValues).toEqual([2, 5])

    console.log('Initial moves:')
    initialMoves.forEach((move, i) => {
      console.log(`  Move ${i}: dieValue=${move.dieValue}, moveKind=${move.moveKind}, possibleMoves=${move.possibleMoves.length}`)
    })

    // Try to execute reentry with the 2 (since 5 is blocked)
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

    // Check that the move executed successfully with the 2
    expect(result.move.stateKind).toBe('completed')
    expect(result.move.dieValue).toBe(2) // Should use the 2 for reentry

    // CRITICAL: Check remaining moves don't have duplicate die values
    const dieValueCounts = allMoves.reduce((acc: any, move: any) => {
      acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
      return acc
    }, {})

    console.log('  Die value counts:', dieValueCounts)

    // For [5,2] roll, should have exactly one move with 5 and one with 2
    expect(dieValueCounts[2]).toBe(1)
    expect(dieValueCounts[5]).toBe(1)
    expect(Object.keys(dieValueCounts)).toHaveLength(2)
  })

  it('should handle regular point-to-point auto-switching correctly', () => {
    // Test regular point-to-point moves with auto-switching
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checker that can move
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 1, color: 'black' }
      },
      // Block destination for die value 6 but allow die value 2
      {
        position: { clockwise: 18, counterclockwise: 7 },
        checkers: { qty: 2, color: 'white' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black player with [6, 2] roll
    const player = Player.initialize('black', 'clockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [6, 2]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    // Find the origin point (position 24 clockwise)
    const origin = play.board.points.find(p => p.position.clockwise === 24)!

    console.log('Testing point-to-point auto-switch [6,2]:')
    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    console.log('Initial moves:')
    initialMoves.forEach((move, i) => {
      console.log(`  Move ${i}: dieValue=${move.dieValue}, possibleMoves=${move.possibleMoves.length}`)
    })

    // Execute the move - should auto-switch to use available die
    const result: BackgammonPlayResult = Play.move(play.board, play, origin)

    console.log(`Executed move: dieValue=${result.move.dieValue}, state=${result.move.stateKind}`)

    const resultPlay = result.play as BackgammonPlayMoving
    const allMoves = Array.from(resultPlay.moves)

    const dieValueCounts = allMoves.reduce((acc: any, move: any) => {
      acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
      return acc
    }, {})

    console.log('Die value counts:', dieValueCounts)

    // Should have no duplicate die values
    expect(dieValueCounts[2]).toBe(1)
    expect(dieValueCounts[6]).toBe(1)
    expect(Object.keys(dieValueCounts)).toHaveLength(2)
  })

  it('should handle doubles correctly without auto-switching', () => {
    // Test that doubles don't trigger auto-switching logic incorrectly
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black player with [3, 3] doubles
    const player = Player.initialize('black', 'clockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [3, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    console.log('Testing doubles [3,3]:')
    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    console.log(`Initial moves count: ${initialMoves.length}`)

    // Should have 4 moves for doubles
    expect(initialMoves).toHaveLength(4)

    // All should have die value 3
    const allDieValues = initialMoves.map(m => m.dieValue)
    expect(allDieValues).toEqual([3, 3, 3, 3])

    // Execute one move
    const origin = play.board.points.find(p => p.position.clockwise === 24)!
    const result: BackgammonPlayResult = Play.move(play.board, play, origin)

    const resultPlay = result.play as BackgammonPlayMoving
    const remainingMoves = Array.from(resultPlay.moves).filter((m: any) => m.stateKind === 'ready')

    console.log(`Remaining moves after execution: ${remainingMoves.length}`)

    // Should have 3 remaining moves, all with die value 3
    expect(remainingMoves).toHaveLength(3)
    remainingMoves.forEach((move: any) => {
      expect(move.dieValue).toBe(3)
    })
  })

  it('should handle multiple move execution correctly', () => {
    // Test executing multiple moves in sequence
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black player with [5, 1] roll
    const player = Player.initialize('black', 'clockwise', 'rolling', false) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [5, 1]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    let currentPlay = Play.initialize(board, movingPlayer)

    console.log('Testing multiple move execution [5,1]:')

    // Execute first move
    const origin = currentPlay.board.points.find(p => p.position.clockwise === 24)!
    let result = Play.move(currentPlay.board, currentPlay, origin)

    console.log(`First move: dieValue=${result.move.dieValue}`)

    let playAfterFirst = result.play as BackgammonPlayMoving
    let remainingAfterFirst = Array.from(playAfterFirst.moves).filter((m: any) => m.stateKind === 'ready')

    if (remainingAfterFirst.length > 0) {
      console.log(`Remaining after first: ${remainingAfterFirst.length} moves`)

      // Execute second move if available
      const secondMoveOrigin = remainingAfterFirst[0].origin
      if (secondMoveOrigin) {
        const secondResult = Play.move(playAfterFirst.board, playAfterFirst, secondMoveOrigin)

        console.log(`Second move: dieValue=${secondResult.move.dieValue}`)

        const playAfterSecond = secondResult.play as BackgammonPlayMoving
        const allFinalMoves = Array.from(playAfterSecond.moves)

        // Check final state has correct die values
        const finalDieValueCounts = allFinalMoves.reduce((acc: any, move: any) => {
          acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
          return acc
        }, {})

        console.log('Final die value counts:', finalDieValueCounts)

        // Should have one move with 5 and one with 1
        expect(finalDieValueCounts[1]).toBe(1)
        expect(finalDieValueCounts[5]).toBe(1)
        expect(Object.keys(finalDieValueCounts)).toHaveLength(2)
      }
    }
  })
})