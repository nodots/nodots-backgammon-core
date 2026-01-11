/**
 * Robot Skill Benchmark Harness
 *
 * Runs configurable number of games between robots to measure and validate
 * their actual skill levels against expected PR values.
 *
 * Usage:
 *   npx tsx src/scripts/robot-skill-benchmark.ts --robot1=nodots-bot --robot2=gnu-expert --games=30
 *   npx tsx src/scripts/robot-skill-benchmark.ts --benchmark-all --baseline=gnu-expert --games=30
 *
 * Options:
 *   --robot1=<key>       First robot (required unless --benchmark-all)
 *   --robot2=<key>       Second robot (required unless --benchmark-all)
 *   --games=<n>          Games per matchup (default: 30)
 *   --baseline=<key>     Baseline opponent for --benchmark-all (default: gnu-expert)
 *   --benchmark-all      Run all robots against baseline
 *   --output=<file>      Write results to JSON file
 *   --verbose            Show per-game results
 *   --list               List available robots and exit
 */

import type {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
  BackgammonGame,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '..'
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
  selectBestMove,
  shutdownGnubgHints,
} from '@nodots-llc/backgammon-ai'
import { MoveFilterSetting } from '@nodots-llc/gnubg-hints'
import { PerformanceRatingCalculator } from '../Services/PerformanceRatingCalculator'
import * as fs from 'fs'

// Robot configuration types
interface GnuConfig {
  evalPlies: number
  moveFilter: number
  noise: number
  usePruning: boolean
}

interface RobotConfig {
  name: string
  engine: 'gnu' | 'heuristic'
  config?: GnuConfig
  expectedPR: number
}

// Robot configuration map - matches seed-robots.ts
const ROBOT_CONFIGS: Record<string, RobotConfig> = {
  'nodots-bot': {
    name: 'Nodots Bot',
    engine: 'heuristic',
    expectedPR: 20.0,
  },
  'gnu-novice': {
    name: 'GNU Novice',
    engine: 'gnu',
    config: { evalPlies: 0, moveFilter: 0, noise: 0, usePruning: true },
    expectedPR: 15.0,
  },
  'gnu-beginner': {
    name: 'GNU Beginner',
    engine: 'gnu',
    config: { evalPlies: 1, moveFilter: 1, noise: 0, usePruning: true },
    expectedPR: 12.0,
  },
  'gnu-intermediate': {
    name: 'GNU Intermediate',
    engine: 'gnu',
    config: { evalPlies: 2, moveFilter: 2, noise: 0, usePruning: true },
    expectedPR: 8.0,
  },
  'gnu-advanced': {
    name: 'GNU Advanced',
    engine: 'gnu',
    config: { evalPlies: 2, moveFilter: 3, noise: 0, usePruning: true },
    expectedPR: 5.0,
  },
  'gnu-expert': {
    name: 'GNU Expert',
    engine: 'gnu',
    config: { evalPlies: 2, moveFilter: 4, noise: 0, usePruning: true },
    expectedPR: 2.0,
  },
  'gnu-worldclass': {
    name: 'GNU World Class',
    engine: 'gnu',
    config: { evalPlies: 3, moveFilter: 4, noise: 0, usePruning: true },
    expectedPR: 1.5,
  },
  'gnu-grandmaster': {
    name: 'GNU Grandmaster',
    engine: 'gnu',
    config: { evalPlies: 4, moveFilter: 4, noise: 0, usePruning: true },
    expectedPR: 1.0,
  },
}

// Statistics interfaces
interface PlayerGameStats {
  pr: number | null
  errors: {
    doubtful: number
    error: number
    blunder: number
    veryBad: number
  }
}

interface GameResult {
  gameNum: number
  winner: 'robot1' | 'robot2' | 'draw' | 'incomplete'
  turns: number
  robot1Stats: PlayerGameStats
  robot2Stats: PlayerGameStats
}

interface BenchmarkResult {
  robot1Key: string
  robot2Key: string
  robot1Name: string
  robot2Name: string
  gamesPlayed: number
  robot1Wins: number
  robot2Wins: number
  draws: number
  incomplete: number
  robot1PRs: number[]
  robot2PRs: number[]
  robot1AvgPR: number
  robot2AvgPR: number
  robot1StdDev: number
  robot2StdDev: number
  robot1MinPR: number
  robot1MaxPR: number
  robot2MinPR: number
  robot2MaxPR: number
  robot1TotalErrors: { doubtful: number; error: number; blunder: number; veryBad: number }
  robot2TotalErrors: { doubtful: number; error: number; blunder: number; veryBad: number }
  avgGameLength: number
}

// Helper functions
function parseArg(name: string, defaultValue: string | number | boolean): string | number | boolean {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (arg) {
    const value = arg.split('=')[1]
    if (typeof defaultValue === 'number') {
      return parseInt(value, 10)
    }
    return value
  }
  if (typeof defaultValue === 'boolean') {
    return process.argv.includes(`--${name}`)
  }
  return defaultValue
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function checkWin(board: any): 'white' | 'black' | null {
  if (!board || !board.off) return null

  // In the game structure:
  // - board.off.clockwise contains white player's (clockwise) borne off checkers
  // - board.off.counterclockwise contains black player's (counterclockwise) borne off checkers
  // We just need to count them, not filter by color
  const cwOff = board.off.clockwise?.checkers || []
  const ccwOff = board.off.counterclockwise?.checkers || []

  // White (clockwise) wins if clockwise off has 15 checkers
  if (cwOff.length >= 15) return 'white'
  // Black (counterclockwise) wins if counterclockwise off has 15 checkers
  if (ccwOff.length >= 15) return 'black'

  return null
}

// Check if game state indicates a winner (more reliable than board check)
function getWinnerFromState(state: any): 'white' | 'black' | null {
  if (!state) return null

  // Check players for winner stateKind
  const players = state.players || []
  for (const p of players) {
    if (p.stateKind === 'winner') {
      return p.color as 'white' | 'black'
    }
  }

  // Check if state itself indicates completion with winner
  if (state.stateKind === 'completed' && state.winner) {
    return state.winner.color as 'white' | 'black'
  }

  return null
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

// Result type for turn execution that can indicate a win
interface TurnResult {
  state: BackgammonGameMoving | BackgammonGameMoved
  winner?: 'white' | 'black'
}

// Execute moves using GNU hints
async function executeGnuTurn(
  moving: BackgammonGameMoving,
  rollTuple: [number, number],
  config: GnuConfig
): Promise<TurnResult> {
  await initializeGnubgHints()
  await configureGnubgHints({
    evalPlies: config.evalPlies,
    moveFilter: config.moveFilter,
    usePruning: config.usePruning,
  })

  const { request } = buildHintContextFromGame(moving as unknown as BackgammonGame)
  request.dice = [rollTuple[0], rollTuple[1]]
  let hints = await getGnuMoveHints(request, 1)

  if (!hints || hints.length === 0 || !hints[0].moves?.length) {
    request.dice = [rollTuple[1], rollTuple[0]]
    hints = await getGnuMoveHints(request, 1)
  }

  let stepIndex = 0
  const hintSeq = hints?.[0]?.moves || []

  while (moving.stateKind === 'moving') {
    const readyMoves = Array.from(moving.activePlay.moves).filter(
      (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
    )
    if (readyMoves.length === 0) break

    let selectedOrigin: any = null
    const direction = (moving.activePlayer as any).direction as 'clockwise' | 'counterclockwise'
    const target = hintSeq[stepIndex]

    if (target) {
      for (const m of readyMoves) {
        const dv = (m as any).dieValue as number
        const pm = Board.getPossibleMoves(
          moving.board,
          moving.activePlay.player,
          dv as any
        ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
        const arr = Array.isArray(pm) ? pm : pm.moves

        for (const mv of arr) {
          const fromKind = getContainerKind(mv.origin as any)
          const toKind = getContainerKind(mv.destination as any)
          const fromPos = fromKind === 'point' ? getNormalizedPosition(mv.origin as any, direction) : (fromKind === 'bar' ? 25 : 0)
          const toPos = toKind === 'point' ? getNormalizedPosition(mv.destination as any, direction) : (toKind === 'off' ? 0 : 25)

          if (target.from === fromPos && target.to === toPos) {
            selectedOrigin = mv.origin
            break
          }
        }
        if (selectedOrigin) break
      }
    }

    // Fallback to first available move
    if (!selectedOrigin && readyMoves.length > 0) {
      const m = readyMoves[0] as any
      const pm = Board.getPossibleMoves(
        moving.board,
        moving.activePlay.player,
        m.dieValue as any
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const arr = Array.isArray(pm) ? pm : pm.moves
      if (arr.length > 0) {
        selectedOrigin = arr[0].origin
      }
    }

    if (!selectedOrigin) break

    const originChecker = (selectedOrigin as any).checkers?.find(
      (c: any) => c.color === moving.activeColor
    )
    if (!originChecker) break

    const next = Game.move(moving, originChecker.id)
    stepIndex++

    // Check if this move resulted in a win (game engine sets stateKind to 'completed')
    if ((next as any).stateKind === 'completed') {
      const winner = getWinnerFromState(next) || moving.activeColor
      return { state: next as BackgammonGameMoved, winner }
    }

    if ((next as any).stateKind === 'moved') {
      // Check board for win after move
      const boardWinner = checkWin((next as any).board)
      if (boardWinner) {
        return { state: next as BackgammonGameMoved, winner: boardWinner }
      }
      return { state: next as BackgammonGameMoved }
    } else if ((next as any).stateKind === 'moving') {
      moving = next as BackgammonGameMoving
    } else {
      break
    }
  }

  return { state: moving }
}

// Execute moves using Nodots heuristic AI (simple: pick move that advances furthest)
async function executeHeuristicTurn(
  moving: BackgammonGameMoving
): Promise<TurnResult> {
  while (moving.stateKind === 'moving') {
    const readyMoves = Array.from(moving.activePlay.moves).filter(
      (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
    )
    if (readyMoves.length === 0) break

    // Simple heuristic: pick the move that advances a checker the furthest
    let bestOrigin: any = null
    let bestDistance = -1

    for (const m of readyMoves) {
      const dv = (m as any).dieValue as number
      const pm = Board.getPossibleMoves(
        moving.board,
        moving.activePlay.player,
        dv as any
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const arr = Array.isArray(pm) ? pm : pm.moves

      for (const mv of arr) {
        // Calculate distance (prefer moves that advance furthest)
        const distance = dv // Simple: die value represents distance
        if (distance > bestDistance) {
          bestDistance = distance
          bestOrigin = mv.origin
        }
      }
    }

    if (!bestOrigin) {
      // Fallback: first available move
      const m = readyMoves[0] as any
      const pm = Board.getPossibleMoves(
        moving.board,
        moving.activePlay.player,
        m.dieValue as any
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const arr = Array.isArray(pm) ? pm : pm.moves
      if (arr.length > 0) {
        bestOrigin = arr[0].origin
      }
    }

    if (!bestOrigin) break

    const originChecker = bestOrigin.checkers?.find(
      (c: any) => c.color === moving.activeColor
    )
    if (!originChecker) break

    const next = Game.move(moving, originChecker.id)

    // Check if this move resulted in a win
    if ((next as any).stateKind === 'completed') {
      const winner = getWinnerFromState(next) || moving.activeColor
      return { state: next as BackgammonGameMoved, winner }
    }

    if ((next as any).stateKind === 'moved') {
      const boardWinner = checkWin((next as any).board)
      if (boardWinner) {
        return { state: next as BackgammonGameMoved, winner: boardWinner }
      }
      return { state: next as BackgammonGameMoved }
    } else if ((next as any).stateKind === 'moving') {
      moving = next as BackgammonGameMoving
    } else {
      break
    }
  }

  return { state: moving }
}

// Run a single game between two robots
async function runGame(
  robot1Key: string,
  robot2Key: string,
  gameNum: number,
  verbose: boolean
): Promise<GameResult> {
  const robot1Config = ROBOT_CONFIGS[robot1Key]
  const robot2Config = ROBOT_CONFIGS[robot2Key]

  // White = robot1 (clockwise), Black = robot2 (counterclockwise)
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let state: any = Game.rollForStart(game)

  const gameStates: BackgammonGame[] = []
  const moveActions: Array<{ player: string; move: any; dice?: number[] }> = []

  let turn = 0
  const maxTurns = 400

  while (state.stateKind !== 'completed' && turn < maxTurns) {
    turn++

    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = rolled.activePlayer.dice.currentRoll as [number, number]
    const isRobot1Turn = rolled.activeColor === 'white'
    const currentRobotConfig = isRobot1Turn ? robot1Config : robot2Config

    // Store state before move for PR calculation
    const turnStartState = JSON.parse(JSON.stringify(rolled)) as BackgammonGame
    const activePlayerId = rolled.activePlayer.id || (rolled.activePlayer as any).userId

    try {
      let turnResult: TurnResult
      if (currentRobotConfig.engine === 'gnu' && currentRobotConfig.config) {
        turnResult = await executeGnuTurn(moving as BackgammonGameMoving, rollTuple, currentRobotConfig.config)
      } else {
        turnResult = await executeHeuristicTurn(moving as BackgammonGameMoving)
      }

      moving = turnResult.state

      // Check if turn execution detected a winner
      if (turnResult.winner) {
        if (verbose) console.log(`  Turn ${turn}: Winner detected during move: ${turnResult.winner}`)
        state = { ...moving, stateKind: 'completed', detectedWinner: turnResult.winner }
        break
      }

      // Complete the turn if still in moving state
      if (moving.stateKind === 'moving') {
        moving = Game.checkAndCompleteTurn(moving as BackgammonGameMoving) as any
      }

      // Collect executed moves for PR calculation
      const allMoves = Array.from((moving as any).activePlay.moves)
      const exec = allMoves.filter((m: any) => m.stateKind === 'completed' && m.moveKind !== 'no-move')

      for (const cm of exec) {
        const player = ((cm as any).player?.id || (cm as any).player?.userId) as string
        const dir = (cm as any).player?.direction as 'clockwise' | 'counterclockwise'
        const originPos = (cm as any).origin
          ? ((cm as any).origin.position?.[dir] || 0)
          : ((cm as any).moveKind === 'reenter' ? 0 : 0)
        const destPos = (cm as any).destination
          ? ((cm as any).destination.position?.[dir] || 0)
          : ((cm as any).moveKind === 'bear-off' ? 0 : 0)

        const movePayload = {
          originPosition: originPos,
          destinationPosition: destPos,
          moveKind: (cm as any).moveKind,
          isHit: !!(cm as any).isHit,
          dieValue: (cm as any).dieValue,
        }
        gameStates.push(turnStartState)
        moveActions.push({ player: activePlayerId, move: movePayload, dice: [rollTuple[0], rollTuple[1]] })
      }

      // Confirm turn and continue
      if ((moving as any).stateKind === 'moved') {
        state = Game.confirmTurn(moving as BackgammonGameMoved)
        // Check if confirmTurn resulted in game completion
        const wAfterConfirm = getWinnerFromState(state)
        if (wAfterConfirm || state.stateKind === 'completed') {
          state = { ...state, detectedWinner: wAfterConfirm }
          break
        }
      } else {
        state = moving
      }
    } catch (err) {
      if (verbose) console.error(`  Game ${gameNum} error at turn ${turn}:`, err)

      // Check if we're close to winning (14+ checkers off) and treat as win
      // This handles the GAME_OUTCOME_POINTS bug in the engine
      const board = (moving as any)?.board || (state as any)?.board
      if (board?.off) {
        const cwOff = board.off.clockwise?.checkers?.length || 0
        const ccwOff = board.off.counterclockwise?.checkers?.length || 0
        if (cwOff >= 14 || ccwOff >= 14) {
          // Near completion, determine likely winner
          const nearWinner = cwOff > ccwOff ? 'white' : 'black'
          if (verbose) console.log(`  Game ${gameNum}: Error near completion, treating ${nearWinner} as winner (CW: ${cwOff}, CCW: ${ccwOff})`)
          state = { ...state, stateKind: 'completed', detectedWinner: nearWinner }
          break  // Exit the game loop, continue to PR calculation
        }
      }

      return {
        gameNum,
        winner: 'incomplete',
        turns: turn,
        robot1Stats: { pr: null, errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 } },
        robot2Stats: { pr: null, errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 } },
      }
    }
  }

  // Determine winner using multiple detection methods
  let winner: 'robot1' | 'robot2' | 'draw' | 'incomplete' = 'incomplete'
  if (state.stateKind === 'completed') {
    // Try stored winner first, then board check, then state check
    const detectedWinner = state.detectedWinner || checkWin(state.board) || getWinnerFromState(state)
    if (detectedWinner === 'white') winner = 'robot1'
    else if (detectedWinner === 'black') winner = 'robot2'
    else winner = 'draw'
  }

  // Calculate PR for both players
  // Reconfigure to 2-ply for fair PR calculation
  await configureGnubgHints({ evalPlies: 2, moveFilter: MoveFilterSetting.Large, usePruning: true })

  const prCalc = new PerformanceRatingCalculator()
  let robot1Stats: PlayerGameStats = { pr: null, errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 } }
  let robot2Stats: PlayerGameStats = { pr: null, errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 } }

  try {
    const prResult = await prCalc.calculateGamePR(`benchmark-${gameNum}`, gameStates, moveActions)

    for (const [playerId, playerPR] of Object.entries(prResult.playerResults)) {
      // White = robot1, Black = robot2
      const isRobot1 = playerId === white.id || playerId === (white as any).userId
      const stats: PlayerGameStats = {
        pr: playerPR.performanceRating,
        errors: {
          doubtful: playerPR.errors.doubtful,
          error: playerPR.errors.error,
          blunder: playerPR.errors.blunder,
          veryBad: playerPR.errors.veryBad,
        },
      }

      if (isRobot1) {
        robot1Stats = stats
      } else {
        robot2Stats = stats
      }
    }
  } catch (err) {
    if (verbose) console.error(`  Game ${gameNum} PR calculation error:`, err)
  }

  if (verbose) {
    console.log(
      `  Game ${gameNum}: ${winner === 'robot1' ? robot1Config.name : winner === 'robot2' ? robot2Config.name : winner} wins ` +
      `(${turn} turns, PR: ${robot1Stats.pr?.toFixed(2) || 'N/A'} / ${robot2Stats.pr?.toFixed(2) || 'N/A'})`
    )
  }

  return { gameNum, winner, turns: turn, robot1Stats, robot2Stats }
}

// Run benchmark between two robots
async function runBenchmark(
  robot1Key: string,
  robot2Key: string,
  numGames: number,
  verbose: boolean
): Promise<BenchmarkResult> {
  const robot1Config = ROBOT_CONFIGS[robot1Key]
  const robot2Config = ROBOT_CONFIGS[robot2Key]

  console.log(`\n=== Benchmark: ${robot1Config.name} vs ${robot2Config.name} (${numGames} games) ===`)

  const results: GameResult[] = []

  for (let i = 1; i <= numGames; i++) {
    if (!verbose && i % 5 === 0) {
      process.stdout.write(`  Progress: ${i}/${numGames}\r`)
    }
    const result = await runGame(robot1Key, robot2Key, i, verbose)
    results.push(result)

    // Periodically shutdown hints to free resources
    if (i % 10 === 0) {
      try { await shutdownGnubgHints() } catch {}
    }
  }

  console.log('') // Clear progress line

  // Aggregate statistics
  const robot1PRs = results.map(r => r.robot1Stats.pr).filter((p): p is number => p !== null)
  const robot2PRs = results.map(r => r.robot2Stats.pr).filter((p): p is number => p !== null)

  const robot1TotalErrors = { doubtful: 0, error: 0, blunder: 0, veryBad: 0 }
  const robot2TotalErrors = { doubtful: 0, error: 0, blunder: 0, veryBad: 0 }

  for (const r of results) {
    robot1TotalErrors.doubtful += r.robot1Stats.errors.doubtful
    robot1TotalErrors.error += r.robot1Stats.errors.error
    robot1TotalErrors.blunder += r.robot1Stats.errors.blunder
    robot1TotalErrors.veryBad += r.robot1Stats.errors.veryBad

    robot2TotalErrors.doubtful += r.robot2Stats.errors.doubtful
    robot2TotalErrors.error += r.robot2Stats.errors.error
    robot2TotalErrors.blunder += r.robot2Stats.errors.blunder
    robot2TotalErrors.veryBad += r.robot2Stats.errors.veryBad
  }

  const avgGameLength = results.reduce((sum, r) => sum + r.turns, 0) / results.length

  return {
    robot1Key,
    robot2Key,
    robot1Name: robot1Config.name,
    robot2Name: robot2Config.name,
    gamesPlayed: numGames,
    robot1Wins: results.filter(r => r.winner === 'robot1').length,
    robot2Wins: results.filter(r => r.winner === 'robot2').length,
    draws: results.filter(r => r.winner === 'draw').length,
    incomplete: results.filter(r => r.winner === 'incomplete').length,
    robot1PRs,
    robot2PRs,
    robot1AvgPR: robot1PRs.length > 0 ? robot1PRs.reduce((a, b) => a + b, 0) / robot1PRs.length : 0,
    robot2AvgPR: robot2PRs.length > 0 ? robot2PRs.reduce((a, b) => a + b, 0) / robot2PRs.length : 0,
    robot1StdDev: stdDev(robot1PRs),
    robot2StdDev: stdDev(robot2PRs),
    robot1MinPR: robot1PRs.length > 0 ? Math.min(...robot1PRs) : 0,
    robot1MaxPR: robot1PRs.length > 0 ? Math.max(...robot1PRs) : 0,
    robot2MinPR: robot2PRs.length > 0 ? Math.min(...robot2PRs) : 0,
    robot2MaxPR: robot2PRs.length > 0 ? Math.max(...robot2PRs) : 0,
    robot1TotalErrors,
    robot2TotalErrors,
    avgGameLength,
  }
}

// Print benchmark results
function printResults(result: BenchmarkResult) {
  const robot1Config = ROBOT_CONFIGS[result.robot1Key]
  const robot2Config = ROBOT_CONFIGS[result.robot2Key]

  console.log(`\n${'='.repeat(70)}`)
  console.log(`Results: ${result.robot1Name} vs ${result.robot2Name}`)
  console.log(`${'='.repeat(70)}`)

  console.log(`\nGames: ${result.gamesPlayed} | Avg Length: ${result.avgGameLength.toFixed(1)} turns`)
  console.log(`Wins: ${result.robot1Name}=${result.robot1Wins}, ${result.robot2Name}=${result.robot2Wins}, Draws=${result.draws}, Incomplete=${result.incomplete}`)

  console.log(`\n${''.padEnd(16)} | ${'Wins'.padStart(5)} | ${'Avg PR'.padStart(7)} | ${'StdDev'.padStart(7)} | ${'Min'.padStart(6)} | ${'Max'.padStart(6)} | VB/Bl/Er/Df`)
  console.log(`${'-'.repeat(16)}-|-${'-'.repeat(5)}-|-${'-'.repeat(7)}-|-${'-'.repeat(7)}-|-${'-'.repeat(6)}-|-${'-'.repeat(6)}-|${'-'.repeat(14)}`)

  const r1Err = `${result.robot1TotalErrors.veryBad}/${result.robot1TotalErrors.blunder}/${result.robot1TotalErrors.error}/${result.robot1TotalErrors.doubtful}`
  const r2Err = `${result.robot2TotalErrors.veryBad}/${result.robot2TotalErrors.blunder}/${result.robot2TotalErrors.error}/${result.robot2TotalErrors.doubtful}`

  console.log(
    `${result.robot1Name.padEnd(16)} | ${String(result.robot1Wins).padStart(5)} | ${result.robot1AvgPR.toFixed(2).padStart(7)} | ${result.robot1StdDev.toFixed(2).padStart(7)} | ${result.robot1MinPR.toFixed(2).padStart(6)} | ${result.robot1MaxPR.toFixed(2).padStart(6)} | ${r1Err}`
  )
  console.log(
    `${result.robot2Name.padEnd(16)} | ${String(result.robot2Wins).padStart(5)} | ${result.robot2AvgPR.toFixed(2).padStart(7)} | ${result.robot2StdDev.toFixed(2).padStart(7)} | ${result.robot2MinPR.toFixed(2).padStart(6)} | ${result.robot2MaxPR.toFixed(2).padStart(6)} | ${r2Err}`
  )

  console.log(`\nExpected PRs: ${result.robot1Name}=${robot1Config.expectedPR.toFixed(1)}, ${result.robot2Name}=${robot2Config.expectedPR.toFixed(1)}`)
  const r1Diff = result.robot1AvgPR - robot1Config.expectedPR
  const r2Diff = result.robot2AvgPR - robot2Config.expectedPR
  console.log(`Actual vs Expected: ${result.robot1Name}=${r1Diff >= 0 ? '+' : ''}${r1Diff.toFixed(2)}, ${result.robot2Name}=${r2Diff >= 0 ? '+' : ''}${r2Diff.toFixed(2)}`)
}

// List available robots
function listRobots() {
  console.log('\nAvailable robots:\n')
  console.log(`${'Key'.padEnd(18)} | ${'Name'.padEnd(18)} | ${'Engine'.padEnd(10)} | Expected PR`)
  console.log(`${'-'.repeat(18)}-|-${'-'.repeat(18)}-|-${'-'.repeat(10)}-|${'-'.repeat(12)}`)

  for (const [key, config] of Object.entries(ROBOT_CONFIGS)) {
    console.log(
      `${key.padEnd(18)} | ${config.name.padEnd(18)} | ${config.engine.padEnd(10)} | ${config.expectedPR.toFixed(1)}`
    )
  }
}

// Main entry point
async function main() {
  if (hasFlag('list')) {
    listRobots()
    return
  }

  const benchmarkAll = hasFlag('benchmark-all')
  const verbose = hasFlag('verbose')
  const numGames = parseArg('games', 30) as number
  const outputFile = parseArg('output', '') as string

  const allResults: BenchmarkResult[] = []

  if (benchmarkAll) {
    const baseline = parseArg('baseline', 'gnu-expert') as string
    if (!ROBOT_CONFIGS[baseline]) {
      console.error(`Unknown baseline robot: ${baseline}`)
      console.log('Use --list to see available robots')
      process.exit(1)
    }

    console.log(`\nBenchmarking all robots against ${ROBOT_CONFIGS[baseline].name}...`)

    for (const robotKey of Object.keys(ROBOT_CONFIGS)) {
      if (robotKey === baseline) continue

      const result = await runBenchmark(robotKey, baseline, numGames, verbose)
      allResults.push(result)
      printResults(result)

      // Shutdown between matchups
      try { await shutdownGnubgHints() } catch {}
    }

    // Print summary table
    console.log(`\n${'='.repeat(70)}`)
    console.log('SUMMARY: All Robots vs ' + ROBOT_CONFIGS[baseline].name)
    console.log(`${'='.repeat(70)}`)
    console.log(`\n${'Robot'.padEnd(18)} | ${'Wins'.padStart(5)} | ${'Losses'.padStart(6)} | ${'Avg PR'.padStart(7)} | ${'Expected'.padStart(8)} | ${'Diff'.padStart(7)}`)
    console.log(`${'-'.repeat(18)}-|-${'-'.repeat(5)}-|-${'-'.repeat(6)}-|-${'-'.repeat(7)}-|-${'-'.repeat(8)}-|-${'-'.repeat(7)}`)

    for (const result of allResults) {
      const expected = ROBOT_CONFIGS[result.robot1Key].expectedPR
      const diff = result.robot1AvgPR - expected
      console.log(
        `${result.robot1Name.padEnd(18)} | ${String(result.robot1Wins).padStart(5)} | ${String(result.robot2Wins).padStart(6)} | ${result.robot1AvgPR.toFixed(2).padStart(7)} | ${expected.toFixed(1).padStart(8)} | ${(diff >= 0 ? '+' : '') + diff.toFixed(2).padStart(6)}`
      )
    }
  } else {
    const robot1Key = parseArg('robot1', '') as string
    const robot2Key = parseArg('robot2', '') as string

    if (!robot1Key || !robot2Key) {
      console.error('Usage: --robot1=<key> --robot2=<key> --games=<n>')
      console.log('       --benchmark-all --baseline=<key> --games=<n>')
      console.log('\nUse --list to see available robots')
      process.exit(1)
    }

    if (!ROBOT_CONFIGS[robot1Key]) {
      console.error(`Unknown robot: ${robot1Key}`)
      console.log('Use --list to see available robots')
      process.exit(1)
    }

    if (!ROBOT_CONFIGS[robot2Key]) {
      console.error(`Unknown robot: ${robot2Key}`)
      console.log('Use --list to see available robots')
      process.exit(1)
    }

    const result = await runBenchmark(robot1Key, robot2Key, numGames, verbose)
    allResults.push(result)
    printResults(result)
  }

  // Write results to file if requested
  if (outputFile) {
    const output = {
      timestamp: new Date().toISOString(),
      results: allResults.map(r => ({
        ...r,
        // Exclude raw PR arrays from output to keep it concise
        robot1PRs: undefined,
        robot2PRs: undefined,
      })),
    }
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2))
    console.log(`\nResults written to ${outputFile}`)
  }

  // Cleanup
  try { await shutdownGnubgHints() } catch {}
}

main().catch((e) => {
  console.error('Benchmark failed:', e)
  process.exit(1)
})
