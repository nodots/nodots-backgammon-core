/**
 * Integration: compare board state after GNU step 1 vs core executeAndRecalculate
 * for a captured failure fixture. This isolates state drift after step 1.
 *
 * Requires:
 * - RUN_GNUBG_HINTS=1
 * - FAILURE_GAME_PATH=/absolute/or/relative/path/to/json
 */

import { describe, expect, it } from '@jest/globals'
import { GnuBgHints, MoveStep } from '@nodots-llc/gnubg-hints'
import { Game } from '../Game'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import type {
  BackgammonColor,
  BackgammonMoveDirection,
} from '@nodots-llc/backgammon-types'
import fs from 'fs'
import path from 'path'

type GnubgBoard = { x: number[]; o: number[] }

const RUN = process.env.RUN_GNUBG_HINTS === '1'
const fixturePath = process.env.FAILURE_GAME_PATH
const itfn = RUN && fixturePath ? it : it.skip

function resolveFixturePath(rawPath: string): string {
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
  return resolved
}

function applyGnuStep(
  board: GnubgBoard,
  step: MoveStep,
  activeDirection: BackgammonMoveDirection
): GnubgBoard {
  const next: GnubgBoard = { x: [...board.x], o: [...board.o] }
  const active = activeDirection === 'clockwise' ? next.x : next.o
  const opponent = activeDirection === 'clockwise' ? next.o : next.x

  const fromIdx =
    step.fromContainer === 'bar' || step.moveKind === 'reenter'
      ? 24
      : step.from - 1
  const toIdx =
    step.toContainer === 'off' || step.moveKind === 'bear-off'
      ? -1
      : step.to - 1

  if (fromIdx < 0 || fromIdx > 24) {
    throw new Error(`Invalid step from index: ${fromIdx}`)
  }

  active[fromIdx] -= 1
  if (active[fromIdx] < 0) {
    throw new Error(`Active checker underflow at index ${fromIdx}`)
  }

  if (toIdx >= 0) {
    active[toIdx] += 1
  }

  if (step.isHit && toIdx >= 0) {
    const opponentIdx = 24 - step.to
    if (opponentIdx < 0 || opponentIdx > 23) {
      throw new Error(`Invalid opponent index for hit: ${opponentIdx}`)
    }
    opponent[opponentIdx] -= 1
    if (opponent[opponentIdx] < 0) {
      throw new Error(`Opponent checker underflow at index ${opponentIdx}`)
    }
    opponent[24] += 1
  }

  return next
}

function swapGnuBoard(board: GnubgBoard): GnubgBoard {
  return { x: [...board.o], o: [...board.x] }
}

function countColors(checkers: Array<{ color?: BackgammonColor }>): {
  white: number
  black: number
} {
  const counts = { white: 0, black: 0 }
  for (const checker of checkers) {
    if (checker?.color === 'white') counts.white += 1
    if (checker?.color === 'black') counts.black += 1
  }
  return counts
}

function buildCanonicalBoard(
  game: any,
  activeColor: BackgammonColor,
  activeDirection: BackgammonMoveDirection
): GnubgBoard {
  const points = Array.from({ length: 24 }, () => ({
    white: 0,
    black: 0,
  }))

  const rawPoints = Array.isArray(game?.board?.points)
    ? game.board.points
    : []
  for (const point of rawPoints) {
    const clockwise = point?.position?.clockwise
    const counter = point?.position?.counterclockwise
    const index =
      typeof clockwise === 'number'
        ? clockwise
        : typeof counter === 'number'
          ? 25 - counter
          : null
    if (!index || index < 1 || index > 24) continue
    const checkers = Array.isArray(point.checkers) ? point.checkers : []
    const counts = countColors(checkers)
    points[index - 1].white += counts.white
    points[index - 1].black += counts.black
  }

  const barClockwise = Array.isArray(game?.board?.bar?.clockwise?.checkers)
    ? game.board.bar.clockwise.checkers
    : []
  const barCounter = Array.isArray(game?.board?.bar?.counterclockwise?.checkers)
    ? game.board.bar.counterclockwise.checkers
    : []
  const bar = countColors([...barClockwise, ...barCounter])

  const clockwiseColor =
    activeDirection === 'clockwise' ? activeColor : activeColor === 'white' ? 'black' : 'white'
  const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'

  const cwCheckers = points.map((p) =>
    clockwiseColor === 'white' ? p.white : p.black
  )
  const ccwCheckers = points.map((p) =>
    counterclockwiseColor === 'white' ? p.white : p.black
  )

  const x = cwCheckers
  const o = ccwCheckers.slice().reverse()
  x[24] = clockwiseColor === 'white' ? bar.white : bar.black
  o[24] = counterclockwiseColor === 'white' ? bar.white : bar.black

  return { x, o }
}

describe('GNU step 1 board drift (fixture)', () => {
  itfn('matches GNU-decoded board after step 1', async () => {
    await GnuBgHints.initialize()
    const raw = fs.readFileSync(resolveFixturePath(fixturePath as string), 'utf-8')
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
    expect(plan.length).toBeGreaterThanOrEqual(1)
    const step1 = plan[0]

    const decoded = GnuBgHints.decodePositionId(pid)
    const decodedBoard = { x: decoded.x, o: decoded.o }
    const dir = activePlayer.direction as BackgammonMoveDirection
    const effectiveBoard =
      dir === 'clockwise' ? swapGnuBoard(decodedBoard) : decodedBoard
    const gnuAfterEffective = applyGnuStep(effectiveBoard, step1, dir)
    const gnuAfter = dir === 'clockwise' ? swapGnuBoard(gnuAfterEffective) : gnuAfterEffective

    const origin =
      step1.moveKind === 'reenter'
        ? game.board.bar[dir]
        : game.board.points.find((p: any) => p.position[dir] === step1.from)
    expect(origin).toBeDefined()

    const destination =
      step1.moveKind === 'bear-off'
        ? game.board.off[dir]
        : game.board.points.find((p: any) => p.position[dir] === step1.to)
    expect(destination).toBeDefined()

    const readyMoves = (game.activePlay?.moves || []).filter(
      (m: any) => m.stateKind === 'ready'
    )
    const matchingReady = readyMoves.find((m: any) =>
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
    if (!matchingReady) {
      throw new Error('Unable to match GNUBG step 1 to a ready move')
    }

    const afterStep1 = Game.executeAndRecalculate(game, origin!.id, {
      desiredDestinationId: destination!.id,
      expectedDieValue: matchingReady.dieValue,
    })
    const coreAfter = buildCanonicalBoard(
      afterStep1 as any,
      activePlayer.color as BackgammonColor,
      activePlayer.direction as BackgammonMoveDirection
    )

    expect(coreAfter).toEqual(gnuAfter)
  })
})
