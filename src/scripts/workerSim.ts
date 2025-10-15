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
  let whiteWins = 0
  let blackWins = 0
  let totalTurns = 0
  let totalMoves = 0

  const gnuArg = process.argv.find((a) => a.startsWith('--gnu-color='))
  if (gnuArg && !process.argv.includes(gnuArg)) {
    process.argv.push(gnuArg)
  }

  for (let i = 0; i < count; i++) {
    const res = (await runSimulation(0)) as any
    const winner = res?.winner || null
    if (winner === 'white') whiteWins++
    if (winner === 'black') blackWins++
    totalTurns += res?.turnCount || 0
    totalMoves += res?.executedMoves || 0
  }

  if (process.send) {
    process.send({
      type: 'result',
      payload: { whiteWins, blackWins, totalTurns, totalMoves },
    })
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed:', err)
  process.exit(1)
})
