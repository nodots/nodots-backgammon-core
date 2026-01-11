/**
 * Integration: verify activePlay ready moves include GNUBG's first move
 * for a captured failure fixture.
 *
 * Requires:
 * - RUN_GNUBG_HINTS=1
 * - FAILURE_GAME_PATH=/absolute/or/relative/path/to/json
 */

import { describe, expect, it } from '@jest/globals'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import type { BackgammonMoveDirection } from '@nodots-llc/backgammon-types'
import fs from 'fs'
import path from 'path'

const RUN = process.env.RUN_GNUBG_HINTS === '1'
const fixturePath = process.env.FAILURE_GAME_PATH
const itfn = RUN && fixturePath ? it : it.skip

describe('activePlay vs GNUBG first move (fixture)', () => {
  itfn('activePlay includes GNUBG first move', async () => {
    await GnuBgHints.initialize()
    const rawPath = fixturePath as string
    const candidates = path.isAbsolute(rawPath)
      ? [rawPath]
      : [
          path.resolve(process.cwd(), rawPath),
          path.resolve(process.cwd(), '..', '..', rawPath),
        ]
    const resolved = candidates.find((p) => fs.existsSync(p))
    if (!resolved) {
      throw new Error(`Failure fixture not found: ${rawPath}`)
    }
    const fixture = JSON.parse(fs.readFileSync(resolved, 'utf-8'))
    const game = fixture.game as any

    const activePlayer = game.activePlayer
    const roll = activePlayer?.dice?.currentRoll as [number, number]
    expect(Array.isArray(roll)).toBe(true)

    const pid = exportToGnuPositionId(game)
    const hints = await GnuBgHints.getHintsFromPositionId(
      pid,
      roll,
      1,
      activePlayer.direction,
      activePlayer.color
    )
    const plan = hints[0]?.moves || []
    expect(plan.length).toBeGreaterThanOrEqual(1)

    const step1 = plan[0]
    const dir = activePlayer.direction as BackgammonMoveDirection
    const moves = Array.from(game.activePlay?.moves || [])

    const matches = moves.some((m: any) =>
      Array.isArray(m.possibleMoves) &&
      m.possibleMoves.some((pm: any) => {
        const opos = pm?.origin?.position?.[dir]
        const dpos = pm?.destination?.position?.[dir]
        if (step1.moveKind === 'reenter') {
          return pm?.origin?.kind === 'bar' && dpos === step1.to
        }
        if (step1.moveKind === 'bear-off') {
          return pm?.destination?.kind === 'off' && opos === step1.from
        }
        return opos === step1.from && dpos === step1.to
      })
    )

    expect(matches).toBe(true)
  })
})
