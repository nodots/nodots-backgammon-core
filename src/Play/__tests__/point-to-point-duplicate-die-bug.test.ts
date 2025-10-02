import { describe, it, expect } from '@jest/globals'
import { Play } from '../../Play'
import { Board } from '../../Board'
import { Player } from '../../Player'
import {
  BackgammonMoveReady,
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling
} from '@nodots-llc/backgammon-types'

describe('Point-to-Point Duplicate Die Bug', () => {
  it('should create distinct die values [4,3] for normal point-to-point moves', () => {
    console.log('🔍 === TESTING POINT-TO-POINT DUPLICATE DIE BUG ===')

    // Create a simple board with checkers in normal positions (NO bar checkers)
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checkers on normal starting positions
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: 'black' }
      },
      {
        position: { clockwise: 13, counterclockwise: 12 },
        checkers: { qty: 5, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Test different player configurations to isolate the bug
    const testCases = [
      { color: 'black', direction: 'clockwise', isRobot: false, description: 'Black Human Clockwise' },
      { color: 'black', direction: 'clockwise', isRobot: true, description: 'Black Robot Clockwise' },
      { color: 'black', direction: 'counterclockwise', isRobot: false, description: 'Black Human Counterclockwise' },
      { color: 'black', direction: 'counterclockwise', isRobot: true, description: 'Black Robot Counterclockwise' },
      { color: 'white', direction: 'clockwise', isRobot: false, description: 'White Human Clockwise' },
      { color: 'white', direction: 'clockwise', isRobot: true, description: 'White Robot Clockwise' },
      { color: 'white', direction: 'counterclockwise', isRobot: false, description: 'White Human Counterclockwise' },
      { color: 'white', direction: 'counterclockwise', isRobot: true, description: 'White Robot Counterclockwise' }
    ]

    testCases.forEach(testCase => {
      console.log(`\n📍 Testing: ${testCase.description}`)

      const player = Player.initialize(
        testCase.color as any,
        testCase.direction as any,
        'rolling',
        testCase.isRobot
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player)
      rolledPlayer.dice.currentRoll = [4, 3]
      const movingPlayer = Player.toMoving(rolledPlayer)

      const play = Play.initialize(board, movingPlayer)
      const moves = Array.from(play.moves) as BackgammonMoveReady[]
      const dieValues = moves.map(m => m.dieValue).sort()

      console.log(`  Moves: ${moves.length}, Die values: [${dieValues.join(', ')}]`)

      if (dieValues.length !== 2 || dieValues[0] !== 3 || dieValues[1] !== 4) {
        console.log(`  🚨 BUG FOUND: Expected [3, 4], got [${dieValues.join(', ')}]`)
      } else {
        console.log(`  ✅ Correct: [3, 4]`)
      }

      // Record the results but don't fail the test yet - just gather data
      expect(moves.length).toBe(2) // Should always have 2 moves for non-doubles
    })

    console.log('\n🔍 Test complete - check output for patterns')
  })

  it('should isolate the exact conditions causing duplicate die values', () => {
    console.log('\n🎯 === ISOLATING DUPLICATE DIE VALUE CONDITIONS ===')

    // Start with the simplest possible scenario
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 1, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Test the specific failing case from our earlier test
    const player = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [4, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    console.log('Player configuration:')
    console.log('  Color:', movingPlayer.color)
    console.log('  Direction:', movingPlayer.direction)
    console.log('  IsRobot:', movingPlayer.isRobot)
    console.log('  Roll:', movingPlayer.dice.currentRoll)

    const play = Play.initialize(board, movingPlayer)
    const moves = Array.from(play.moves) as BackgammonMoveReady[]

    console.log('\nMove analysis:')
    moves.forEach((move, i) => {
      console.log(`  Move ${i}: dieValue=${move.dieValue}, moveKind=${move.moveKind}, stateKind=${move.stateKind}`)
      const firstPossibleMove = move.possibleMoves?.[0]
      console.log(`    Origin: ${firstPossibleMove?.origin?.kind} at position ${JSON.stringify(firstPossibleMove?.origin?.position)}`)
      console.log(`    Possible moves: ${move.possibleMoves.length}`)
    })

    const dieValues = moves.map(m => m.dieValue).sort()
    console.log(`\nFinal die values: [${dieValues.join(', ')}]`)

    if (dieValues[0] === dieValues[1]) {
      console.log('🚨 DUPLICATE DIE VALUES CONFIRMED - both moves have same dieValue!')
    }

    // This should pass when the bug is fixed
    expect(dieValues).toEqual([3, 4])
  })
})