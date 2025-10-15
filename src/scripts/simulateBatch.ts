import { runSimulation } from './simulate'
import { cpus } from 'os'
import { fork } from 'child_process'

interface BatchOptions {
  games: number
  workers: number
  gnuColor?: 'white' | 'black'
  fast: boolean
  quiet: boolean
  seed?: number
  mappingSample?: number
  swapDirections?: boolean
}

function parseArgs(): BatchOptions {
  const args = process.argv.slice(2)
  let games = 100
  let workers = Math.max(1, Math.min(cpus().length, 4))
  let gnuColor: 'white' | 'black' | undefined
  let fast = true
  let quiet = true
  let seed: number | undefined
  let mappingSample: number | undefined
  let swapDirections = false
  for (const a of args) {
    if (a.startsWith('--games=')) games = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--workers=')) workers = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--gnu-color=')) gnuColor = a.split('=')[1] as any
    else if (a === '--no-fast') fast = false
    else if (a === '--no-quiet') quiet = false
    else if (a.startsWith('--seed=')) seed = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--mapping-sample=')) mappingSample = parseInt(a.split('=')[1], 10)
    else if (a === '--swap-directions') swapDirections = true
  }
  return { games, workers, gnuColor, fast, quiet, seed, mappingSample, swapDirections }
}

type SideStats = {
  gnu: {
    white: { hintsAttempted: number; hintsMatched: number; wins: number }
    black: { hintsAttempted: number; hintsMatched: number; wins: number }
  }
  nodots: {
    white: { opening: number; strategic: number; wins: number }
    black: { opening: number; strategic: number; wins: number }
  }
  firstMover: {
    white: { count: number; wins: number }
    black: { count: number; wins: number }
  }
}

async function runSingleProcess(opts: BatchOptions) {
  // Suppress AI logs if quiet
  if (opts.quiet) {
    const origLog = console.log.bind(console)
    const origInfo = console.info.bind(console)
    const origWarn = console.warn.bind(console)
    const filter = (fn: (...args: any[]) => void) =>
      (...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].startsWith('[AI]')) return
        return fn(...args)
      }
    ;(console as any).log = filter(origLog)
    ;(console as any).info = filter(origInfo)
    ;(console as any).warn = filter(origWarn)
  }
  if (opts.fast) process.env.NODOTS_SIM_FAST = '1'
  if (opts.quiet) process.env.NODOTS_SIM_QUIET = '1'
  process.env.NODOTS_LOG_SILENT = opts.quiet ? '1' : process.env.NODOTS_LOG_SILENT
  if (opts.gnuColor) {
    // Ensure simulate.ts can read this flag
    process.argv.push(`--gnu-color=${opts.gnuColor}`)
  }
  if (opts.swapDirections) {
    process.argv.push('--swap-directions')
    process.env.NODOTS_SWAP_DIRECTIONS = '1'
  }

  let whiteWins = 0
  let blackWins = 0
  let totalTurns = 0
  let totalMoves = 0
  // side-based instrumentation
  const sideStats: SideStats = {
    gnu: {
      white: { hintsAttempted: 0, hintsMatched: 0, wins: 0 },
      black: { hintsAttempted: 0, hintsMatched: 0, wins: 0 },
    },
    nodots: {
      white: { opening: 0, strategic: 0, wins: 0 },
      black: { opening: 0, strategic: 0, wins: 0 },
    },
    firstMover: {
      white: { count: 0, wins: 0 },
      black: { count: 0, wins: 0 },
    },
  }

  for (let i = 0; i < opts.games; i++) {
    if (opts.seed !== undefined) {
      // advance seed per game to vary sequences deterministically
      const perGameSeed = (opts.seed + i) >>> 0
      // set per-game seed via env to avoid accumulating argv flags
      process.env.NODOTS_SEED = String(perGameSeed)
    }
    if (opts.mappingSample && i === 0) {
      process.argv.push(`--mapping-sample=${opts.mappingSample}`)
    }
    const res = (await runSimulation(0)) as any
    const winnerColor: 'white' | 'black' | null = res?.winner || null
    const gnuColor: 'white' | 'black' | undefined = res?.gnuColor || opts.gnuColor
    // Track first mover stats
    const fm = res?.firstMoverColor as 'white' | 'black'
    if (fm) {
      sideStats.firstMover[fm].count++
      if (winnerColor === fm) sideStats.firstMover[fm].wins++
    }
    if (opts.quiet) {
      // Minimal per-game line for training stats
      const winnerLabel = winnerColor
        ? (winnerColor === gnuColor ? 'GNU' : 'NODOTS')
        : 'none'
      const gnuLabel = gnuColor ?? 'unknown'
      console.log(`Game ${i + 1}: gnu=${gnuLabel}, winner=${winnerLabel}, turns=${res?.turnCount ?? 0}, moves=${res?.executedMoves ?? 0}, noMoves=${res?.noMoves ?? 0}`)
    }
    if (winnerColor === 'white') whiteWins++
    if (winnerColor === 'black') blackWins++
    // Side-based wins
    if (winnerColor && gnuColor) {
      if (winnerColor === gnuColor) {
        sideStats.gnu[gnuColor].wins++
      } else {
        const nodotsColor = gnuColor === 'white' ? 'black' : 'white'
        sideStats.nodots[nodotsColor].wins++
      }
    }
    // Instrumentation counters
    if (gnuColor) {
      sideStats.gnu[gnuColor].hintsAttempted += res?.gnuHintsAttempted || 0
      sideStats.gnu[gnuColor].hintsMatched += res?.gnuHintsMatched || 0
      const nodotsColor = gnuColor === 'white' ? 'black' : 'white'
      sideStats.nodots[nodotsColor].opening += res?.nodotsOpeningChosen || 0
      sideStats.nodots[nodotsColor].strategic += res?.nodotsStrategicChosen || 0
    }
    totalTurns += res?.turnCount || 0
    totalMoves += res?.executedMoves || 0
  }

  return { whiteWins, blackWins, totalTurns, totalMoves, sideStats }
}

async function runMultiProcess(opts: BatchOptions) {
  const perWorker = Math.floor(opts.games / opts.workers)
  const remainder = opts.games % opts.workers
  const promises: Promise<{ whiteWins: number; blackWins: number; totalTurns: number; totalMoves: number; sideStats: SideStats }>[] = []

  for (let w = 0; w < opts.workers; w++) {
    const count = perWorker + (w < remainder ? 1 : 0)
    if (count === 0) continue
    promises.push(
      new Promise((resolve, reject) => {
        const env = { ...process.env }
        if (opts.fast) env.NODOTS_SIM_FAST = '1'
        if (opts.quiet) env.NODOTS_SIM_QUIET = '1'
        env.NODOTS_LOG_SILENT = opts.quiet ? '1' : env.NODOTS_LOG_SILENT
        const args: string[] = [String(count)]
        if (opts.gnuColor) args.push(`--gnu-color=${opts.gnuColor}`)
        if (opts.swapDirections) args.push('--swap-directions')
        if (opts.seed !== undefined) {
          const baseSeed = (opts.seed + w * 100000) >>> 0
          args.push(`--seed=${baseSeed}`)
        }
        if (opts.mappingSample) args.push(`--mapping-sample=${opts.mappingSample}`)
        const child = fork(
          require.resolve('./workerSim'),
          args,
          { env }
        )
        child.on('message', (msg: any) => {
          if (msg && msg.type === 'result') {
            resolve(msg.payload)
          }
        })
        child.on('error', reject)
        child.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
        })
      })
    )
  }

  const results = await Promise.all(promises)
  const merged = results.reduce(
    (acc, r) => {
      acc.whiteWins += r.whiteWins
      acc.blackWins += r.blackWins
      acc.totalTurns += r.totalTurns
      acc.totalMoves += r.totalMoves
      // merge side stats
      ;(['white','black'] as const).forEach((c) => {
        acc.sideStats.gnu[c].hintsAttempted += r.sideStats.gnu[c].hintsAttempted
        acc.sideStats.gnu[c].hintsMatched += r.sideStats.gnu[c].hintsMatched
        acc.sideStats.gnu[c].wins += r.sideStats.gnu[c].wins
        acc.sideStats.nodots[c].opening += r.sideStats.nodots[c].opening
        acc.sideStats.nodots[c].strategic += r.sideStats.nodots[c].strategic
        acc.sideStats.nodots[c].wins += r.sideStats.nodots[c].wins
        acc.sideStats.firstMover[c].count += r.sideStats.firstMover[c].count
        acc.sideStats.firstMover[c].wins += r.sideStats.firstMover[c].wins
      })
      return acc
    },
    {
      whiteWins: 0,
      blackWins: 0,
      totalTurns: 0,
      totalMoves: 0,
      sideStats: {
        gnu: { white: { hintsAttempted: 0, hintsMatched: 0, wins: 0 }, black: { hintsAttempted: 0, hintsMatched: 0, wins: 0 } },
        nodots: { white: { opening: 0, strategic: 0, wins: 0 }, black: { opening: 0, strategic: 0, wins: 0 } },
        firstMover: { white: { count: 0, wins: 0 }, black: { count: 0, wins: 0 } },
      } as SideStats,
    }
  )
  return merged
}

async function main() {
  const opts = parseArgs()
  const start = Date.now()
  const runner = opts.workers > 1 ? runMultiProcess : runSingleProcess
  const { whiteWins, blackWins, totalTurns, totalMoves, sideStats } = await runner(opts)
  const games = opts.games
  const duration = (Date.now() - start) / 1000
  // Map color-based wins to side labels
  const gnuWins = opts.gnuColor === 'black' ? blackWins : whiteWins
  const nodotsWins = games - gnuWins
  console.log(`\n=== Batch Summary ===`)
  console.log(`Games: ${games}, Workers: ${opts.workers}`)
  if (opts.gnuColor) {
    console.log(
      `GNU (${opts.gnuColor}) wins: ${gnuWins} (${((gnuWins / games) * 100).toFixed(1)}%)`
    )
    console.log(
      `NODOTS (${opts.gnuColor === 'white' ? 'black' : 'white'}) wins: ${nodotsWins} (${(
        (nodotsWins / games) * 100
      ).toFixed(1)}%)`
    )
    // Instrumentation summaries
    const gnuWhite = sideStats.gnu.white
    const gnuBlack = sideStats.gnu.black
    const nodotsWhite = sideStats.nodots.white
    const nodotsBlack = sideStats.nodots.black
    const fmWhite = sideStats.firstMover.white
    const fmBlack = sideStats.firstMover.black
    const rate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0')
    console.log(`GNU hints (white): matched ${gnuWhite.hintsMatched}/${gnuWhite.hintsAttempted} (${rate(gnuWhite.hintsMatched, gnuWhite.hintsAttempted)}%)`)
    console.log(`GNU hints (black): matched ${gnuBlack.hintsMatched}/${gnuBlack.hintsAttempted} (${rate(gnuBlack.hintsMatched, gnuBlack.hintsAttempted)}%)`)
    console.log(`NODOTS opening chosen (white): ${nodotsWhite.opening}, strategic: ${nodotsWhite.strategic}`)
    console.log(`NODOTS opening chosen (black): ${nodotsBlack.opening}, strategic: ${nodotsBlack.strategic}`)
    console.log(`First mover white: ${fmWhite.count} (wins ${fmWhite.wins}, ${rate(fmWhite.wins, fmWhite.count)}%)`)
    console.log(`First mover black: ${fmBlack.count} (wins ${fmBlack.wins}, ${rate(fmBlack.wins, fmBlack.count)}%)`)
  } else {
    console.log(`WHITE wins: ${whiteWins} (${((whiteWins / games) * 100).toFixed(1)}%)`)
    console.log(`BLACK wins: ${blackWins} (${((blackWins / games) * 100).toFixed(1)}%)`)
  }
  console.log(`Avg turns: ${(totalTurns / games).toFixed(2)}`)
  console.log(`Avg executed moves: ${(totalMoves / games).toFixed(2)}`)
  console.log(`Duration: ${duration.toFixed(2)}s | ${(
    games / duration
  ).toFixed(1)} games/sec`)
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Batch simulation failed:', err)
    process.exit(1)
  })
}

export { main as runBatch }
