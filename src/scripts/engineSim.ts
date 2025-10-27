import { EngineRunner } from '../Sim/engine'

async function main() {
  const engine = new EngineRunner({ fast: true })
  const maxTurnsEnv = process.env.NODOTS_MAX_TURNS && /^\d+$/.test(process.env.NODOTS_MAX_TURNS) ? parseInt(process.env.NODOTS_MAX_TURNS, 10) : undefined
  const arg = process.argv.find((a) => /^\d+$/.test(a))
  const maxTurns = arg ? parseInt(arg, 10) : (maxTurnsEnv || 5000)
  const { game, turns } = engine.runUntilWin(maxTurns)
  if ((game as any).stateKind !== 'completed') {
    console.log('EngineSim: Game did not complete within turn limit')
    process.exit(1)
  }
  console.log('EngineSim: completed in', turns, 'turns')
}

main().catch((e) => {
  console.error('EngineSim error:', e)
  process.exit(1)
})
