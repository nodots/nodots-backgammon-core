import { Game } from '../../Game'
import { exportToGnuPositionId } from '../gnuPositionId'

describe('exportToGnuPositionId', () => {
  it('exports the default Nodots board to the correct GNU Position ID', () => {
    // Create a game with explicit configuration
    // White is clockwise, black is counterclockwise
    // The expected ID '4HPwATDgc/ABMA' assumes white (clockwise) is on roll
    const game = Game.createNewGame(
      'player1',
      'player2',
      false, // Don't auto roll for start
      true, // player1IsRobot
      true, // player2IsRobot
      {
        blackDirection: 'counterclockwise',
        whiteDirection: 'clockwise',
        blackFirst: false, // This ensures white goes first
      }
    )

    // Manually set up the game state with white as the active player
    const whitePlayer = game.players.find((p) => p.color === 'white')!
    const blackPlayer = game.players.find((p) => p.color === 'black')!

    // Create a game state where white is the active player
    const gameWithWhiteActive = {
      ...game,
      stateKind: 'rolled-for-start' as const,
      activeColor: 'white' as const,
      activePlayer: {
        ...whitePlayer,
        stateKind: 'rolled-for-start' as const,
      },
      inactivePlayer: {
        ...blackPlayer,
        stateKind: 'inactive' as const,
      },
    } as any // Use any to bypass strict typing for test purposes

    // Verify white is the active player
    if (!gameWithWhiteActive.activePlayer) {
      throw new Error('No active player found in game')
    }

    if (gameWithWhiteActive.activePlayer.color !== 'white') {
      throw new Error(
        `Expected white to be active player, but got ${gameWithWhiteActive.activePlayer.color}`
      )
    }

    const posId = exportToGnuPositionId(gameWithWhiteActive)
    // Standard starting position for GNU BG (assuming white/player X on roll)
    expect(posId).toBe('4HPwATDgc/ABMA')
  })
})
