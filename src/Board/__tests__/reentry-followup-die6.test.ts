import { Board, Player, generateId } from '../..'
import type {
  BackgammonBoard,
  BackgammonCheckerContainerImport,
  BackgammonMoveSkeleton,
  BackgammonPlayerMoving,
} from '@nodots-llc/backgammon-types/dist'

/**
 * Regression coverage for mixed re-entry + follow-up die move.
 *
 * Scenario:
 * - White (clockwise) has one checker on the bar and one on point 7 (clockwise).
 * - Black has one checker (a blot) on point 1 (clockwise).
 * - After re-entering with die 1 (bar -> point 24), die 6 should allow 7 -> 1 (hit) for white.
 *
 * Cross-reference: https://github.com/nodots/nodots-backgammon/issues/147
 */
describe('Re-entry followed by die-6 move availability', () => {
  const makePlayer = (): BackgammonPlayerMoving =>
    Player.initialize('white', 'clockwise', 'moving', false, generateId())

  const buildBoard = (blackPoint1Count: number): BackgammonBoard => {
    const importSpec: BackgammonCheckerContainerImport[] = [
      // White on bar (1 checker)
      { position: 'bar', direction: 'clockwise', checkers: { color: 'white', qty: 1 } },
      // White at point 7 (clockwise)
      { position: { clockwise: 7, counterclockwise: 18 }, checkers: { color: 'white', qty: 1 } },
      // Black at point 1 (clockwise) - blot or block depending on qty
      { position: { clockwise: 1, counterclockwise: 24 }, checkers: { color: 'black', qty: blackPoint1Count } },
    ]
    return Board.initialize(importSpec)
  }

  it('allows 7 -> 1 with die 6 after re-entry with die 1 when point 1 is a blot', () => {
    const board = buildBoard(1) // point 1 has a single black checker (blot)
    const player = makePlayer()

    // Step 1: verify re-entry candidates for die 1
    const reentryMoves = Board.getPossibleMoves(board, player, 1) as BackgammonMoveSkeleton[]
    const bar = board.bar[player.direction]
    const reentry = reentryMoves.find((m) => m.origin?.id === bar.id)
    expect(reentry).toBeTruthy()
    expect(reentry!.destination!.kind).toBe('point')
    const destPoint: any = reentry!.destination
    expect(destPoint.position[player.direction]).toBe(24)

    // Simulate re-entry: move checker from bar -> point 24
    const movedBoard = Board.moveChecker(
      board,
      reentry!.origin!,
      reentry!.destination as any,
      player.direction
    )

    // Step 2: verify that die 6 has a legal move 7 -> 1 (hit)
    const die6Moves = Board.getPossibleMoves(movedBoard, player, 6) as BackgammonMoveSkeleton[]
    const point7 = movedBoard.points.find((p) => p.position[player.direction] === 7)!
    const point1 = movedBoard.points.find((p) => p.position[player.direction] === 1)!

    const hitMove = die6Moves.find(
      (m) => m.origin?.id === point7.id && (m.destination as any)?.id === point1.id
    )
    expect(hitMove).toBeTruthy()
  })

  it('has no die-6 move when point 1 is blocked by two or more opposing checkers', () => {
    const board = buildBoard(2) // point 1 blocked (two blacks)
    const player = makePlayer()

    // Step 1: re-entry with die 1
    const reentryMoves = Board.getPossibleMoves(board, player, 1) as BackgammonMoveSkeleton[]
    const bar = board.bar[player.direction]
    const reentry = reentryMoves.find((m) => m.origin?.id === bar.id)
    expect(reentry).toBeTruthy()

    const movedBoard = Board.moveChecker(
      board,
      reentry!.origin!,
      reentry!.destination as any,
      player.direction
    )

    // Step 2: die 6 should not include 7 -> 1 because 1 is blocked
    const die6Moves = Board.getPossibleMoves(movedBoard, player, 6) as BackgammonMoveSkeleton[]
    const point7 = movedBoard.points.find((p) => p.position[player.direction] === 7)!
    const point1 = movedBoard.points.find((p) => p.position[player.direction] === 1)!

    const blocked = die6Moves.find(
      (m) => m.origin?.id === point7.id && (m.destination as any)?.id === point1.id
    )
    expect(blocked).toBeFalsy()
  })
})
