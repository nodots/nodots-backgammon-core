/**
 * Integration: verify GNU step 2 remains legal after step 1 for a captured
 * failure fixture. This isolates plan staleness vs CORE recompute mismatch.
 *
 * Requires:
 * - RUN_GNUBG_HINTS=1
 * - FAILURE_GAME_PATH=/absolute/or/relative/path/to/json
 */

import { describe, expect, it } from '@jest/globals'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { Game } from '../Game'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import type { BackgammonMoveDirection } from '@nodots-llc/backgammon-types'
import fs from 'fs'
import path from 'path'

const RUN = process.env.RUN_GNUBG_HINTS === '1'
const fixturePath = process.env.FAILURE_GAME_PATH
const itfn = RUN && fixturePath ? it : it.skip

describe('GNU plan step 2 vs CORE recompute (fixture)', () => {
  itfn('GNU step 2 remains legal after step 1 execution', async () => {
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
    const raw = fs.readFileSync(resolved, 'utf-8')
    const fixture = JSON.parse(raw)
    const game = fixture.game as any

    expect(game?.stateKind).toBe('moving')
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
    expect(plan.length).toBeGreaterThanOrEqual(2)

    const [step1, step2] = plan
    const dir = activePlayer.direction as BackgammonMoveDirection
    const origin1 =
      step1.moveKind === 'reenter'
        ? game.board.bar[dir]
        : game.board.points.find((p: any) => p.position[dir] === step1.from)
    expect(origin1).toBeDefined()

    const afterStep1 = Game.executeAndRecalculate(game, origin1!.id)
    const readyMoves = (afterStep1 as any).activePlay?.moves || []

    const matchesStep2 = readyMoves.some((m: any) =>
      Array.isArray(m.possibleMoves) &&
      m.possibleMoves.some((pm: any) => {
        const opos = pm?.origin?.position?.[dir]
        const dpos = pm?.destination?.position?.[dir]
        if (step2.moveKind === 'reenter') {
          return pm?.origin?.kind === 'bar' && dpos === step2.to
        }
        if (step2.moveKind === 'bear-off') {
          return pm?.destination?.kind === 'off' && opos === step2.from
        }
        return opos === step2.from && dpos === step2.to
      })
    )

    expect(matchesStep2).toBe(true)
  })
})
