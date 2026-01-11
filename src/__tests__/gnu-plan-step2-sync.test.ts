/**
 * Integration: ensure GNU step 2 remains legal after executing step 1
 * via CORE's executeAndRecalculate.
 *
 * Skipped unless RUN_GNUBG_HINTS=1.
 */

import { describe, expect, it } from '@jest/globals'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { Board } from '../Board'
import { Game } from '../Game'
import { Play } from '../Play'
import { Player } from '../Player'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import type { BackgammonMoveDirection } from '@nodots-llc/backgammon-types'

const RUN = process.env.RUN_GNUBG_HINTS === '1'
const itfn = RUN ? it : it.skip

describe('GNU plan step 2 vs CORE recompute', () => {
  itfn('GNU step 2 remains legal after step 1 execution', async () => {
    await GnuBgHints.initialize()

    const board = Board.initialize()
    const player = Player.initialize(
      'white',
      'clockwise',
      'rolling',
      true
    )
    const rolled = Player.roll(player)
    rolled.dice.currentRoll = [3, 2]
    const movingPlayer = Player.toMoving(rolled)

    const inactivePlayer = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      false
    )
    const activePlay = Play.initialize(board, movingPlayer)
    const game = Game.initialize(
      [movingPlayer, inactivePlayer] as any,
      'game-plan-step2',
      'moving',
      board,
      undefined as any,
      activePlay as any,
      movingPlayer.color,
      movingPlayer,
      inactivePlayer as any
    )

    const pid = exportToGnuPositionId(game as any)
    const hints = await GnuBgHints.getHintsFromPositionId(
      pid,
      [3, 2],
      1,
      movingPlayer.direction,
      movingPlayer.color
    )
    const plan = hints[0]?.moves || []
    expect(plan.length).toBeGreaterThanOrEqual(2)

    const [step1, step2] = plan
    if (step1.player && step1.player !== movingPlayer.color) {
      throw new Error(
        `GNU step1 player mismatch: expected ${movingPlayer.color}, got ${step1.player}`
      )
    }
    const dir = movingPlayer.direction as BackgammonMoveDirection
    const altDir = dir === 'clockwise' ? 'counterclockwise' : 'clockwise'

    const origin1 =
      step1.moveKind === 'reenter'
        ? board.bar[dir]
        : board.points.find((p) => p.position[dir] === step1.from)
    expect(origin1).toBeDefined()

    const checker = origin1!.checkers.find(
      (c: any) => c.color === movingPlayer.color
    )
    if (!checker) {
      const altOrigin =
        step1.moveKind === 'reenter'
          ? board.bar[altDir]
          : board.points.find((p) => p.position[altDir] === step1.from)
      const originColors = origin1!.checkers.map((c: any) => c.color)
      const altColors = altOrigin?.checkers?.map((c: any) => c.color) ?? []
      throw new Error(
        `No ${movingPlayer.color} checker at step1.from=${step1.from}; originColors=${originColors.join(',')}; altDir=${altDir} altColors=${altColors.join(',')}`
      )
    }

    const afterStep1 = Game.executeAndRecalculate(
      game as any,
      origin1!.id
    )

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
