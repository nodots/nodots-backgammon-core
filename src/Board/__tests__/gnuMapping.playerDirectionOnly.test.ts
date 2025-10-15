import { Game } from '../../Game'
import { Board } from '../../Board'
import { exportToGnuPositionId } from '../gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'

describe('GNU mapping using player direction only', () => {
  test('first GNU move origin maps to a playable origin with active dice', async () => {
    // Create a fresh game and determine who starts
    const gameRollingForStart = Game.createNewGame(
      { userId: 'p1', isRobot: true },
      { userId: 'p2', isRobot: true }
    )
    const gameRolled = Game.rollForStart(gameRollingForStart)

    // Roll actual dice to enter moving state
    const gameMoving = Game.roll(gameRolled)
    const active = (gameMoving as any).activePlayer
    const dir: 'clockwise' | 'counterclockwise' = active.direction
    const color: 'white' | 'black' = active.color

    // Export position in GNU format and query GNU for hints with current roll
    const positionId = exportToGnuPositionId(gameMoving as any)
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })
    const rollTuple = active.dice.currentRoll as [number, number]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, rollTuple as any)
    expect(hints && hints.length > 0 && hints[0].moves && hints[0].moves.length > 0).toBeTruthy()

    const gm = hints![0].moves![0]

    // Map GNU origin using the active player's own direction only
    const points = (gameMoving as any).board.points
    const origin = gm.moveKind === 'reenter'
      ? (gameMoving as any).board.bar[dir]
      : points.find((p: any) => p.position[dir] === (gm as any).from)

    expect(origin).toBeTruthy()
    expect(origin!.checkers.some((c: any) => c.color === color)).toBe(true)

    // Verify at least one ready die has a possible move from that origin
    const readyMoves = Array.from((gameMoving as any).activePlay.moves).filter((m: any) => m.stateKind === 'ready')
    const canPlayFromOrigin = readyMoves.some((m: any) => {
      const pm = Board.getPossibleMoves(
        (gameMoving as any).board,
        (gameMoving as any).activePlay.player,
        m.dieValue
      ) as any[] | { moves: any[] }
      const movesArr = Array.isArray(pm) ? pm : pm.moves
      return movesArr.some((mv: any) => mv.origin?.id === origin.id)
    })
    expect(canPlayFromOrigin).toBe(true)
  })
})

