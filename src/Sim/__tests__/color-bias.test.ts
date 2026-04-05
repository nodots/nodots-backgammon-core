import { describe, expect, test } from '@jest/globals'
import { EngineRunner } from '../engine'
import { setConsoleEnabled, setIncludeCallerInfo, setLogLevel } from '../../utils/logger'

describe('Simulation: color-bias detection', () => {
  beforeAll(() => {
    setConsoleEnabled(false)
    setIncludeCallerInfo(false)
    setLogLevel('error')
  })

  test('neither color exceeds 70% win rate over 50 games', () => {
    const totalGames = 50
    let whiteWins = 0
    let blackWins = 0

    for (let seed = 1; seed <= totalGames; seed++) {
      const engine = new EngineRunner({ seed })
      const { game } = engine.runUntilWin(400)

      if (game.stateKind !== 'completed') continue

      const winnerId = (game as any).winner
      const winnerPlayer = game.players.find((p: any) => p.id === winnerId)
      const winnerColor = winnerPlayer?.color ?? (game as any).activePlayer?.color

      if (winnerColor === 'white') whiteWins++
      else if (winnerColor === 'black') blackWins++
    }

    const completed = whiteWins + blackWins
    const whiteRate = completed > 0 ? whiteWins / completed : 0.5
    const blackRate = completed > 0 ? blackWins / completed : 0.5

    // Log results for visibility
    console.log(`Color bias test: ${completed} games completed`)
    console.log(`  White wins: ${whiteWins} (${(whiteRate * 100).toFixed(1)}%)`)
    console.log(`  Black wins: ${blackWins} (${(blackRate * 100).toFixed(1)}%)`)

    expect(completed).toBeGreaterThanOrEqual(40) // at least 80% should complete
    expect(whiteRate).toBeLessThanOrEqual(0.70)
    expect(blackRate).toBeLessThanOrEqual(0.70)
  })
})
