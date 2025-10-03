/**
 * Test for undoLastMove regression where moves become impossible after undo
 * Bug: After undoing a move, possibleMoves for remaining ready moves contain stale references
 */

import { Game } from '../index'
import { Board } from '../../Board'
import type { BackgammonGameMoving } from '@nodots-llc/backgammon-types'

describe('undoLastMove regression - moves possible after undo', () => {
  it('should allow moves after undoing one of two moves', () => {
    // Create game and progress to moving state
    const game = Game.createNewGame(
      { userId: 'player1', isRobot: false },
      { userId: 'player2', isRobot: false }
    )

    const gameRolledForStart = Game.rollForStart(game as any)
    const gameMoving = Game.roll(gameRolledForStart) as BackgammonGameMoving

    // Verify we're in moving state with moves available
    expect(gameMoving.stateKind).toBe('moving')
    expect(gameMoving.activePlay).toBeDefined()
    expect(gameMoving.activePlay.moves.length).toBeGreaterThan(0)

    // Find a ready move with possibleMoves
    const readyMoves = gameMoving.activePlay.moves.filter(
      m => m.stateKind === 'ready' && m.possibleMoves && m.possibleMoves.length > 0
    )
    expect(readyMoves.length).toBeGreaterThan(0)

    // Execute first move
    const firstMove = readyMoves[0]
    const firstChecker = firstMove.possibleMoves![0].origin!.checkers[0]
    const gameAfterFirstMove = Game.move(gameMoving, firstChecker.id) as BackgammonGameMoving

    expect(gameAfterFirstMove.stateKind).toBe('moving')

    // Verify first move is now completed
    const completedMoves = gameAfterFirstMove.activePlay.moves.filter(
      m => m.stateKind === 'completed' && m.moveKind !== 'no-move'
    )
    expect(completedMoves.length).toBeGreaterThanOrEqual(1)

    // NOW UNDO THE MOVE - this is where the bug occurs
    const undoResult = Game.undoLastMove(gameAfterFirstMove, undefined)

    expect(undoResult.success).toBe(true)
    expect(undoResult.game).toBeDefined()

    const gameAfterUndo = undoResult.game! as BackgammonGameMoving

    // Verify we're still in moving state
    expect(gameAfterUndo.stateKind).toBe('moving')
    expect(gameAfterUndo.activePlay).toBeDefined()

    // CRITICAL TEST: Verify all ready moves have valid possibleMoves
    const readyMovesAfterUndo = gameAfterUndo.activePlay.moves.filter(
      m => m.stateKind === 'ready'
    )

    expect(readyMovesAfterUndo.length).toBeGreaterThan(0)

    for (const move of readyMovesAfterUndo) {
      // Each ready move should have possibleMoves
      expect(move.possibleMoves).toBeDefined()
      expect(Array.isArray(move.possibleMoves)).toBe(true)

      if (move.possibleMoves && move.possibleMoves.length > 0) {
        // Each possibleMove should have valid origin with checkers
        for (const pm of move.possibleMoves) {
          expect(pm.origin).toBeDefined()
          expect(pm.origin!.checkers).toBeDefined()
          expect(pm.origin!.checkers.length).toBeGreaterThan(0)

          // Verify the checker IDs in possibleMoves actually exist on the board
          const boardCheckers = Board.getCheckers(gameAfterUndo.board)
          const checkerIds = boardCheckers.map(c => c.id)

          for (const checker of pm.origin!.checkers) {
            expect(checkerIds).toContain(checker.id)
          }
        }
      }
    }

    // Try to execute a move after undo - this should work
    const readyMoveToExecute = readyMovesAfterUndo.find(
      m => m.possibleMoves && m.possibleMoves.length > 0
    )
    expect(readyMoveToExecute).toBeDefined()

    if (readyMoveToExecute && readyMoveToExecute.possibleMoves && readyMoveToExecute.possibleMoves.length > 0) {
      const checkerToMove = readyMoveToExecute.possibleMoves[0].origin!.checkers[0]

      // This should NOT throw an error - this is the regression test
      expect(() => {
        Game.move(gameAfterUndo, checkerToMove.id)
      }).not.toThrow()
    }
  })
})
