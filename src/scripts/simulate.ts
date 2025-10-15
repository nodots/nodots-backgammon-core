import {
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonMove,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '..'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import * as fs from 'fs'
import * as path from 'path'
// Prefer request-based hints via AI package to avoid PID encoding brittleness
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
} from '@nodots-llc/backgammon-ai'
import { logger } from '../utils/logger'

// Mapping debug flag: enable with `npm run simulate -- --mapping-debug`
const MAPPING_DEBUG = process.argv.includes('--mapping-debug')
// Performance/verbosity flags
const QUIET = process.argv.includes('--quiet') || process.env.NODOTS_SIM_QUIET === '1'
const FAST = process.argv.includes('--fast') || process.env.NODOTS_SIM_FAST === '1'
const MAPPING_SAMPLE = (() => {
  const arg = process.argv.find((a) => a.startsWith('--mapping-sample='))
  if (!arg) return 0
  const v = parseInt(arg.split('=')[1] || '0', 10)
  return Number.isFinite(v) && v > 0 ? v : 0
})()
const MAPPING_SAMPLES_LEFT: Record<'white' | 'black', number> = {
  white: MAPPING_SAMPLE,
  black: MAPPING_SAMPLE,
}
const GNU_MAPPER: 'ai' | 'steps' = (() => {
  const arg = process.argv.find((a) => a.startsWith('--gnu-mapper='))
  if (!arg) return 'ai'
  const v = arg.split('=')[1]
  return v === 'steps' ? 'steps' : 'ai'
})()

interface SimulationStats {
  totalTurns: number
  totalMoves: number // includes no-move (dice used)
  executedMoves: number // checker movements only
  noMoves: number // number of completed no-move entries
  whiteCheckersOff: number
  blackCheckersOff: number
}

function debugDumpMapping(
  gameMoved: any,
  hints: any[] | null,
  normalization: any,
): void {
  try {
    const pid = exportToGnuPositionId(gameMoved as any)
    const roll = (gameMoved as any).activePlayer?.dice?.currentRoll
    console.log('\n[Mapping Debug] ----')
    console.log('[Mapping Debug] GNU Position ID:', pid)
    console.log('[Mapping Debug] Active:', (gameMoved as any).activeColor, (gameMoved as any).activePlayer?.direction)
    console.log('[Mapping Debug] Roll:', Array.isArray(roll) ? roll.join(',') : roll)
    if (hints && hints.length > 0) {
      const steps = (hints as any)[0]?.moves || []
      console.log('[Mapping Debug] Top hint steps:', steps)
    } else {
      console.log('[Mapping Debug] No hints returned')
    }
    const readyMovesAll: any[] = (Array.from(((gameMoved as any).activePlay?.moves || []) as any) as any[]).filter((m: any) => m.stateKind === 'ready')
    console.log('[Mapping Debug] Ready dice:', (readyMovesAll as any[]).map((m: any) => m.dieValue))
    for (const m of readyMovesAll as any[]) {
      const pm = Board.getPossibleMoves(
        (gameMoved as any).board,
        (gameMoved as any).activePlay.player,
        m.dieValue
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const movesArr = Array.isArray(pm) ? pm : pm.moves
      const normalizedColor = normalization?.toGnu?.[(gameMoved as any).activePlayer?.color] || 'white'
      const mapped = movesArr.map((mv) => ({
        from: getNormalizedPosition((mv as any).origin, normalizedColor as any),
        to: getNormalizedPosition((mv as any).destination, normalizedColor as any),
        fromContainer: getContainerKind((mv as any).origin),
        toContainer: getContainerKind((mv as any).destination),
      }))
      console.log(`[Mapping Debug] Die ${m.dieValue} possible (normalized):`, mapped)
    }
    console.log('[Mapping Debug] ----\n')
  } catch (e) {
    console.log('[Mapping Debug] Failed to dump mapping:', e)
  }
}

function writeMappingSample(
  gameMoved: any,
  hints: any[] | null,
  normalization: any
) {
  try {
    const color = (gameMoved as any).activePlayer?.color as 'white' | 'black'
    if (!color) return
    if (MAPPING_SAMPLES_LEFT[color] <= 0) return
    MAPPING_SAMPLES_LEFT[color]--
    const logsDir = path.join(process.cwd(), 'game-logs')
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    const logFile = path.join(logsDir, `mapping-${color}.log`)
    const pid = exportToGnuPositionId(gameMoved as any)
    const roll = (gameMoved as any).activePlayer?.dice?.currentRoll
    const readyMovesAll: any[] = (Array.from(((gameMoved as any).activePlay?.moves || []) as any) as any[]).filter((m: any) => m.stateKind === 'ready')
    const normalizedColor = normalization?.toGnu?.[(gameMoved as any).activePlayer?.color] || 'white'
    const lines: string[] = []
    lines.push(`time=${new Date().toISOString()} pid=${pid} color=${color} roll=${Array.isArray(roll) ? roll.join(',') : roll}`)
    // Top hint step
    const step = hints && hints[0] && hints[0].moves && hints[0].moves[0]
    if (step) {
      lines.push(`hintStep from=${step.from} to=${step.to} fromC=${step.fromContainer} toC=${step.toContainer}`)
    } else {
      lines.push(`hintStep none`)
    }
    // Enumerate normalized possible moves for each ready die
    for (const m of readyMovesAll) {
      const die = m.dieValue
      const pm = Board.getPossibleMoves(
        (gameMoved as any).board,
        (gameMoved as any).activePlay.player,
        die
      ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
      const arr = Array.isArray(pm) ? pm : pm.moves
      const mapped = arr.map((mv: any) => ({
        from: getNormalizedPosition(mv.origin, normalizedColor as any),
        to: getNormalizedPosition(mv.destination, normalizedColor as any),
        fromC: getContainerKind(mv.origin),
        toC: getContainerKind(mv.destination),
      }))
      lines.push(`die=${die} possible=${mapped.length} -> ` + mapped.map((x) => `${x.from}:${x.to}:${x.fromC}->${x.toC}`).join(','))
    }
    lines.push('---\n')
    fs.appendFileSync(logFile, lines.join('\n'))
  } catch {
    // ignore sample write errors
  }
}

function displayTurnInfo(
  turnNumber: number,
  activeColor: string,
  roll: number[],
  activeLabel: string
) {
  if (QUIET) return
  const message = `\n=== Turn ${turnNumber} (${activeLabel}) ===\n\n${activeColor}'s roll: ${roll.join(', ')}\n`
  if (!QUIET) console.log(message)
  logger.info('[Simulation] Turn info:', {
    turnNumber,
    activeColor,
    roll,
    activeLabel,
  })
}

function displayMoveInfo(
  moveNumber: number,
  origin: BackgammonMoveOrigin,
  destination: any
) {
  const originStr = origin.kind === 'point' ? origin.position.clockwise : 'bar'
  const destStr =
    destination.kind === 'point' ? destination.position.clockwise : 'off'
  const message = `Move ${moveNumber}: from ${originStr} to ${destStr}\n`
  console.log(message)
  logger.info('[Simulation] Move info:', {
    moveNumber,
    origin: originStr,
    destination: destStr,
    originKind: origin.kind,
    destinationKind: destination.kind,
  })
}

function getStats(board: any): SimulationStats {
  // Count off checkers per correct direction for each color
  const whiteOff = board.off.clockwise.checkers.filter(
    (c: any) => c.color === 'white'
  ).length
  const blackOff = board.off.counterclockwise.checkers.filter(
    (c: any) => c.color === 'black'
  ).length

  return {
    totalTurns: 0, // Will be updated in main function
    totalMoves: 0, // Will be updated in main function
    executedMoves: 0,
    noMoves: 0,
    whiteCheckersOff: whiteOff,
    blackCheckersOff: blackOff,
  }
}

function displayStats(stats: SimulationStats, gnuIsWhite: boolean) {
  const gnuOff = gnuIsWhite ? stats.whiteCheckersOff : stats.blackCheckersOff
  const nodotsOff = gnuIsWhite ? stats.blackCheckersOff : stats.whiteCheckersOff
  const message = `\n=== Simulation Statistics ===
Total Turns: ${stats.totalTurns}
Total Moves (incl. no-move): ${stats.totalMoves}
Executed Checker Moves: ${stats.executedMoves}
No-Moves: ${stats.noMoves}
GNU Checkers Off: ${gnuOff}
Nodots Engine Checkers Off: ${nodotsOff}`
  console.log(message)
  logger.info('[Simulation] Statistics:', { ...stats, gnuIsWhite, gnuOff, nodotsOff })
}

function checkWinCondition(board: any): 'white' | 'black' | null {
  // A player wins when all their checkers are off via their bearing direction
  const whiteCheckersOff = board.off.clockwise.checkers.filter(
    (c: any) => c.color === 'white'
  ).length
  const blackCheckersOff = board.off.counterclockwise.checkers.filter(
    (c: any) => c.color === 'black'
  ).length

  if (whiteCheckersOff === 15) return 'white'
  if (blackCheckersOff === 15) return 'black'
  return null
}

// Optional dice seeding for reproducibility
function seedRandom(seed: number) {
  let t = seed >>> 0
  // Mulberry32
  const rng = () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  // Patch Math.random
  ;(Math as any).random = rng
}

export async function runSimulation(maxTurns: number = 100): Promise<
  | void
  | {
      winner: 'white' | 'black' | null
      turnCount: number
      executedMoves: number
      totalMoves: number
      noMoves: number
      gnuColor: 'white' | 'black'
      // instrumentation
      gnuHintsAttempted: number
      gnuHintsMatched: number
      nodotsOpeningChosen: number
      nodotsStrategicChosen: number
      firstMoverColor: 'white' | 'black'
    }
> {
  // Initialize players
  const whitePlayer = Player.initialize(
    'white',
    'clockwise',
    'rolling-for-start',
    true
  )
  const blackPlayer = Player.initialize(
    'black',
    'counterclockwise',
    'rolling-for-start',
    true
  )
  const players = [whitePlayer, blackPlayer] as [
    typeof whitePlayer,
    typeof blackPlayer
  ]

  // Optional seeding
  const seedArg = process.argv.find((a) => a.startsWith('--seed='))
  if (seedArg) {
    const sv = parseInt(seedArg.split('=')[1] || '0', 10)
    if (!Number.isNaN(sv)) seedRandom(sv)
  }

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  // Randomize roles between GNU and Nodots Engine
  // Allow overriding which color GNU plays via --gnu-color=white|black
  const gnuColorArg = process.argv.find((a) => a.startsWith('--gnu-color='))
  const gnuColor = gnuColorArg
    ? (gnuColorArg.split('=')[1] as 'white' | 'black')
    : undefined
  const gnuIsWhite = gnuColor ? gnuColor === 'white' : Math.random() < 0.5
  const labels: Record<string, string> = gnuIsWhite
    ? { [whitePlayer.id]: 'GNU', [blackPlayer.id]: 'Nodots Engine' }
    : { [whitePlayer.id]: 'Nodots Engine', [blackPlayer.id]: 'GNU' }
  if (!QUIET) {
    console.log(
      gnuIsWhite
        ? `Players: GNU (white) vs Nodots Engine (black)\n`
        : `Players: Nodots Engine (white) vs GNU (black)\n`
    )
  }
  let turnCount = 0
  let executedMovesTotal = 0 // actual checker movements
  let diceUsedTotal = 0 // includes no-move
  let noMovesTotal = 0
  let lastBoard = game.board
  // instrumentation counters
  let gnuHintsAttempted = 0
  let gnuHintsMatched = 0
  let nodotsOpeningChosen = 0
  let nodotsStrategicChosen = 0

  // Roll for start
  let gameState: BackgammonGameRolledForStart | BackgammonGameRolling =
    Game.rollForStart(game)
  const firstMoverColor = (gameState as any).activeColor as 'white' | 'black'
  if (!QUIET) {
    console.log('Initial board state:')
    logger.info('[Simulation] Initial board state')
    try {
      const ascii = Board.getAsciiGameBoard(
        gameState.board,
        (gameState as any).players,
        (gameState as any).activeColor,
        (gameState as any).stateKind,
        undefined,
        labels
      )
      console.log(ascii)
    } catch {
      Board.displayAsciiBoard(gameState.board)
    }
  }

  // If maxTurns is 0, run until there's a winner
  const shouldRunUntilWinner = maxTurns === 0

  while (shouldRunUntilWinner || turnCount < maxTurns) {
    turnCount++

    // Roll dice from current state
    const gameRolled = Game.roll(gameState)
    const roll = gameRolled.activePlayer.dice.currentRoll
    displayTurnInfo(
      turnCount,
      gameRolled.activeColor,
      roll,
      labels[gameRolled.activePlayer.id] || 'Simple Heuristic'
    )

    // Make moves until no more valid moves are available
    let moveCount = 0
    let gameMoved: BackgammonGameMoving | BackgammonGameMoved = gameRolled

    try {
      while (
        gameMoved.stateKind === 'moving' &&
        Array.from(gameMoved.activePlay.moves).some((m: any) => {
          if (m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)) {
            const pm = Board.getPossibleMoves(gameMoved.board, m.player, m.dieValue) as
              | BackgammonMoveSkeleton[]
              | { moves: BackgammonMoveSkeleton[] }
            const movesArr = Array.isArray(pm) ? pm : pm.moves
            return movesArr.length > 0
          }
          return false
        })
      ) {
        const isGnu = labels[gameMoved.activePlayer.id] === 'GNU'
        let chosenDie: number | undefined
        let possibleMoves: BackgammonMoveSkeleton[] = []
        let selectedOrigin: { id: string; kind: string; checkers: any[] } | undefined

        // Cache possible moves per die for current board state
        const readyMovesAll = Array.from(gameMoved.activePlay.moves).filter((m: any) => m.stateKind === 'ready')
        const dieCache = new Map<number, BackgammonMoveSkeleton[]>()
        const getMovesForDie = (dv: number) => {
          if (dieCache.has(dv)) return dieCache.get(dv)!
          const pm = Board.getPossibleMoves(
            gameMoved.board,
            (gameMoved as any).activePlay.player,
            dv as any
          ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
          const arr = Array.isArray(pm) ? pm : pm.moves
          dieCache.set(dv, arr)
          return arr
        }
        if (isGnu) {
          // Strict: request-based hints; backend selection via --gnu-mapper=ai|steps (default ai)
          await initializeGnubgHints()
          await configureGnubgHints({ evalPlies: FAST ? 1 : 2, moveFilter: FAST ? 1 : 2, usePruning: true })
          const { request, normalization } = buildHintContextFromGame(gameMoved as any)
          const rollTuple = gameMoved.activePlayer.dice.currentRoll as [number, number]
          request.dice = [rollTuple[0], rollTuple[1]]
          let hints: any[] = []
          if (FAST) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const aiModule = await import('@nodots-llc/backgammon-ai')
            const best = await aiModule.getBestMove(request)
            if (best) hints = [best]
          } else {
            hints = await getGnuMoveHints(request, GNU_MAPPER === 'ai' ? 3 : 1)
          }
          gnuHintsAttempted++
          if (!hints || hints.length === 0 || !hints[0].moves || hints[0].moves.length === 0) {
            if (MAPPING_DEBUG) {
              debugDumpMapping(gameMoved, hints || null, normalization)
            }
            request.dice = [rollTuple[1], rollTuple[0]]
            let retry: any[] = []
            if (FAST) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const aiModule = await import('@nodots-llc/backgammon-ai')
              const best2 = await aiModule.getBestMove(request)
              if (best2) retry = [best2]
            } else {
              retry = await getGnuMoveHints(request, GNU_MAPPER === 'ai' ? 3 : 1)
            }
            if (!retry || retry.length === 0 || !retry[0].moves || retry[0].moves.length === 0) {
              if (MAPPING_DEBUG) {
                debugDumpMapping(gameMoved, retry || null, normalization)
              }
              // Fallback: no GNU hints; select a playable move from current dice
              for (const m of readyMovesAll) {
                const movesArr = getMovesForDie(m.dieValue)
                if (movesArr.length > 0) {
                  chosenDie = m.dieValue
                  possibleMoves = movesArr
                  selectedOrigin = undefined
                  break
                }
              }
              // If still no move candidates, delegate to Nodots AI for a robust fallback
              if (!chosenDie) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const aiModule = await import('@nodots-llc/backgammon-ai')
                const best = await aiModule.selectBestMove(gameMoved.activePlay, 'nodots')
                if (best) {
                  chosenDie = (best as any).dieValue
                  const pm2 = Board.getPossibleMoves(
                    gameMoved.board,
                    (best as any).player,
                    (best as any).dieValue
                  ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                  possibleMoves = Array.isArray(pm2) ? pm2 : pm2.moves
                  selectedOrigin = undefined
                }
              }
              // Exit GNU branch early if we constructed a fallback
              if (chosenDie) {
                // do not set hints; proceed with fallback-selected die and moves
                // to the common move selection code below
              } else {
                const roll = (gameMoved as any).activePlayer?.dice?.currentRoll?.join(',')
                const pid = exportToGnuPositionId(gameMoved as any)
                throw new Error(`GNU hints not available or empty for current position/roll | pid=${pid} roll=${roll} color=${(gameMoved as any).activeColor} dir=${(gameMoved as any).activePlayer?.direction}`)
              }
            } else {
              hints = retry
            }
          }

          // Strict mapping with exact normalized step match (from/to + container kinds)
          const { color } = gameMoved.activePlayer as any
          const normalizedColor = (normalization.toGnu[color as 'white' | 'black'] as 'white' | 'black')

          let matched = false
          if (GNU_MAPPER === 'ai') {
            // Iterate hints by rank (first match wins)
            for (const hint of hints) {
              if (!hint.moves || hint.moves.length === 0) continue
              const step = hint.moves[0] as any
              for (const m of readyMovesAll) {
                const dv = m.dieValue
                const movesArr = getMovesForDie(dv)
                for (const mv of movesArr) {
                  const from = getNormalizedPosition(mv.origin as any, normalizedColor)
                  const to = getNormalizedPosition(mv.destination as any, normalizedColor)
                  if (from === null || to === null) continue
                  const fromKind = getContainerKind(mv.origin as any)
                  const toKind = getContainerKind(mv.destination as any)
                  if (step.from === from && step.to === to && step.fromContainer === fromKind && step.toContainer === toKind) {
                    chosenDie = dv
                    possibleMoves = movesArr
                    selectedOrigin = mv.origin as any
                    matched = true
                    break
                  }
                }
                if (matched) break
              }
              if (matched) break
            }
          } else {
            // steps: only first hint's sequence
            const gmSeq = hints[0].moves
            for (const step of gmSeq) {
              for (const m of readyMovesAll) {
                const dv = m.dieValue
                const movesArr = getMovesForDie(dv)
                for (const mv of movesArr) {
                  const from = getNormalizedPosition(mv.origin as any, normalizedColor)
                  const to = getNormalizedPosition(mv.destination as any, normalizedColor)
                  if (from === null || to === null) continue
                  const fromKind = getContainerKind(mv.origin as any)
                  const toKind = getContainerKind(mv.destination as any)
                  if ((step as any).from === from && (step as any).to === to && (step as any).fromContainer === fromKind && (step as any).toContainer === toKind) {
                    chosenDie = dv
                    possibleMoves = movesArr
                    selectedOrigin = mv.origin as any
                    matched = true
                    break
                  }
                }
                if (matched) break
              }
              if (matched) break
            }
          }

          if (!matched || !chosenDie) {
            if (MAPPING_DEBUG) {
              debugDumpMapping(gameMoved, hints || null, normalization)
            }
            if (MAPPING_SAMPLE > 0) {
              writeMappingSample(gameMoved, hints || null, normalization)
            }
            // Fallback: choose any playable move for a ready die value
            for (const m of readyMovesAll) {
              const movesArr = getMovesForDie(m.dieValue)
              if (movesArr.length > 0) {
                chosenDie = m.dieValue
                possibleMoves = movesArr
                selectedOrigin = undefined
                break
              }
            }
            if (!chosenDie) {
              const pid = exportToGnuPositionId(gameMoved as any)
              throw new Error(
                `GNU suggested sequence has no playable step for current dice | pid=${pid} roll=${rollTuple.join(',')}`
              )
            }
          } else {
            gnuHintsMatched++
          }
        }
        if (!isGnu || !chosenDie) {
          // Strictly require Nodots AI; no fallback allowed
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const aiModule = await import('@nodots-llc/backgammon-ai')
          const best = await aiModule.selectBestMove(gameMoved.activePlay, 'nodots')
          if (!best) {
            throw new Error('Nodots AI did not return a move')
          }
          chosenDie = (best as any).dieValue
          possibleMoves = (best as any).possibleMoves && (best as any).possibleMoves.length
            ? (best as any).possibleMoves
            : ((): BackgammonMoveSkeleton[] => {
                const pm2 = Board.getPossibleMoves(
                  gameMoved.board,
                  (best as any).player,
                  (best as any).dieValue
                ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                return Array.isArray(pm2) ? pm2 : pm2.moves
              })()
          selectedOrigin = undefined
          const src = (best as any).__source
          if (src === 'opening') nodotsOpeningChosen++
          if (src === 'strategic') nodotsStrategicChosen++
        }

        // Display possible moves unless running in quiet/fast mode
        if (!QUIET && !FAST) {
          console.log(`\nPossible moves for die value ${chosenDie}:`)
          logger.info('[Simulation] Possible moves for die value:', {
            dieValue: chosenDie,
            possibleMovesCount: possibleMoves.length,
          })
          possibleMoves.forEach((possibleMove, index) => {
            const fromPoint =
              possibleMove.origin.kind === 'point'
                ? possibleMove.origin.position.clockwise
                : 'bar'
            const checkerCount =
              possibleMove.origin.kind === 'point'
                ? possibleMove.origin.checkers.length
                : possibleMove.origin.checkers.length
            const toPoint =
              possibleMove.destination.kind === 'point'
                ? possibleMove.destination.position.clockwise
                : 'off'
            console.log(
              `  ${index + 1}: from ${fromPoint} (${checkerCount} checkers) to ${toPoint}`
            )
          })
        }

        // Take the selected origin if GNU chose one; otherwise first valid
        let validMove: any = null
        if (selectedOrigin) {
          validMove = possibleMoves.find(
            (mv) => (mv as any).origin?.id === (selectedOrigin as any).id
          )
        }
        if (!validMove) {
          for (const move of possibleMoves) {
            const origin = move.origin
            const checkers = origin.checkers
            if (
              checkers.length > 0 &&
              checkers[0].color === gameMoved.activeColor
            ) {
              validMove = move
              break
            }
          }
        }

        if (!validMove) {
          if (!QUIET) console.log('\nNo valid moves with checkers found')
          logger.warn('[Simulation] No valid moves with checkers found')
          break
        }

        const origin = validMove.origin
        const destination = validMove.destination

        if (!QUIET)
          console.log(
            `\nMove ${moveCount + 1}: from ${
              origin.kind === 'point' ? origin.position.clockwise : 'bar'
            } to ${
              destination.kind === 'point'
                ? destination.position.clockwise
                : 'off'
            }`
          )

        if (!QUIET && !FAST) {
          console.log('\nBoard before move:')
          logger.info('[Simulation] Board before move')
          try {
            const asciiBefore = Board.getAsciiGameBoard(
              (gameMoved as any).board,
              (gameMoved as any).players,
              (gameMoved as any).activeColor,
              (gameMoved as any).stateKind,
              undefined,
              labels
            )
            console.log(asciiBefore)
          } catch {
            Board.displayAsciiBoard((gameMoved as any).board)
          }
        }

        try {
          // Ensure proper state transition before move
          const gameToMove = gameMoved
          const originChecker = origin.checkers.find(
            (c: any) => c.color === (gameMoved as any).activeColor
          )
          if (!originChecker) {
            if (!QUIET)
              console.log('No checker of active color at chosen origin; breaking')
            break
          }
          const moveResult = Game.move(
            gameToMove as BackgammonGameMoving,
            originChecker.id
          )
          if ((moveResult as any).stateKind === 'moved') {
            // Final checker move ended the turn
            gameMoved = moveResult as BackgammonGameMoved
          } else if ('board' in moveResult) {
            gameMoved = moveResult as BackgammonGameMoving
            moveCount++
            lastBoard = gameMoved.board

            if (!QUIET && !FAST) {
              console.log('\nBoard after move:')
              logger.info('[Simulation] Board after move')
              try {
                const asciiAfter = Board.getAsciiGameBoard(
                  (gameMoved as any).board,
                  (gameMoved as any).players,
                  (gameMoved as any).activeColor,
                  (gameMoved as any).stateKind,
                  undefined,
                  labels
                )
                console.log(asciiAfter)
              } catch {
                Board.displayAsciiBoard((gameMoved as any).board)
              }

              // Show remaining moves
              console.log('\nRemaining moves:')
              if (gameMoved.stateKind === 'moving') {
                Array.from(gameMoved.activePlay.moves).forEach((move: any) => {
                  const pm2 = Board.getPossibleMoves(
                    gameMoved.board,
                    move.player,
                    move.dieValue
                  ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                  const possibleMoves2 = Array.isArray(pm2) ? pm2 : pm2.moves
                  console.log(
                    `  Die value ${move.dieValue}: ${possibleMoves2.length} possible moves`
                  )
                })
              }
            }
          }
        } catch (error) {
          if (!QUIET) console.log(`\nCouldn't make move: ${error}`)
          logger.error('[Simulation] Could not make move:', {
            error: error instanceof Error ? error.message : String(error),
            origin: origin.id,
            destination: destination.id,
          })
          break
        }
      }
    } catch (error) {
      if (!QUIET) console.log(`Error during moves: ${error}\n`)
      logger.error('[Simulation] Error during moves:', {
        error: error instanceof Error ? error.message : String(error),
        turnCount,
        moveCount,
      })
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // If still in moving state here, attempt to complete the turn (handles no-move scenarios)
    if (gameMoved.stateKind === 'moving') {
      const completedState = Game.checkAndCompleteTurn(
        gameMoved as BackgammonGameMoving
      ) as BackgammonGameMoving | BackgammonGameMoved
      gameMoved = completedState
    }

    // When a turn completes, tally dice used and executed vs no-move
    if (gameMoved.stateKind === 'moved') {
      const allMoves = Array.from(gameMoved.activePlay.moves)
      const completed = allMoves.filter((m: any) => m.stateKind === 'completed')
      const executed = completed.filter(
        (m: any) => m.moveKind !== 'no-move' && !!m.origin
      )
      const noMoves = completed.length - executed.length
      diceUsedTotal += completed.length
      executedMovesTotal += executed.length
      noMovesTotal += noMoves
      lastBoard = gameMoved.board
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      if (!QUIET) console.log(`\n${winner.toUpperCase()} WINS!\n`)
      logger.info('[Simulation] Game won:', {
        winner,
        turnCount,
        executedMovesTotal,
        diceUsedTotal,
        noMovesTotal,
      })
      break
    }

    // Switch turns using core flow when in moved state
    if (gameMoved.stateKind === 'moved') {
      if (!QUIET) console.log(`Switching to next player's turn\n`)
      logger.info('[Simulation] Switching turns (confirmTurn)')
      gameState = Game.confirmTurn(gameMoved)
      lastBoard = gameState.board
    } else {
      // If still moving (shouldn't happen if all moves consumed), break to avoid loop
      if (!QUIET) console.log('Turn did not complete; breaking out to avoid hang')
      break
    }
  }

  // Display final statistics
  const stats = getStats(lastBoard)
  stats.totalTurns = turnCount
  stats.totalMoves = diceUsedTotal
  ;(stats as any).executedMoves = executedMovesTotal
  ;(stats as any).noMoves = noMovesTotal
  // Map off counts to the randomized labels
  if (!QUIET) displayStats(stats, gnuIsWhite)

  return {
    winner: checkWinCondition(lastBoard),
    turnCount,
    executedMoves: executedMovesTotal,
    totalMoves: diceUsedTotal,
    noMoves: noMovesTotal,
    gnuColor: gnuIsWhite ? 'white' : 'black',
    gnuHintsAttempted,
    gnuHintsMatched,
    nodotsOpeningChosen,
    nodotsStrategicChosen,
    firstMoverColor,
  }
}

// Allow running from command line with optional max turns argument
if (require.main === module) {
  // Find first numeric positional arg for maxTurns; ignore flag args starting with '--'
  const numArg = process.argv.find((a) => !a.startsWith('--') && /^\d+$/.test(a))
  const maxTurns = numArg ? parseInt(numArg) : 100
  runSimulation(maxTurns).catch((error) => {
    console.error(error)
    logger.error('[Simulation] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
      maxTurns,
    })
  })
}
