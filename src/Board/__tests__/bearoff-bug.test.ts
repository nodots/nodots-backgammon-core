import { describe, expect, it } from '@jest/globals'
import { BackgammonCheckerContainerImport } from '@nodots-llc/backgammon-types/dist'
import { Board } from '..'

describe('Bear-off Bug Reproduction', () => {
  it('should find forced moves for counterclockwise player with [5,5] in bear-off situation', () => {
    console.log('=== Testing Bear-off Bug Scenario ===')

    // Create a board setup where black (counterclockwise) player is bearing off
    // and rolls [5,5] but should have FORCED moves available
    const bugScenarioBoardImport: BackgammonCheckerContainerImport[] = [
      // Black checkers in home board (counterclockwise positions 1-6 = clockwise positions 24-19)
      {
        position: { clockwise: 22, counterclockwise: 3 }, // counterclockwise position 3
        checkers: { qty: 2, color: 'black' },
      },
      {
        position: { clockwise: 21, counterclockwise: 4 }, // counterclockwise position 4
        checkers: { qty: 3, color: 'black' },
      },
      // NO CHECKERS on position 5 (counterclockwise) - omit from board setup
      {
        position: { clockwise: 19, counterclockwise: 6 }, // counterclockwise position 6
        checkers: { qty: 2, color: 'black' },
      },
      // Additional checkers to total 15
      {
        position: { clockwise: 24, counterclockwise: 1 }, // counterclockwise position 1
        checkers: { qty: 8, color: 'black' },
      },
      // White checkers already off (to simulate late game)
    ]

    const board = Board.initialize(bugScenarioBoardImport)
    const blackPlayer = { color: 'black', direction: 'counterclockwise' } as any

    console.log('Board setup:')
    console.log(Board.getAsciiBoard(board))

    // Test all four dice of [5,5]
    console.log('\n=== Testing die value 5 for [5,5] roll ===')

    for (let dieNum = 1; dieNum <= 4; dieNum++) {
      console.log(`\n--- Testing die ${dieNum} (value 5) ---`)

      const movesForDie5 = Board.getPossibleMoves(board, blackPlayer, 5)
      console.log(`Moves found for die 5: ${movesForDie5.length}`)

      if (movesForDie5.length === 0) {
        console.log('❌ BUG REPRODUCED: No moves found for die 5!')
        console.log(
          'Expected: Should be able to bear off from highest position < 5'
        )
        console.log(
          'Black checkers are on positions: 1, 3, 4, 6 (counterclockwise)'
        )
        console.log('Die 5 should allow bear-off from position 4 (highest < 5)')
      } else {
        console.log('✅ Moves found for die 5:')
        movesForDie5.forEach((move, i) => {
          const originPos =
            move.origin.kind === 'point'
              ? move.origin.position.counterclockwise
              : move.origin.kind
          const destKind = move.destination.kind
          console.log(`  Move ${i}: position ${originPos} → ${destKind}`)
        })
      }

      // The key test: should have at least one move for each die 5
      expect(movesForDie5.length).toBeGreaterThan(0)
    }

    console.log('\n=== Analysis ===')
    console.log('For roll [5,5], black player should have 4 forced moves:')
    console.log('- No checker on position 5 (counterclockwise)')
    console.log('- Highest position < 5 with checkers is position 4')
    console.log('- All four 5s should allow bear-off from position 4')
    console.log('- This is the "higher die rule" for bear-off')
  })

  it('should handle bear-off edge case: no checkers at exact die position', () => {
    console.log('\n=== Testing Higher Die Rule ===')

    // Setup: player has checkers on positions 1, 2 but NOT on position 3
    // Roll: die 3 should allow bear-off from position 2 (highest < 3)
    // NO checkers on positions 4-6 so higher die rule applies
    const edgeCaseBoardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 10, color: 'white' },
      },
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: { qty: 5, color: 'white' },
      },
      // NO CHECKERS on positions 3, 4, 5, 6 - this is key for higher die rule
    ]

    const board = Board.initialize(edgeCaseBoardImport)
    const whitePlayer = { color: 'white', direction: 'clockwise' } as any

    console.log('Edge case board setup:')
    console.log(Board.getAsciiBoard(board))

    const movesForDie3 = Board.getPossibleMoves(board, whitePlayer, 3)
    console.log(`\nMoves for die 3: ${movesForDie3.length}`)

    if (movesForDie3.length === 0) {
      console.log('❌ BUG: No moves found for die 3')
      console.log('Expected: Should bear off from position 2 (highest < 3)')
    } else {
      console.log('✅ Moves found:')
      movesForDie3.forEach((move, i) => {
        const originPos =
          move.origin.kind === 'point'
            ? move.origin.position.clockwise
            : move.origin.kind
        const destKind = move.destination.kind
        console.log(`  Move ${i}: position ${originPos} → ${destKind}`)
      })

      // Should find exactly one move: bear off from position 2
      const bearOffFromPos2 = movesForDie3.find(
        (move) =>
          move.origin.kind === 'point' &&
          move.origin.position.clockwise === 2 &&
          move.destination.kind === 'off'
      )
      expect(bearOffFromPos2).toBeDefined()
    }

    expect(movesForDie3.length).toBeGreaterThan(0)
  })
})
