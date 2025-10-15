import { runDebugSingleGame } from '../../scripts/debugSingleGame'

describe('Simulation integration: 10 games to completion', () => {
  it('runs 10 games until a winner without getting stuck', async () => {
    jest.setTimeout(120000)

    let whiteWins = 0
    let blackWins = 0

    for (let i = 0; i < 10; i++) {
      const result = await runDebugSingleGame()

      expect(result).toBeDefined()
      expect(result.stuck).toBe(false)
      expect(result.winner === 'white' || result.winner === 'black').toBe(true)

      if (result.winner === 'white') whiteWins++
      if (result.winner === 'black') blackWins++
    }

    // Provide a simple sanity assertion: total wins should equal 10
    expect(whiteWins + blackWins).toBe(10)
  })
})

