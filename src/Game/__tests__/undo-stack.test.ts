import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Game } from '..'
import { Player } from '../../Player'
import { Play } from '../../Play'
import { Cube } from '../../Cube'
import type {
  BackgammonCheckerContainerImport,
  BackgammonGameMoving,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
} from '@nodots-llc/backgammon-types'

// Helper to define a point by counterclockwise position
const pointCC = (
  posCC: number,
  qty: number,
  color: 'black' | 'white'
): BackgammonCheckerContainerImport => ({
  position: {
    clockwise: (25 - posCC) as any,
    counterclockwise: posCC as any,
  },
  checkers: { qty, color },
})

/**
 * Helper: create a moving game with a black checker at CC 24
 * and a simple board where die 1 is usable (CC 23 is empty).
 */
function createMovingGame(): BackgammonGameMoving {
  const boardImport: BackgammonCheckerContainerImport[] = [
    pointCC(24, 2, 'black'), // two black checkers at CC 24
    pointCC(18, 2, 'white'), // block die 6 destination
  ]

  const board = Board.buildBoard(boardImport)

  const blackRolling = Player.initialize(
    'black',
    'counterclockwise',
    'rolling',
    false
  ) as BackgammonPlayerRolling
  const blackRolled = Player.roll(blackRolling)
  blackRolled.dice.currentRoll = [6, 1]
  const blackMoving = Player.toMoving(blackRolled)

  const whiteInactive = Player.initialize(
    'white',
    'clockwise',
    'inactive',
    false
  ) as BackgammonPlayerInactive

  const play = Play.initialize(board, blackMoving)

  return Game.initialize(
    [blackMoving, whiteInactive] as any,
    'test-game',
    'moving',
    board,
    Cube.initialize(),
    play,
    'black',
    blackMoving,
    whiteInactive
  ) as BackgammonGameMoving
}

describe('Undo Stack (issue #95)', () => {
  it('Game.move() pushes exactly 1 undo snapshot per move', () => {
    const game = createMovingGame()

    // Before any move, undo should not be possible
    expect(Game.canUndoActivePlay(game)).toBe(false)

    // Find a black checker to move
    const checker = Board.getCheckers(game.board).find(
      (c) => c.color === 'black'
    )!
    expect(checker).toBeDefined()

    // Make one move
    const afterMove = Game.move(game, checker.id)

    // Should have exactly 1 undo frame
    const ap: any = (afterMove as any).activePlay
    expect(ap.undo).toBeDefined()
    expect(ap.undo.frames).toHaveLength(1)
    expect(Game.canUndoActivePlay(afterMove)).toBe(true)
  })

  it('Game.executeAndRecalculate() pushes exactly 1 undo snapshot (not 2)', () => {
    const game = createMovingGame()

    // Find the origin point with a black checker
    const originPoint = Board.getPoints(game.board).find((p) =>
      p.checkers.some((c) => c.color === 'black')
    )!

    // Execute via executeAndRecalculate
    const afterMove = Game.executeAndRecalculate(game, originPoint.id)

    // Should still have exactly 1 undo frame, not 2
    const ap: any = (afterMove as any).activePlay
    if (ap?.undo) {
      expect(ap.undo.frames.length).toBe(1)
    }
  })

  it('undoLastInActivePlay restores the pre-move board state', () => {
    const game = createMovingGame()

    // Capture pre-move board state
    const preMovePointCheckerCounts = Board.getPoints(game.board).map(
      (p) => p.checkers.length
    )

    // Make a move
    const checker = Board.getCheckers(game.board).find(
      (c) => c.color === 'black'
    )!
    const afterMove = Game.move(game, checker.id)

    // Undo the move
    const restored = Game.undoLastInActivePlay(afterMove)

    // Board should match pre-move state
    expect(restored.stateKind).toBe('moving')
    const restoredPointCheckerCounts = Board.getPoints(restored.board).map(
      (p) => p.checkers.length
    )
    expect(restoredPointCheckerCounts).toEqual(preMovePointCheckerCounts)

    // After undo, no more frames should remain
    expect(Game.canUndoActivePlay(restored)).toBe(false)
  })
})
