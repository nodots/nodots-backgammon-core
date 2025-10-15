import { simulateGnuVsGnu } from './simulateGnuVsGnu'

function parseArg(name: string, def: number) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (!arg) return def
  const v = parseInt(arg.split('=')[1] || '', 10)
  return Number.isFinite(v) ? v : def
}

async function main() {
  const swap = process.argv.includes('--swap-directions') || process.env.NODOTS_SWAP_DIRECTIONS === '1'
  const games = parseArg('games', 1000)
  let whiteWins = 0
  let blackWins = 0
  let fmWhite = 0
  let fmWhiteWins = 0
  let fmBlack = 0
  let fmBlackWins = 0

  for (let i = 0; i < games; i++) {
    const res = await simulateGnuVsGnu(500, true, { swapDirections: swap })
    if (res.firstMover === 'white') fmWhite++
    else fmBlack++
    if (res.winner === 'white') {
      whiteWins++
      if (res.firstMover === 'white') fmWhiteWins++
    } else if (res.winner === 'black') {
      blackWins++
      if (res.firstMover === 'black') fmBlackWins++
    }
  }

  console.log(`\n=== GNU vs GNU Batch Summary ===`)
  console.log(`Games: ${games}`)
  console.log(`WHITE wins: ${whiteWins} (${((whiteWins / games) * 100).toFixed(1)}%)`)
  console.log(`BLACK wins: ${blackWins} (${((blackWins / games) * 100).toFixed(1)}%)`)
  const rate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0')
  console.log(`First mover white: ${fmWhite} (wins ${fmWhiteWins}, ${rate(fmWhiteWins, fmWhite)}%)`)
  console.log(`First mover black: ${fmBlack} (wins ${fmBlackWins}, ${rate(fmBlackWins, fmBlack)}%)`)
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

export { main as runGnuVsGnuBatch }
