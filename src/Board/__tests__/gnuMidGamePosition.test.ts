import { GnuBgHints } from '@nodots-llc/gnubg-hints'

// Mid-game position provided by user (GNU Backgammon)
// Position ID: NnsOADAWr5EBMA
// Match ID   : UYkWAAAAAAAA (not used here)
// Rolled: 55

describe('GNU mid-game positions', () => {
  test('NnsOADAWr5EBMA with 55 has hints', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'NnsOADAWr5EBMA'
    const roll: [number, number] = [5, 5]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('DQAA8AsAAAAAAA with 33 has hints', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'DQAA8AsAAAAAAA'
    const roll: [number, number] = [3, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('AwAA+AcAAAAAAA with 33 has hints', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'AwAA+AcAAAAAAA'
    const roll: [number, number] = [3, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('BgAAGAAAAAAAAA with 66 has hints (bear-off doubles)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'BgAAGAAAAAAAAA'
    const roll: [number, number] = [6, 6]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('AQAA/AAAAAAAAA with 33 has hints (bear-off doubles)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'AQAA/AAAAAAAAA'
    const roll: [number, number] = [3, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('AQAAPAAAAAAAAA with 35 has hints (late-game)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'AQAAPAAAAAAAAA'
    const roll: [number, number] = [3, 5]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('AQAA/H8AAAAAAA with 63 has hints (late-game)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'AQAA/H8AAAAAAA'
    const roll: [number, number] = [6, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('r8dSAQDfDYIHAA with 23 has hints (midgame)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'r8dSAQDfDYIHAA'
    const roll: [number, number] = [2, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('m7MzAQB/gcEHAA with 44 has hints (doubles midgame)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'm7MzAQB/gcEHAA'
    const roll: [number, number] = [4, 4]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })

  test('EwAA8AcAAAAAAA with 33 has hints (late-game doubles)', async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })

    const positionId = 'EwAA8AcAAAAAAA'
    const roll: [number, number] = [3, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)

    expect(hints && hints.length > 0).toBeTruthy()
    const best = hints![0]
    expect(best.moves && best.moves.length > 0).toBeTruthy()
  })
})
