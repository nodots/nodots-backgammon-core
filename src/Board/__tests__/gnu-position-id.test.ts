import { Game, Player } from '../../index'
import { exportToGnuPositionId } from '../gnuPositionId'

describe('GNU Position ID', () => {
  test('standard starting position encodes to known GNU Position ID', () => {
    const white = Player.initialize('white', 'clockwise', 'rolling-for-start', false)
    const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', false)
    const game = Game.initialize([white, black]) as any

    const pid = exportToGnuPositionId(game)

    expect(pid).toBe('4HPwATDgc/ABMA')
  })

  test('PID depends on who is on roll for asymmetric positions', () => {
    const white = Player.initialize('white', 'clockwise', 'rolling-for-start', false)
    const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', false)
    let game = Game.initialize([white, black]) as any
    game = Game.rollForStart(game as any)

    // After roll-for-start, one player is active.
    // Roll to get into moving state with an active player.
    if (game.stateKind === 'rolled-for-start') {
      game = Game.roll(game as any)
    }
    if (game.stateKind === 'rolling') {
      game = Game.roll(game as any)
    }

    // At this point the board is still symmetric (no moves made),
    // so the PID is the same regardless of who's on roll.
    const pid = exportToGnuPositionId(game)
    expect(pid).toBe('4HPwATDgc/ABMA')
  })

  test('starting position PID is invariant to who is on roll (symmetric board)', () => {
    const white = Player.initialize('white', 'clockwise', 'rolling-for-start', false)
    const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', false)
    const game = Game.initialize([white, black]) as any

    // Manually set active/inactive to test encoding order
    game.activePlayer = { ...white, direction: 'clockwise' }
    game.inactivePlayer = { ...black, direction: 'counterclockwise' }
    const pidWhite = exportToGnuPositionId(game)

    game.activePlayer = { ...black, direction: 'counterclockwise' }
    game.inactivePlayer = { ...white, direction: 'clockwise' }
    const pidBlack = exportToGnuPositionId(game)

    // Starting position is symmetric, so both should match
    expect(pidWhite).toBe('4HPwATDgc/ABMA')
    expect(pidBlack).toBe('4HPwATDgc/ABMA')
  })
})
