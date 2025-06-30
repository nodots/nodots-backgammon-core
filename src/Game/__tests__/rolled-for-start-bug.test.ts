import {
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types'
import { Player } from '../../Player'
import { Game } from '../index'

describe('ROLLED-FOR-START Dice State Bug', () => {
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

  it('should reproduce the dice state bug in rolled-for-start state', () => {
    // 1. Create game in rolling-for-start state
    const game = Game.initialize(players) as BackgammonGameRollingForStart
    expect(game.stateKind).toBe('rolling-for-start')

    // 2. Roll for start - this determines who goes first
    const gameAfterRollForStart = Game.rollForStart(
      game
    ) as BackgammonGameRolledForStart
    expect(gameAfterRollForStart.stateKind).toBe('rolled-for-start')
    expect(gameAfterRollForStart.activeColor).toBeDefined()

    // 3. Check the active player's dice state - THIS IS THE BUG
    const activePlayer = gameAfterRollForStart.activePlayer
    console.log('Active player dice state:', activePlayer.dice.stateKind)
    console.log('Active player state:', activePlayer.stateKind)

    // BUG: The active player has inactive dice but should be able to roll
    expect(activePlayer.dice.stateKind).toBe('inactive') // This is the bug!
    expect(activePlayer.stateKind).toBe('rolled-for-start')

    // 4. Try to roll dice - this should work but might fail due to inactive dice
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
      // This catch block will capture the bug if it exists
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
})
