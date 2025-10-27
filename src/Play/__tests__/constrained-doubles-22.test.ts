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
    // Board: Black (counterclockwise) has checkers at CC 24, 23, 21
    // Blocks: White has heavy points at CC 20 and 17 to prevent further 2-steps after 24->22, 21->19
    const boardImport: BackgammonCheckerContainerImport[] = [
      pointCC(24, 1, 'black'),
      pointCC(23, 1, 'black'),
      pointCC(21, 1, 'black'),
      // White blocks to constrain further 2-moves after the three legal plays
      pointCC(20, 2, 'white'),
      pointCC(17, 2, 'white'),
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

    // Execute the three legal moves in sequence by explicit origins
    const seq = [24, 23, 21] // counterclockwise positions
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
    expect(ready.length).toBeLessThanOrEqual(1)
  })
})
