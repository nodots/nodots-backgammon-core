import { describe, expect, test } from '@jest/globals'
import { EngineRunner } from '../engine'
import { setConsoleEnabled, setIncludeCallerInfo, setLogLevel } from '../../utils/logger'

describe('Simulation: run until a single win', () => {
  beforeAll(() => {
    // Silence logger for test output
    setConsoleEnabled(false)
    setIncludeCallerInfo(false)
    setLogLevel('error')
  })
  test('completes within 300 turns across 5 seeds', () => {
    const seeds = [1, 2, 3, 4, 5]
    for (const seed of seeds) {
      const engine = new EngineRunner({ seed })
      const { game, turns } = engine.runUntilWin(300)
      expect(turns).toBeGreaterThan(0)
      expect(turns).toBeLessThanOrEqual(300)
      expect(game.stateKind).toBe('completed')
    }
  })
})
