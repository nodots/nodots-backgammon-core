/**
 * Robot Tournament Runner
 *
 * Runs calibration tournaments between GNU robots at different skill levels
 * to measure actual PRs and compare against official GNU Backgammon thresholds.
 *
 * Usage:
 *   npm run tournament:run -- --games=100 --output=tournament-results
 */

import {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
} from '@nodots/backgammon-types'
import { Board, Game, Player } from '..'
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
} from '@nodots/backgammon-ai'
import { MoveFilterSetting } from '@nodots/gnubg-hints'
import * as fs from 'fs'
import * as path from 'path'

// Robot configurations matching seed-robots.ts
interface RobotConfig {
  name: string
  evalPlies: number
  moveFilter: MoveFilterSetting
  expectedPR: number // Current expected PR from seed-robots.ts
  isRandom?: boolean // If true, picks random legal moves instead of following hints
}

const GNU_ROBOTS: RobotConfig[] = [
  { name: 'Random', evalPlies: 0, moveFilter: MoveFilterSetting.Tiny, expectedPR: 30.0, isRandom: true },
  { name: 'GNU Novice', evalPlies: 0, moveFilter: MoveFilterSetting.Tiny, expectedPR: 15.0 },
  { name: 'GNU Beginner', evalPlies: 1, moveFilter: MoveFilterSetting.Narrow, expectedPR: 12.0 },
  { name: 'GNU Intermediate', evalPlies: 2, moveFilter: MoveFilterSetting.Normal, expectedPR: 8.0 },
  { name: 'GNU Advanced', evalPlies: 2, moveFilter: MoveFilterSetting.Large, expectedPR: 5.0 },
  { name: 'GNU Expert', evalPlies: 2, moveFilter: MoveFilterSetting.Huge, expectedPR: 2.0 },
  { name: 'GNU World Class', evalPlies: 3, moveFilter: MoveFilterSetting.Huge, expectedPR: 1.5 },
  { name: 'GNU Grandmaster', evalPlies: 4, moveFilter: MoveFilterSetting.Huge, expectedPR: 1.0 },
]

// Official GNU Backgammon PR thresholds (equity * 1000)
const GNU_OFFICIAL_THRESHOLDS = {
  supernatural: 2,
  worldClass: 5,
  expert: 8,
  advanced: 12,
  intermediate: 18,
  casual: 26,
  beginner: 35,
}

// Analysis engine configuration - use stronger engine than playing engine
// 3-ply is ~20x faster than 4-ply while still being stronger than 2-ply robots
const ANALYSIS_PLY = 3
const ANALYSIS_FILTER = MoveFilterSetting.Large

interface MoveRecord {
  positionId?: string
  dice: [number, number]
  hintEquity: number
  executedEquity: number
  equityLoss: number
  hintRank: number // 0 = best hint, 1 = second best, etc.
}

interface GameResult {
  gameNumber: number
  winner: 'white' | 'black' | null
  turns: number
  robot1Color: 'white' | 'black'
  robot1Moves: MoveRecord[]
  robot2Moves: MoveRecord[]
  robot1PR: number
  robot2PR: number
}

interface MatchupResult {
  robot1: RobotConfig
  robot2: RobotConfig
  games: GameResult[]
  robot1Stats: {
    totalGames: number
    wins: number
    prValues: number[]
    meanPR: number
    medianPR: number
    stdDevPR: number
  }
  robot2Stats: {
    totalGames: number
    wins: number
    prValues: number[]
    meanPR: number
    medianPR: number
    stdDevPR: number
  }
}

interface TournamentConfig {
  games: number
  outputDir: string
  quiet: boolean
  matchups?: Array<{ robot1: string; robot2: string }>
}

function parseArgs(): TournamentConfig {
  const args = process.argv.slice(2)
  let games = 100
  let outputDir = 'tournament-results'
  let quiet = true
  const matchups: Array<{ robot1: string; robot2: string }> = []

  for (const a of args) {
    if (a.startsWith('--games=')) games = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--output=')) outputDir = a.split('=')[1]
    else if (a === '--verbose') quiet = false
    else if (a.startsWith('--matchup=')) {
      const [r1, r2] = a.split('=')[1].split(',')
      if (r1 && r2) matchups.push({ robot1: r1, robot2: r2 })
    }
  }

  return { games, outputDir, quiet, matchups: matchups.length > 0 ? matchups : undefined }
}

function checkWin(board: any): 'white' | 'black' | null {
  if (!board || !board.off) return null
  const whiteOff = board.off.clockwise?.checkers?.filter((c: any) => c.color === 'white')?.length || 0
  const blackOff = board.off.counterclockwise?.checkers?.filter((c: any) => c.color === 'black')?.length || 0
  if (whiteOff === 15) return 'white'
  if (blackOff === 15) return 'black'
  return null
}

function calculatePR(moves: MoveRecord[]): number {
  if (moves.length === 0) return 0
  const totalEquityLoss = moves.reduce((sum, m) => sum + m.equityLoss, 0)
  const avgEquityLoss = totalEquityLoss / moves.length
  // Use official GNU scaling: equity * 1000
  return avgEquityLoss * 1000
}

function calculateStats(prValues: number[]): { mean: number; median: number; stdDev: number } {
  if (prValues.length === 0) return { mean: 0, median: 0, stdDev: 0 }

  const mean = prValues.reduce((a, b) => a + b, 0) / prValues.length

  const sorted = [...prValues].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

  const variance = prValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / prValues.length
  const stdDev = Math.sqrt(variance)

  return { mean, median, stdDev }
}

async function simulateGameWithPR(
  robot1Config: RobotConfig,
  robot2Config: RobotConfig,
  gameNumber: number,
  quiet: boolean
): Promise<GameResult> {
  // Initialize players - robot1 is always white, robot2 is always black
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turn = 0
  const maxTurns = 500

  const robot1Moves: MoveRecord[] = []
  const robot2Moves: MoveRecord[] = []

  // Roll for start
  let state: any = Game.rollForStart(game)
  const robot1Color: 'white' | 'black' = 'white'

  if (!quiet) console.log(`  Game ${gameNumber}: ${robot1Config.name} (white) vs ${robot2Config.name} (black)`)

  while (turn < maxTurns) {
    turn++
    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = rolled.activePlayer.dice.currentRoll as [number, number]
    const isWhiteTurn = rolled.activeColor === 'white'
    const currentRobotConfig = isWhiteTurn ? robot1Config : robot2Config
    const currentMoves = isWhiteTurn ? robot1Moves : robot2Moves

    try {
      await initializeGnubgHints()
      // Configure gnubg with the current robot's settings
      await configureGnubgHints({
        evalPlies: currentRobotConfig.evalPlies,
        moveFilter: currentRobotConfig.moveFilter,
        usePruning: true,
      })

      const { request } = buildHintContextFromGame(rolled as any)
      request.dice = [rollTuple[0], rollTuple[1]]

      // Get multiple hints for PR calculation
      const hints = await getGnuMoveHints(request, 5)
      const bestHintEquity = hints?.[0]?.equity ?? 0

      // Prepare alternate hints with swapped dice
      const altReq = { ...request, dice: [rollTuple[1], rollTuple[0]] as [number, number] }
      const altHints = (!hints || hints.length === 0 || !hints[0].moves?.length)
        ? await getGnuMoveHints(altReq, 1)
        : []

      // Execute moves
      let moveCount = 0
      let hintSeq = (hints && hints[0] && Array.isArray(hints[0].moves)) ? hints[0].moves : []
      const hintSeqAlt = (altHints && altHints[0] && Array.isArray(altHints[0].moves)) ? altHints[0].moves : []
      let stepIndex = 0
      let executedHintRank = 0 // Track which hint rank was matched

      // Track executed moves for random robot (to compare against analysis later)
      const executedMoveSequence: Array<{ from: number; to: number; fromContainer: string; toContainer: string }> = []

      while (moving.stateKind === 'moving') {
        const readyMoves = Array.from(moving.activePlay.moves).filter(
          (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
        )
        if (readyMoves.length === 0) break

        let chosenDie: number | undefined
        let selectedOrigin: any
        let possibleMoves: BackgammonMoveSkeleton[] = []
        const direction = (moving.activePlayer as any).direction as 'clockwise' | 'counterclockwise'

        // For random robot: collect all legal moves and pick one randomly
        if (currentRobotConfig.isRandom) {
          const allLegalMoves: Array<{ die: number; origin: any; move: BackgammonMoveSkeleton }> = []
          for (const m of readyMoves) {
            const dv = (m as any).dieValue as number
            const pm = Board.getPossibleMoves(
              (moving as any).board,
              (moving as any).activePlay.player,
              dv as any
            ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
            const arr = Array.isArray(pm) ? pm : pm.moves
            for (const mv of arr) {
              allLegalMoves.push({ die: dv, origin: (mv as any).origin, move: mv })
            }
          }
          if (allLegalMoves.length > 0) {
            // Pick random move
            const randomIdx = Math.floor(Math.random() * allLegalMoves.length)
            const chosen = allLegalMoves[randomIdx]
            chosenDie = chosen.die
            selectedOrigin = chosen.origin
            // Track for later comparison
            const fromKind = getContainerKind(chosen.move.origin as any)
            const toKind = getContainerKind(chosen.move.destination as any)
            const from = getNormalizedPosition(chosen.move.origin as any, direction)
            const to = getNormalizedPosition(chosen.move.destination as any, direction)
            if (from !== null && to !== null) {
              executedMoveSequence.push({ from, to, fromContainer: fromKind, toContainer: toKind })
            }
          }
        } else {
          // Normal hint-following logic for gnubg robots
          let executedMove: BackgammonMoveSkeleton | null = null

          const tryMap = (target: any) => {
            for (const m of readyMoves) {
              const dv = (m as any).dieValue as number
              const pm = Board.getPossibleMoves(
                (moving as any).board,
                (moving as any).activePlay.player,
                dv as any
              ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
              const arr = Array.isArray(pm) ? pm : pm.moves
              for (const mv of arr) {
                const fromKind = getContainerKind(mv.origin as any)
                const toKind = getContainerKind(mv.destination as any)
                const from = getNormalizedPosition(mv.origin as any, direction)
                const to = getNormalizedPosition(mv.destination as any, direction)
                if (from === null || to === null) continue
                if (
                  target.from === from &&
                  target.to === to &&
                  target.fromContainer === fromKind &&
                  target.toContainer === toKind
                ) {
                  chosenDie = dv
                  selectedOrigin = (mv as any).origin
                  possibleMoves = arr
                  executedMove = mv
                  return true
                }
              }
            }
            return false
          }

          const target = (stepIndex < hintSeq.length) ? hintSeq[stepIndex] : undefined
          if (target) {
            if (!tryMap(target)) {
              if (stepIndex === 0 && hintSeqAlt.length > 0) {
                const altTarget = hintSeqAlt[0]
                if (tryMap(altTarget)) {
                  hintSeq = hintSeqAlt
                }
              }
            }
          }

          if (!chosenDie) {
            // Fallback: pick any legal move (counts as not matching best hint)
            executedHintRank = -1 // Fallback
            const m = readyMoves[0] as any
            const pm = Board.getPossibleMoves(
              (moving as any).board,
              (moving as any).activePlay.player,
              (m as any).dieValue as any
            ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
            const arr = Array.isArray(pm) ? pm : pm.moves
            if (arr.length > 0) {
              chosenDie = (m as any).dieValue
              possibleMoves = arr
              selectedOrigin = (arr[0] as any).origin
              executedMove = arr[0]
            }
          }

          // Track actual executed move for gnubg robots too
          if (executedMove) {
            const fromKind = getContainerKind(executedMove.origin as any)
            const toKind = getContainerKind(executedMove.destination as any)
            const from = getNormalizedPosition(executedMove.origin as any, direction)
            const to = getNormalizedPosition(executedMove.destination as any, direction)
            if (from !== null && to !== null) {
              executedMoveSequence.push({ from, to, fromContainer: fromKind, toContainer: toKind })
            }
          }
        }

        if (!chosenDie || !selectedOrigin) break
        const originChecker = (selectedOrigin as any).checkers.find(
          (c: any) => c.color === (moving as any).activeColor
        )
        if (!originChecker) break
        const moved = Game.move(moving as BackgammonGameMoving, originChecker.id)
        moveCount++
        if (!currentRobotConfig.isRandom && stepIndex < hintSeq.length) stepIndex++
        if ((moved as any).stateKind === 'moved') {
          moving = moved as BackgammonGameMoved
          break
        } else if ('board' in moved) {
          moving = moved as BackgammonGameMoving
        } else {
          break
        }
      }

      // Analyze the played moves with stronger 4-ply engine for accurate PR
      if (moveCount > 0) {
        // Reconfigure to analysis strength (4-ply)
        await configureGnubgHints({
          evalPlies: ANALYSIS_PLY,
          moveFilter: ANALYSIS_FILTER,
          usePruning: true,
        })

        // Get analysis hints for the position BEFORE the moves were made
        const analysisHints = await getGnuMoveHints(request, 10)
        const bestAnalysisEquity = analysisHints?.[0]?.equity ?? 0

        // Find which rank in analysis hints matches what the robot played
        let matchedRank = -1
        let matchedEquity = 0

        // Always use executedMoveSequence - tracks what was actually played
        const playedSequence = executedMoveSequence

        if (analysisHints && analysisHints.length > 0 && playedSequence.length > 0) {
          // Compare played sequence against each analysis hint
          for (let rank = 0; rank < analysisHints.length; rank++) {
            const analysisSeq = analysisHints[rank]?.moves ?? []
            if (analysisSeq.length === playedSequence.length) {
              let allMatch = true
              for (let i = 0; i < playedSequence.length && i < analysisSeq.length; i++) {
                if (playedSequence[i]?.from !== analysisSeq[i]?.from ||
                    playedSequence[i]?.to !== analysisSeq[i]?.to) {
                  allMatch = false
                  break
                }
              }
              if (allMatch) {
                matchedRank = rank
                matchedEquity = analysisHints[rank]?.equity ?? 0
                break
              }
            }
          }
        }

        // Calculate equity loss: best analysis equity - what robot played
        // If no match found, use worst hint's equity from analysis
        const worstAnalysisEquity = analysisHints?.[analysisHints.length - 1]?.equity ?? (bestAnalysisEquity - 0.1)
        const executedEquity = matchedRank >= 0 ? matchedEquity : worstAnalysisEquity
        const equityLoss = Math.max(0, bestAnalysisEquity - executedEquity)

        // Diagnostic: log equity values for first few games
        if (gameNumber <= 2 && !quiet) {
          console.log(`    Turn ${turn}: matchedRank=${matchedRank}, bestEq=${bestAnalysisEquity.toFixed(4)}, execEq=${executedEquity.toFixed(4)}, loss=${equityLoss.toFixed(4)}, PR contrib=${(equityLoss * 1000).toFixed(2)}`)
          if (analysisHints && analysisHints.length > 0) {
            console.log(`      Analysis hints: ${analysisHints.slice(0, 5).map((h, i) => `#${i}:${h.equity?.toFixed(4)}`).join(', ')}`)
          }
        }

        currentMoves.push({
          dice: rollTuple,
          hintEquity: bestAnalysisEquity,
          executedEquity,
          equityLoss,
          hintRank: matchedRank,
        })
      }

      // Complete no-move/completion
      if (moving.stateKind === 'moving') {
        const completed = Game.checkAndCompleteTurn(moving as BackgammonGameMoving)
        moving = completed as any
      }

      // Winner check
      const winner = checkWin((moving as any).board || rolled.board)
      if (winner) {
        const robot1PR = calculatePR(robot1Moves)
        const robot2PR = calculatePR(robot2Moves)
        return {
          gameNumber,
          winner,
          turns: turn,
          robot1Color,
          robot1Moves,
          robot2Moves,
          robot1PR,
          robot2PR,
        }
      }

      // Advance turn
      if ((moving as any).stateKind === 'moved') {
        state = Game.confirmTurn(moving as BackgammonGameMoved)
      } else {
        state = moving
      }
    } catch (e) {
      if (!quiet) console.error(`    Error in game ${gameNumber}:`, e)
      break
    }
  }

  // Max turns reached
  const robot1PR = calculatePR(robot1Moves)
  const robot2PR = calculatePR(robot2Moves)
  return {
    gameNumber,
    winner: null,
    turns: turn,
    robot1Color,
    robot1Moves,
    robot2Moves,
    robot1PR,
    robot2PR,
  }
}

async function runMatchup(
  robot1: RobotConfig,
  robot2: RobotConfig,
  games: number,
  quiet: boolean
): Promise<MatchupResult> {
  console.log(`\nRunning ${games} games: ${robot1.name} vs ${robot2.name}`)

  const gameResults: GameResult[] = []
  const robot1PRs: number[] = []
  const robot2PRs: number[] = []
  let robot1Wins = 0
  let robot2Wins = 0

  for (let i = 0; i < games; i++) {
    const result = await simulateGameWithPR(robot1, robot2, i + 1, quiet)
    gameResults.push(result)
    robot1PRs.push(result.robot1PR)
    robot2PRs.push(result.robot2PR)

    if (result.winner === 'white') robot1Wins++
    else if (result.winner === 'black') robot2Wins++

    if (!quiet && (i + 1) % 10 === 0) {
      console.log(`  Completed ${i + 1}/${games} games`)
    }
  }

  const robot1Stats = calculateStats(robot1PRs)
  const robot2Stats = calculateStats(robot2PRs)

  return {
    robot1,
    robot2,
    games: gameResults,
    robot1Stats: {
      totalGames: games,
      wins: robot1Wins,
      prValues: robot1PRs,
      meanPR: robot1Stats.mean,
      medianPR: robot1Stats.median,
      stdDevPR: robot1Stats.stdDev,
    },
    robot2Stats: {
      totalGames: games,
      wins: robot2Wins,
      prValues: robot2PRs,
      meanPR: robot2Stats.mean,
      medianPR: robot2Stats.median,
      stdDevPR: robot2Stats.stdDev,
    },
  }
}

async function main() {
  const config = parseArgs()
  const { games, outputDir, quiet, matchups } = config

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const tournamentId = `calibration-${timestamp}`

  // Define matchups if not specified
  const matchupsToRun = matchups ?? [
    // Self-play matches
    { robot1: 'GNU Grandmaster', robot2: 'GNU Grandmaster' },
    { robot1: 'GNU World Class', robot2: 'GNU World Class' },
    { robot1: 'GNU Expert', robot2: 'GNU Expert' },
    // Cross-tier matches
    { robot1: 'GNU Grandmaster', robot2: 'GNU World Class' },
    { robot1: 'GNU World Class', robot2: 'GNU Expert' },
    { robot1: 'GNU Expert', robot2: 'GNU Advanced' },
    { robot1: 'GNU Advanced', robot2: 'GNU Intermediate' },
  ]

  console.log(`\n=== Robot Tournament: ${tournamentId} ===`)
  console.log(`Games per matchup: ${games}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Matchups: ${matchupsToRun.length}`)

  const allResults: MatchupResult[] = []

  for (const matchup of matchupsToRun) {
    const robot1 = GNU_ROBOTS.find(r => r.name === matchup.robot1)
    const robot2 = GNU_ROBOTS.find(r => r.name === matchup.robot2)

    if (!robot1 || !robot2) {
      console.error(`Unknown robot: ${matchup.robot1} or ${matchup.robot2}`)
      continue
    }

    const result = await runMatchup(robot1, robot2, games, quiet)
    allResults.push(result)

    // Print summary for this matchup
    console.log(`\n  Results for ${robot1.name} vs ${robot2.name}:`)
    console.log(`    ${robot1.name}: wins=${result.robot1Stats.wins}, PR mean=${result.robot1Stats.meanPR.toFixed(2)}, median=${result.robot1Stats.medianPR.toFixed(2)}, stdDev=${result.robot1Stats.stdDevPR.toFixed(2)}`)
    console.log(`    ${robot2.name}: wins=${result.robot2Stats.wins}, PR mean=${result.robot2Stats.meanPR.toFixed(2)}, median=${result.robot2Stats.medianPR.toFixed(2)}, stdDev=${result.robot2Stats.stdDevPR.toFixed(2)}`)
  }

  // Save results to JSON
  const outputFile = path.join(outputDir, `${tournamentId}.json`)
  const tournamentData = {
    tournamentId,
    timestamp: new Date().toISOString(),
    config: { games, matchupsCount: matchupsToRun.length },
    officialThresholds: GNU_OFFICIAL_THRESHOLDS,
    matchups: allResults.map(r => ({
      robot1: { name: r.robot1.name, evalPlies: r.robot1.evalPlies, expectedPR: r.robot1.expectedPR },
      robot2: { name: r.robot2.name, evalPlies: r.robot2.evalPlies, expectedPR: r.robot2.expectedPR },
      robot1Stats: {
        wins: r.robot1Stats.wins,
        meanPR: r.robot1Stats.meanPR,
        medianPR: r.robot1Stats.medianPR,
        stdDevPR: r.robot1Stats.stdDevPR,
      },
      robot2Stats: {
        wins: r.robot2Stats.wins,
        meanPR: r.robot2Stats.meanPR,
        medianPR: r.robot2Stats.medianPR,
        stdDevPR: r.robot2Stats.stdDevPR,
      },
    })),
  }

  fs.writeFileSync(outputFile, JSON.stringify(tournamentData, null, 2))
  console.log(`\nResults saved to: ${outputFile}`)

  // Print overall summary
  console.log('\n=== Tournament Summary ===')
  const robotPRs = new Map<string, number[]>()
  for (const result of allResults) {
    const r1PRs = robotPRs.get(result.robot1.name) || []
    r1PRs.push(result.robot1Stats.meanPR)
    robotPRs.set(result.robot1.name, r1PRs)

    const r2PRs = robotPRs.get(result.robot2.name) || []
    r2PRs.push(result.robot2Stats.meanPR)
    robotPRs.set(result.robot2.name, r2PRs)
  }

  console.log('\nMeasured PRs by robot (across all matchups):')
  for (const [name, prs] of Array.from(robotPRs.entries())) {
    const avgPR = prs.reduce((a, b) => a + b, 0) / prs.length
    const robot = GNU_ROBOTS.find(r => r.name === name)
    const expectedPR = robot?.expectedPR ?? 0
    const diff = avgPR - expectedPR
    console.log(`  ${name}: measured=${avgPR.toFixed(2)}, expected=${expectedPR.toFixed(2)}, diff=${diff > 0 ? '+' : ''}${diff.toFixed(2)}`)
  }

  console.log('\nOfficial GNU Backgammon thresholds (for reference):')
  console.log('  Supernatural: <= 2, World Class: <= 5, Expert: <= 8')
  console.log('  Advanced: <= 12, Intermediate: <= 18, Casual: <= 26, Beginner: <= 35')
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Tournament failed:', err)
    process.exit(1)
  })
}

export { main as runRobotTournament, GNU_ROBOTS, GNU_OFFICIAL_THRESHOLDS }
