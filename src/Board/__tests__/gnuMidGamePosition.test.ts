import { GnuBgHints } from '@nodots-llc/gnubg-hints'

// Mid-game position provided by user (GNU Backgammon)
// Position ID: NnsOADAWr5EBMA
// Match ID   : UYkWAAAAAAAA (not used here)
// Rolled: 55

describe('GNU mid-game position (Position ID: NnsOADAWr5EBMA)', () => {
  test.skip('GNU hints are available for roll 55 and include moves (skipped: environment/hints availability may vary)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'NnsOADAWr5EBMA'
    const roll: [number, number] = [5, 5]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
    // Optional sanity: with doubles, GNU typically suggests four steps
    // (but do not assert exact count to avoid brittleness across configurations)
  })
})
