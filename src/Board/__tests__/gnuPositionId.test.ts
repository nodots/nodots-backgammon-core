import { Board } from '../index'
import { Game } from '../../Game'
import { Player } from '../../Player'
import { exportToGnuPositionId } from '../gnuPositionId'
import { BackgammonPlayers } from '@nodots-llc/backgammon-types'

describe('exportToGnuPositionId', () => {
  it('exports the default Nodots board to the correct GNU Position ID', () => {
    // White is clockwise, black is counterclockwise
    // By default, Nodots Game.initialize() sets white as the first player (activePlayer)
    // GNU Backgammon's standard ID 4HPwATDgc/ABMA assumes player X (white/clockwise) is on roll.
    const players: BackgammonPlayers = [
      Player.initialize('white', 'clockwise'),
      Player.initialize('black', 'counterclockwise'),
    ]
    // Initialize game, this should set white as active player by default if not specified
    let game = Game.initialize(players)

    // Ensure white is the player on roll for the standard ID
    // The Game.initialize might not set activePlayer immediately to one of the players
    // in a way that getPlayerAndOpponent expects for 'rolled' or 'moving'.
    // It starts in 'rolling-for-start'. Let's advance it to a state where white is to roll.
    if (game.stateKind === 'rolling-for-start') {
      game = Game.rollForStart(game) // This sets an activePlayer (who won the roll)
      // If black won the roll, we need to simulate a turn or manually set white to roll
      // For simplicity in this test, let's assume/ensure white is set to roll.
      // A more robust setup might be needed if Game.rollForStart is random.
      // For now, we assume Game.initialize + Game.rollForStart is enough if white is default first player
      // Or that the exportToGnuPositionId can handle 'rolled-for-start' correctly if activePlayer is white.

      // To be certain white is the activePlayer for the test against '4HPwATDgc/ABMA':
      if (game.activePlayer.color !== 'white') {
        // This case means black won the roll. The ID '4HPwATDgc/ABMA' is for White on roll.
        // For this specific test to pass with that ID, white MUST be on roll.
        // We might need a way to set the turn explicitly or create a game state
        // directly for testing purposes where white is definitely the active player.
        // For now, logging a warning and proceeding. The test might fail if black is on roll.
        console.warn(
          "Warning: Black player is on roll. The expected ID '4HPwATDgc/ABMA' is for White on roll."
        )
        // A common setup for such tests is to have a utility to create a specific game state.
        // Let's try to force game.activePlayer to be white for this test case.
        const whitePlayer = game.players.find((p) => p.color === 'white')
        const blackPlayer = game.players.find((p) => p.color === 'black')
        if (whitePlayer && blackPlayer) {
          game = {
            ...game,
            stateKind: 'rolled', // A state where activePlayer is well-defined
            activePlayer: whitePlayer as any, // Cast needed if type is too strict
            inactivePlayer: blackPlayer as any,
            activeColor: 'white',
            // dice might need to be populated for 'rolled' state
            // play might need to be populated
          } as any // Cast game to any to override parts for test setup
        } else {
          throw new Error(
            'Could not find white/black players to set turn for test'
          )
        }
      } else if (game.stateKind === 'rolled-for-start') {
        // If white is already activePlayer but state is still 'rolled-for-start',
        // transition to 'rolled' to match getPlayerAndOpponent's expectations more cleanly.
        const whitePlayer = game.activePlayer
        const blackPlayer = game.players.find((p) => p.id !== whitePlayer.id)!
        game = {
          ...game,
          stateKind: 'rolled',
          activePlayer: whitePlayer as any,
          inactivePlayer: blackPlayer as any,
          activeColor: 'white',
        } as any
      }
    }

    const posId = exportToGnuPositionId(game)
    // Standard starting position for GNU BG (assuming white/player X on roll)
    expect(posId).toBe('4HPwATDgc/ABMA')
  })
})
