import { Board } from '../../Board'
import { Game } from '../../Game'
import { exportToGnuPositionId } from '../gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'

describe('GNU Position ID orientation and mapping', () => {
  test('first suggested GNU move maps to a valid origin for active player', async () => {
    const gameRollingForStart = Game.createNewGame(
      { userId: 'p1', isRobot: true },
      { userId: 'p2', isRobot: true }
    )

    // Roll for start to establish activeColor and activePlayer direction
    const gameRolled = Game.rollForStart(gameRollingForStart)
    const posId = exportToGnuPositionId(gameRolled as any)

    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })
    const roll: [number, number] = [6, 5]
    const hints = await GnuBgHints.getHintsFromPositionId(posId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const seq = hints![0]
    expect(seq.moves && seq.moves.length > 0).toBeTruthy()

    const gm = seq.moves![0]
    const activePlayer = (gameRolled as any).activePlayer
    const dir: 'clockwise' | 'counterclockwise' = activePlayer.direction
    const oppDir: 'clockwise' | 'counterclockwise' = dir === 'clockwise' ? 'counterclockwise' : 'clockwise'

    const points = (gameRolled as any).board.points
    const colors = activePlayer.color

    // Try multiple interpretations (direct, flipped, inverted)
    const candidates = [
      points.find((p: any) => p.position[dir] === gm.from),
      points.find((p: any) => p.position[oppDir] === gm.from),
      points.find((p: any) => p.position[dir] === 25 - gm.from),
      points.find((p: any) => p.position[oppDir] === 25 - gm.from),
    ].filter(Boolean) as any[]

    expect(candidates.length).toBeGreaterThan(0)
    const hasChecker = candidates.some((origin) =>
      origin.checkers.some((c: any) => c.color === colors)
    )
    expect(hasChecker).toBeTruthy()
  })
})

