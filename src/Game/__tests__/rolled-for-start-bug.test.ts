import {
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types'
import { Player } from '../../Player'
import { Game } from '../index'

describe('ROLLED-FOR-START Dice State', () => {
  let players: BackgammonPlayers

  beforeEach(() => {
    const player1 = Player.initialize(
      'white',
      'clockwise',
      'inactive',
      true,
      'user1'
    )
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      true,
      'user2'
    )
    players = [player1, player2] as BackgammonPlayers
  })

  it('should have dice in rolling state for active player in rolled-for-start state', () => {
    // 1. Create game in rolling-for-start state
    const game = Game.createNewGame(
      { userId: 'user1', isRobot: false },
      { userId: 'user2', isRobot: false }
    ) as BackgammonGameRollingForStart
    expect(game.stateKind).toBe('rolling-for-start')

    // 2. Roll for start - this determines who goes first
    const gameAfterRollForStart = Game.rollForStart(
      game
    ) as BackgammonGameRolledForStart
    expect(gameAfterRollForStart.stateKind).toBe('rolled-for-start')
    expect(gameAfterRollForStart.activeColor).toBeDefined()

    // 3. Check the active player's dice state - should be 'rolled-for-start' (has roll for start value)
    const activePlayer = gameAfterRollForStart.activePlayer
    console.log('Active player dice state:', activePlayer.dice.stateKind)
    console.log('Active player state:', activePlayer.stateKind)

    // After rollForStart, the active player has rolled-for-start dice (showing their start roll)
    expect(activePlayer.dice.stateKind).toBe('rolled-for-start')
    expect(activePlayer.stateKind).toBe('rolled-for-start')
    // The dice should have a currentRoll with the start roll value
    expect(activePlayer.dice.currentRoll).toBeDefined()
    expect(activePlayer.dice.currentRoll![0]).toBeGreaterThanOrEqual(1)
    expect(activePlayer.dice.currentRoll![0]).toBeLessThanOrEqual(6)
    expect(activePlayer.dice.currentRoll![1]).toBeUndefined() // Second die is undefined for start rolls

    // 4. Try to roll dice - this should work
    try {
      const gameAfterRoll = Game.roll(gameAfterRollForStart)
      expect(gameAfterRoll.stateKind).toBe('moving')

      // Check that the active player now has rolled dice
      const rolledActivePlayer = gameAfterRoll.activePlayer
      expect(rolledActivePlayer.stateKind).toBe('moving')
      expect(rolledActivePlayer.dice.stateKind).toBe('rolled')
      expect(rolledActivePlayer.dice.currentRoll).toBeDefined()
      expect(rolledActivePlayer.dice.currentRoll).toHaveLength(2)
    } catch (error) {
      console.error('Roll failed:', error)
      throw new Error(`Rolling dice failed from rolled-for-start state: ${error}`)
    }
  })

  it('should allow active player to roll from rolled-for-start state', () => {
    // Create a game and advance to rolled-for-start state
    const game = Game.createNewGame(
      { userId: 'user1', isRobot: false },
      { userId: 'user2', isRobot: false }
    ) as BackgammonGameRollingForStart
    const gameRolledForStart = Game.rollForStart(
      game
    ) as BackgammonGameRolledForStart

    // Verify the game can transition from rolled-for-start to rolled
    expect(() => {
      const gameRolled = Game.roll(gameRolledForStart)
      expect(gameRolled.stateKind).toBe('moving')
      expect(gameRolled.activePlayer.dice.stateKind).toBe('rolled')
    }).not.toThrow()
  })

  // Test removed: All games use autoRollForStart, so dice are never inactive in rolled-for-start state
})
