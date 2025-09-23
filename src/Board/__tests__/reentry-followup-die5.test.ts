import { Board, Player, Dice } from '../..'
import type { BackgammonBoard, BackgammonCheckerContainerImport, BackgammonMoveSkeleton, BackgammonPlayerMoving } from '@nodots-llc/backgammon-types/dist'

describe('Re-entry followed by die-5 move availability (white clockwise, [5,1])', () => {
  const makeBoard = (): BackgammonBoard => {
    const spec: BackgammonCheckerContainerImport[] = [
      // White on bar
      { position: 'bar', direction: 'clockwise', checkers: { color: 'white', qty: 1 } },
      // White checkers at points 7 and 6 (clockwise)
      { position: { clockwise: 7, counterclockwise: 18 }, checkers: { color: 'white', qty: 1 } },
      { position: { clockwise: 6, counterclockwise: 19 }, checkers: { color: 'white', qty: 1 } },
      // Keep landing targets unblocked (2 and 1 should be open or blot for hits)
      { position: { clockwise: 1, counterclockwise: 24 }, checkers: { color: 'black', qty: 1 } },
    ]
    return Board.initialize(spec)
  }

  const makePlayer = (): BackgammonPlayerMoving => {
    const p = Player.initialize('white', 'clockwise', 'moving', false, 'test-user') as BackgammonPlayerMoving
    p.dice = Dice.initialize('white', 'rolled', p.dice.id, [5, 1])
    return p
  }

  it('allows a follow-up die-5 move from 7 or 6 after re-entry with 1', () => {
    const board = makeBoard()
    const player = makePlayer()

    // Re-entry with 1
    const reentryMoves = Board.getPossibleMoves(board, player, 1) as BackgammonMoveSkeleton[]
    const bar = board.bar[player.direction]
    const reentry = reentryMoves.find(m => m.origin?.id === bar.id)
    expect(reentry).toBeTruthy()

    const boardAfterReentry = Board.moveChecker(
      board,
      reentry!.origin!,
      reentry!.destination as any,
      player.direction
    )

    // Now test die 5
    const die5Moves = Board.getPossibleMoves(boardAfterReentry, player, 5) as BackgammonMoveSkeleton[]
    const p7 = boardAfterReentry.points.find(pt => pt.position[player.direction] === 7)!
    const p6 = boardAfterReentry.points.find(pt => pt.position[player.direction] === 6)!
    const p2 = boardAfterReentry.points.find(pt => pt.position[player.direction] === 2)!
    const p1 = boardAfterReentry.points.find(pt => pt.position[player.direction] === 1)!

    const move7to2 = die5Moves.find(m => m.origin?.id === p7.id && (m.destination as any)?.id === p2.id)
    const move6to1 = die5Moves.find(m => m.origin?.id === p6.id && (m.destination as any)?.id === p1.id)

    expect(move7to2 || move6to1).toBeTruthy()
  })
})

