/**
 * Investigation test: Verify behavior when one die has no legal moves
 *
 * Hypothesis: When die 6 has no legal moves but die 1 does:
 * - player.dice.currentRoll still shows [6, 1]
 * - moves array has 2 entries
 * - die 6 move has stateKind: 'completed', moveKind: 'no-move'
 * - die 1 move has stateKind: 'ready'
 * - filtering for ready moves loses die 6
 */

import { Board } from '../Board'
import { Play } from '../Play'
import type {
  BackgammonBoard,
  BackgammonPlayerMoving,
  BackgammonColor,
  BackgammonMoveDirection,
} from '@nodots/backgammon-types'

describe('Blocked Die Investigation', () => {
  it('should show dice.currentRoll differs from ready moves when one die is blocked', () => {
    // Create a board where white has a checker that can move 1 but not 6
    // Put white checker at position 4, with black blocking positions 1-6 except position 3
    const board = createBoardWithBlockedDie()

    const player: BackgammonPlayerMoving = {
      id: 'white-player',
      color: 'white' as BackgammonColor,
      direction: 'clockwise' as BackgammonMoveDirection,
      dice: {
        id: 'dice-1',
        color: 'white',
        stateKind: 'rolled',
        currentRoll: [6, 1] as [number, number],
        total: 7,
      },
      pipCount: 100,
      stateKind: 'moving',
    } as BackgammonPlayerMoving

    // Initialize the play
    const play = Play.initialize(board, player)

    // Log what we find
    console.log('=== INVESTIGATION RESULTS ===')
    console.log('player.dice.currentRoll:', player.dice.currentRoll)
    console.log('play.moves count:', play.moves.length)

    for (const move of play.moves as any[]) {
      console.log(`  Die ${move.dieValue}: stateKind=${move.stateKind}, moveKind=${move.moveKind}, possibleMoves=${move.possibleMoves?.length || 0}`)
    }

    const readyMoves = (play.moves as any[]).filter(m => m.stateKind === 'ready')
    console.log('Ready moves count:', readyMoves.length)
    console.log('Ready move die values:', readyMoves.map(m => m.dieValue))

    // Derive roll the buggy way
    const d1 = readyMoves[0]?.dieValue ?? 1
    const d2 = readyMoves[1]?.dieValue ?? d1
    const derivedRoll = [d1, d2]
    console.log('Derived roll (buggy way):', derivedRoll)
    console.log('Actual roll:', player.dice.currentRoll)
    console.log('Match:', JSON.stringify(derivedRoll) === JSON.stringify(player.dice.currentRoll))

    // Assertions
    expect(player.dice.currentRoll).toEqual([6, 1])

    // If the hypothesis is correct:
    // - There should be 2 moves
    // - One should be ready (die 1), one should be completed/no-move (die 6)
    // - Derived roll should NOT match actual roll

    // Just log for now - we'll see if the hypothesis holds
  })
})

function createBoardWithBlockedDie(): BackgammonBoard {
  // Create a board where:
  // - White has a single checker at clockwise position 7
  // - Black has 2 checkers at clockwise position 1 (blocking white's 6-move to position 1)
  // - Position 6 is open (white can move 1: 7->6)
  // This should make die 6 blocked but die 1 available

  const points = Array.from({ length: 24 }, (_, i) => {
    const cwPos = i + 1
    const ccwPos = 25 - cwPos
    const checkers: any[] = []

    // White checker at position 7 (can move to 6 with die 1, but 1 is blocked for die 6)
    if (cwPos === 7) {
      checkers.push({ id: 'w1', color: 'white', checkercontainerId: `point-${cwPos}` })
    }

    // Black blockers at position 1 (blocks white's 6-move from position 7)
    if (cwPos === 1) {
      checkers.push(
        { id: 'b1', color: 'black', checkercontainerId: `point-${cwPos}` },
        { id: 'b2', color: 'black', checkercontainerId: `point-${cwPos}` }
      )
    }

    return {
      id: `point-${cwPos}`,
      kind: 'point',
      position: { clockwise: cwPos, counterclockwise: ccwPos },
      checkers,
    }
  })

  return {
    id: 'test-board',
    points,
    bar: {
      clockwise: { id: 'bar-cw', kind: 'bar', direction: 'clockwise', position: { clockwise: 25, counterclockwise: 0 }, checkers: [] },
      counterclockwise: { id: 'bar-ccw', kind: 'bar', direction: 'counterclockwise', position: { clockwise: 0, counterclockwise: 25 }, checkers: [] },
    },
    off: {
      clockwise: { id: 'off-cw', kind: 'off', direction: 'clockwise', position: { clockwise: 0, counterclockwise: 0 }, checkers: [] },
      counterclockwise: { id: 'off-ccw', kind: 'off', direction: 'counterclockwise', position: { clockwise: 0, counterclockwise: 0 }, checkers: [] },
    },
  } as BackgammonBoard
}
