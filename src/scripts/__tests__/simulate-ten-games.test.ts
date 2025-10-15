import { runDebugSingleGame } from '../../scripts/debugSingleGame'

describe('Simulation integration: N games to completion (fast mode by default)', () => {
  it('runs a small number of games until a winner without getting stuck', async () => {
    // Keep fast in CI/unit runs; allow override via env
    const GAMES = parseInt(process.env.NODOTS_SIM_GAMES || '3', 10)
    jest.setTimeout(Math.max(60000, GAMES * 15000))

    // Silence console to speed up tests
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      let whiteWins = 0
      let blackWins = 0

      for (let i = 0; i < GAMES; i++) {
        const result = await runDebugSingleGame()
        expect(result).toBeDefined()
        expect(result.stuck).toBe(false)
        expect(result.winner === 'white' || result.winner === 'black').toBe(true)
        if (result.winner === 'white') whiteWins++
        if (result.winner === 'black') blackWins++
      }

      expect(whiteWins + blackWins).toBe(GAMES)
    } finally {
      logSpy.mockRestore()
      infoSpy.mockRestore()
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})
