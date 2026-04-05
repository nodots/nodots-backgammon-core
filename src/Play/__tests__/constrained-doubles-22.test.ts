import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Play } from '../../Play'
import { Player } from '../../Player'
import type {
  BackgammonCheckerContainerImport,
  BackgammonMoveOrigin,
  BackgammonPlayMoving,
  BackgammonPlayerRolling,
} from '@nodots-llc/backgammon-types'

// Helper to build a point with a given counterclockwise position
function pointCC(posCC: number, qty: number, color: 'black' | 'white'): BackgammonCheckerContainerImport {
  // Dual position mapping: clockwise = 25 - counterclockwise
  return {
    position: { clockwise: 25 - posCC, counterclockwise: posCC },
    checkers: { qty, color },
  }
}

// Find an origin in current play's possible moves by counterclockwise position
function findOriginByCCPos(play: BackgammonPlayMoving, board: any, ccPos: number): BackgammonMoveOrigin | undefined {
  const readyMoves = play.moves.filter((m: any) => m.stateKind === 'ready')
  for (const m of readyMoves) {
    for (const pm of m.possibleMoves || []) {
      const pos = (pm.origin as any).position?.counterclockwise
      if (pos === ccPos) return pm.origin as BackgammonMoveOrigin
    }
  }
  return undefined
}

describe('Constrained doubles [2,2] yields exactly 3 legal moves (remaining becomes no-move)', () => {
  it('converts the final unusable double to a completed no-move', () => {
    // Board: Black (counterclockwise) has 3 checkers at CC 8, 6, 4
    // White blocks CC 2 to constrain the 4th move after 8->6, 6->4, 6->4
    //
    // Sequence with [2,2]:
    // - Move 1: 8->6 (stack on 6)
    // - Move 2: 6->4 (stack on 4)
    // - Move 3: 6->4 (move remaining checker from 6)
    // - Move 4: 4->2 BLOCKED (white at 2) -> should become no-move
    const boardImport: BackgammonCheckerContainerImport[] = [
      pointCC(8, 1, 'black'),
      pointCC(6, 1, 'black'),
      pointCC(4, 1, 'black'),
      // White blocks position 2 to prevent bearing off approach
      pointCC(2, 2, 'white'),
    ]

    const board = Board.initialize(boardImport)

    // Create black robot player with [2,2] roll moving counterclockwise
    const rolling = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolled = Player.roll(rolling)
    rolled.dice.currentRoll = [2, 2]
    const moving = Player.toMoving(rolled)

    // Initialize play for doubles
    let play = Play.initialize(board, moving)
    let currentBoard = board

    // Execute moves: 8->6, then 6->4 twice (using the stacked checkers)
    // After move 1 (8->6): 6 has 2 black, 4 has 1 black
    // After move 2 (6->4): 6 has 1 black, 4 has 2 black
    // After move 3 (6->4): 4 has 3 black, 6 is empty
    // Move 4: only option is 4->2 which is blocked
    const seq = [8, 6, 6] // counterclockwise positions to move from
    for (const ccPos of seq) {
      const origin = findOriginByCCPos(play as BackgammonPlayMoving, currentBoard, ccPos)
      expect(origin).toBeTruthy()
      const result = Play.move(currentBoard, play as BackgammonPlayMoving, origin!)
      play = result.play as BackgammonPlayMoving
      currentBoard = result.board
    }

    const movesArray = Array.from((play as BackgammonPlayMoving).moves)
    const completed = movesArray.filter((m: any) => m.stateKind === 'completed')
    const noMoves = completed.filter((m: any) => m.moveKind === 'no-move')
    const ready = movesArray.filter((m: any) => m.stateKind === 'ready')

    // Expect 4 recorded moves and at least one completed no-move after exhausting legal 2-steps
    // (In constrained positions, remaining double(s) must convert to no-move.)
    expect(movesArray.length).toBe(4)
    expect(noMoves.length).toBeGreaterThanOrEqual(1)
    // If any ready moves remain here, they should be the only ones and must be executable
    // (sanitization ensures non-executable ready moves become no-move)
    expect(ready.length).toBeLessThanOrEqual(0)
  })
})
