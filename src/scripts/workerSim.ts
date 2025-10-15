import { runSimulation } from './simulate'

async function main() {
  // Optionally suppress AI logs in worker
  if (process.env.NODOTS_SIM_QUIET === '1') {
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
  const count = parseInt(process.argv[2] || '0', 10)
  const seedArg = process.argv.find((a) => a.startsWith('--seed='))
  const baseSeed = seedArg ? parseInt(seedArg.split('=')[1] || '0', 10) : undefined
  let whiteWins = 0
  let blackWins = 0
  let totalTurns = 0
  let totalMoves = 0
  const sideStats = {
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

  const gnuArg = process.argv.find((a) => a.startsWith('--gnu-color='))
  if (gnuArg && !process.argv.includes(gnuArg)) {
    process.argv.push(gnuArg)
  }
  const swapArg = process.argv.includes('--swap-directions')
  if (swapArg) {
    process.env.NODOTS_SWAP_DIRECTIONS = '1'
  }

  for (let i = 0; i < count; i++) {
    if (baseSeed !== undefined) {
      const perSeed = (baseSeed + i) >>> 0
      // set per-game seed via env to avoid accumulating argv flags
      process.env.NODOTS_SEED = String(perSeed)
    }
    const res = (await runSimulation(0)) as any
    const winner = res?.winner || null
    if (winner === 'white') whiteWins++
    if (winner === 'black') blackWins++
    totalTurns += res?.turnCount || 0
    totalMoves += res?.executedMoves || 0
    const gnuColor = res?.gnuColor as 'white' | 'black'
    const fm = res?.firstMoverColor as 'white' | 'black'
    if (gnuColor) {
      sideStats.gnu[gnuColor].hintsAttempted += res?.gnuHintsAttempted || 0
      sideStats.gnu[gnuColor].hintsMatched += res?.gnuHintsMatched || 0
      if (winner === gnuColor) sideStats.gnu[gnuColor].wins++
      const nodotsColor = gnuColor === 'white' ? 'black' : 'white'
      sideStats.nodots[nodotsColor].opening += res?.nodotsOpeningChosen || 0
      sideStats.nodots[nodotsColor].strategic += res?.nodotsStrategicChosen || 0
      if (winner && winner !== gnuColor) sideStats.nodots[nodotsColor].wins++
    }
    if (fm) {
      sideStats.firstMover[fm].count++
      if (winner === fm) sideStats.firstMover[fm].wins++
    }
  }

  if (process.send) {
    process.send({
      type: 'result',
      payload: { whiteWins, blackWins, totalTurns, totalMoves, sideStats },
    })
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed:', err)
  process.exit(1)
})
