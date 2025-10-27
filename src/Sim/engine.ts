import {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Board } from '../Board'
import { Game } from '../Game'
import { Play } from '../Play'

export interface EngineOptions {
  seed?: number
  fast?: boolean
}

export class EngineRunner {
  private rng: () => number

  constructor(private opts: EngineOptions = {}) {
    const seed = opts.seed ?? Date.now() >>> 0
    let s = seed >>> 0
    // Simple LCG for deterministic runs
    this.rng = () => {
      s = (1664525 * s + 1013904223) >>> 0
      return (s & 0xffffffff) / 0x100000000
    }
  }

  init(): BackgammonGameRollingForStart {
    // Initialize a fresh game with two robots
    return Game.createNewGame(
      { userId: 'robot-white', isRobot: true },
      { userId: 'robot-black', isRobot: true }
    ) as BackgammonGameRollingForStart
  }

  rollForStart(state: BackgammonGameRollingForStart): BackgammonGameRolledForStart {
    return Game.rollForStart(state)
  }

  rollToMoving(state: BackgammonGameRolledForStart): BackgammonGameMoving {
    return Game.roll(state)
  }

  step(game: BackgammonGameMoving): BackgammonGame {
    // If no ready moves, complete turn
    const movesArr = Array.from(game.activePlay.moves)
    const ready = movesArr.filter((m: any) => m.stateKind === 'ready')
    if (ready.length === 0) {
      return Game.checkAndCompleteTurn(game)
    }

    // Gather valid origins based on current board
    const validOrigins = Play.getValidOrigins(game.activePlay as any, game.board)
    if (!validOrigins || validOrigins.length === 0) {
      return Game.checkAndCompleteTurn(game)
    }

    // Try each ready die in order; pick first with any legal moves from valid origins
    for (const rm of ready) {
      const die = rm.dieValue
      const pm = Board.getPossibleMoves(
        game.board,
        (game as any).activePlay.player,
        die
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const arr = Array.isArray(pm) ? pm : (pm?.moves || [])
      const byOrigin = arr.filter((m) => validOrigins.includes((m as any).origin?.id))
      const candidates = byOrigin.length > 0 ? byOrigin : arr
      if (candidates.length > 0) {
        // Heuristic: prefer bear-offs, then hits, then moves that advance closest to home (lowest destination position)
        const dir = (game as any).activePlay.player.direction as 'clockwise' | 'counterclockwise'
        const destInfo = (mv: any) => {
          const dest = mv.destination
          if (dest.kind === 'off') return { kind: 'off' as const, pos: 0, hit: false }
          if (dest.kind === 'point') {
            const pos = dest.position[dir] as number
            // Determine hit by looking at current board destination occupancy
            const boardDest = game.board.points.find((p: any) => p.id === dest.id)
            const hit = boardDest && Array.isArray(boardDest.checkers) && boardDest.checkers.length === 1 && boardDest.checkers[0].color !== (game as any).activePlay.player.color
            return { kind: 'point' as const, pos, hit: !!hit }
          }
          return { kind: 'point' as const, pos: 24, hit: false }
        }
        let best: any = null
        let bestScore = -Infinity
        for (const mv of candidates) {
          const info = destInfo(mv as any)
          let score = 0
          if (info.kind === 'off') score += 1000
          if (info.hit) score += 500
          score += 25 - (info.pos || 25)
          if (score > bestScore) {
            bestScore = score
            best = mv
          }
        }
        if (best && (best as any).origin && (best as any).origin.id) {
          const originId = (best as any).origin.id as string
          return Game.executeAndRecalculate(game, originId)
        }
      }
    }

    // No dice had possible moves → complete turn
    return Game.checkAndCompleteTurn(game)
  }

  runUntilWin(maxTurns = 400): { game: BackgammonGame; turns: number } {
    let turns = 0
    let s0 = this.init()
    // Resolve roll for start
    let rolledForStart = this.rollForStart(s0)
    // Roll to moving
    let current: BackgammonGame = this.rollToMoving(rolledForStart)

    while (turns < maxTurns && current.stateKind !== 'completed') {
      // If we enter a loop with a 'moved' state, confirm it immediately to keep progress monotonic
      if (current.stateKind === 'moved') {
        current = Game.confirmTurn(current)
        turns++
        if (current.stateKind === 'rolling') {
          current = Game.roll(current)
        }
        continue
      }

      if (current.stateKind === 'moving') {
        current = this.step(current)
        // Next iteration will handle 'moved' if produced
        continue
      }

      if (current.stateKind === 'rolling' || current.stateKind === 'rolled-for-start') {
        current = Game.roll(current)
        continue
      }

      // Unknown state: break to avoid infinite loop
      break
    }

    // Final flush: if we exit at 'moved', confirm once to avoid returning partial state
    if (current.stateKind === 'moved') {
      current = Game.confirmTurn(current)
      turns++
      if (current.stateKind === 'rolling') {
        current = Game.roll(current)
      }
    }
    return { game: current, turns }
  }
}
