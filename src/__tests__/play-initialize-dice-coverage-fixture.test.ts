/**
 * Integration: ensure Play.initialize includes a ready move for any die
 * that has legal moves according to Board.getPossibleMoves.
 *
 * Requires:
 * - FAILURE_GAME_PATH=/absolute/or/relative/path/to/json
 */

import { describe, expect, it } from '@jest/globals'
import { Board } from '../Board'
import { Play } from '../Play'
import fs from 'fs'
import path from 'path'

const fixturePath = process.env.FAILURE_GAME_PATH
const itfn = fixturePath ? it : it.skip

describe('Play.initialize die coverage (fixture)', () => {
  itfn('includes ready moves for all dice with legal moves', () => {
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
    const board = game.board
    const player = game.activePlayer
    const roll = player?.dice?.currentRoll as [number, number]
    expect(Array.isArray(roll)).toBe(true)

    const play = Play.initialize(board, player)
    const readyMoves = Array.from(play.moves || []).filter(
      (m: any) => m.stateKind === 'ready'
    )

    for (const die of roll) {
      const possible = Board.getPossibleMoves(board, player, die) as any[]
      const hasPossible = Array.isArray(possible) && possible.length > 0
      const hasReady = readyMoves.some((m: any) => m.dieValue === die)
      if (hasPossible) {
        expect(hasReady).toBe(true)
      }
    }
  })
})
