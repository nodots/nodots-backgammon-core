import {
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types'
import { Dice } from '../../Dice'
import { Player } from '../../Player'
import { Game } from '../index'

describe('ROLLED-FOR-START Dice State', () => {
  let players: BackgammonPlayers

  beforeEach(() => {
    const player1 = Player.initialize(
      'white',
      'clockwise',
      undefined,
      'player1',
      'inactive',
      true,
      'user1'
    )
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      'player2',
      'inactive',
      true,
      'user2'
    )
    players = [player1, player2] as BackgammonPlayers
  })

  it('should have dice in rolling state for active player in rolled-for-start state', () => {
    // 1. Create game in rolling-for-start state
    const game = Game.initialize(players) as BackgammonGameRollingForStart
    expect(game.stateKind).toBe('rolling-for-start')

    // 2. Roll for start - this determines who goes first
    const gameAfterRollForStart = Game.rollForStart(
      game
    ) as BackgammonGameRolledForStart
    expect(gameAfterRollForStart.stateKind).toBe('rolled-for-start')
    expect(gameAfterRollForStart.activeColor).toBeDefined()

    // 3. Check the active player's dice state - should be 'rolling' (ready to roll)
    const activePlayer = gameAfterRollForStart.activePlayer
    console.log('Active player dice state:', activePlayer.dice.stateKind)
    console.log('Active player state:', activePlayer.stateKind)

    // CORRECT: The active player has rolling dice and is ready to roll
    expect(activePlayer.dice.stateKind).toBe('rolling') // This is correct!
    expect(activePlayer.stateKind).toBe('rolled-for-start')

    // 4. Try to roll dice - this should work
    try {
      const gameAfterRoll = Game.roll(gameAfterRollForStart)
      expect(gameAfterRoll.stateKind).toBe('rolled')

      // Check that the active player now has rolled dice
      const rolledActivePlayer = gameAfterRoll.activePlayer
      expect(rolledActivePlayer.dice.stateKind).toBe('rolled')
      expect(rolledActivePlayer.dice.currentRoll).toBeDefined()
      expect(rolledActivePlayer.dice.currentRoll).toHaveLength(2)
    } catch (error) {
      console.error('Roll failed:', error)
      fail(`Rolling dice failed from rolled-for-start state: ${error}`)
    }
  })

  it('should allow active player to roll from rolled-for-start state', () => {
    // Create a game and advance to rolled-for-start state
    const game = Game.initialize(players) as BackgammonGameRollingForStart
    const gameRolledForStart = Game.rollForStart(
      game
    ) as BackgammonGameRolledForStart

    // Verify the game can transition from rolled-for-start to rolled
    expect(() => {
      const gameRolled = Game.roll(gameRolledForStart)
      expect(gameRolled.stateKind).toBe('rolled')
      expect(gameRolled.activePlayer.dice.stateKind).toBe('rolled')
    }).not.toThrow()
  })

  it('should set dice to rolling if it was inactive before rolling from rolled-for-start', () => {
    // Create a game in rolled-for-start state with active player dice as 'inactive'
    const player1 = Player.initialize(
      'white',
      'clockwise',
      undefined,
      'player1',
      'inactive',
      true,
      'user1'
    )
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      Dice.initialize('black', 'inactive'), // Force inactive dice
      'player2',
      'rolled-for-start',
      false,
      'user2'
    )
    const players = [player1, player2] as BackgammonPlayers
    const game = Game.initialize(
      players,
      'test-game',
      'rolled-for-start',
      undefined,
      undefined,
      undefined,
      'black',
      player2 as BackgammonPlayerRolledForStart,
      player1 as BackgammonPlayerInactive
    ) as BackgammonGameRolledForStart

    // Sanity check: dice is inactive before roll
    expect(game.activePlayer.dice.stateKind).toBe('inactive')

    // Call Game.roll, which should set dice to 'rolling' before rolling
    const gameAfterRoll = Game.roll(game)
    // After rolling, dice should be 'rolled'
    expect(gameAfterRoll.stateKind).toBe('rolled')
    expect(gameAfterRoll.activePlayer.dice.stateKind).toBe('rolled')
    expect(gameAfterRoll.activePlayer.dice.currentRoll).toBeDefined()
    expect(gameAfterRoll.activePlayer.dice.currentRoll).toHaveLength(2)
  })
})
