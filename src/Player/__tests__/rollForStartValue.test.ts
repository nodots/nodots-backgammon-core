import {
  BackgammonDieValue,
  BackgammonGameRollingForStart,
  BackgammonPlayerRollingForStart,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types/dist'
import { Dice } from '../../Dice'
import { Game } from '../../Game'
import { Player } from '../index'

describe('Player rollForStartValue functionality', () => {
  describe('Player.rollForStart', () => {
    it('should set rollForStartValue when rolling for start', () => {
      // Create a player in rolling-for-start state
      const player = Player.initialize(
        'white',
        'clockwise',
        'rolling-for-start',
        false,
        'user-1'
      ) as BackgammonPlayerRollingForStart

      // Mock the dice roll to return a specific value
      jest.spyOn(Dice, 'rollDie').mockReturnValueOnce(4 as BackgammonDieValue)

      // Roll for start
      const rolledPlayer = Player.rollForStart(player)

      // Verify rollForStartValue is set
      expect(rolledPlayer.rollForStartValue).toBe(4)
      expect(rolledPlayer.stateKind).toBe('rolled-for-start')
      expect(rolledPlayer.dice.currentRoll).toEqual([4, undefined])
    })

    it('should preserve rollForStartValue through Player.initialize', () => {
      // Initialize a player with a rollForStartValue
      const player = {
        ...Player.initialize(
          'black',
          'counterclockwise',
          'inactive',
          false,
          'user-2',
          167
        ),
        rollForStartValue: 3 as BackgammonDieValue
      }

      // Verify the rollForStartValue is preserved
      expect(player.rollForStartValue).toBe(3)
    })
  })

  describe('Game.rollForStart integration', () => {
    it('should set rollForStartValue for both players during game rollForStart', () => {
      // Create a game in rolling-for-start state without auto-roll
      const players = [
        Player.initialize(
          'white',
          'clockwise',
          'rolling-for-start',
          false,
          'user-1'
        ),
        Player.initialize(
          'black',
          'counterclockwise',
          'rolling-for-start',
          false,
          'user-2'
        ),
      ] as BackgammonPlayers

      const game = Game.initialize(
        players,
        'test-game',
        'rolling-for-start'
      ) as BackgammonGameRollingForStart

      // Mock dice rolls for both players
      jest
        .spyOn(Dice, 'rollDie')
        .mockReturnValueOnce(5 as BackgammonDieValue) // First player rolls 5
        .mockReturnValueOnce(3 as BackgammonDieValue) // Second player rolls 3

      // Use Game.rollForStart which handles both players and state transitions properly
      const gameAfterRollForStart = Game.rollForStart(game)

      // Find players in the resulting game
      const whitePlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'white'
      )!
      const blackPlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'black'
      )!

      // Verify rollForStartValue is set correctly
      expect(whitePlayer.rollForStartValue).toBe(5)
      expect(blackPlayer.rollForStartValue).toBe(3)

      // Game should be in 'rolled-for-start' state since rollForStart completes the full flow
      expect(gameAfterRollForStart.stateKind).toBe('rolled-for-start')

      // White should be active since they rolled higher (5 > 3)
      expect(gameAfterRollForStart.activeColor).toBe('white')
    })

    it('should preserve rollForStartValue through state transitions', () => {
      // Create a game in rolling-for-start state
      const players = [
        Player.initialize(
          'white',
          'clockwise',
          'rolling-for-start',
          false,
          'user-1'
        ),
        Player.initialize(
          'black',
          'counterclockwise',
          'rolling-for-start',
          false,
          'user-2'
        ),
      ] as BackgammonPlayers

      const game = Game.initialize(
        players,
        'test-game',
        'rolling-for-start'
      ) as BackgammonGameRollingForStart

      // Mock dice rolls
      jest
        .spyOn(Dice, 'rollDie')
        .mockReturnValueOnce(6 as BackgammonDieValue) // First player rolls 6
        .mockReturnValueOnce(2 as BackgammonDieValue) // Second player rolls 2

      // Complete rollForStart using proper CORE method
      const gameAfterRollForStart = Game.rollForStart(game)

      // The game should now be in 'moving' state with rollForStartValue preserved
      const whitePlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'white'
      )!
      const blackPlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'black'
      )!

      expect(whitePlayer.rollForStartValue).toBe(6)
      expect(blackPlayer.rollForStartValue).toBe(2)
      expect(gameAfterRollForStart.activeColor).toBe('white') // White won with 6 > 2
    })

    it('should handle tie scenario by re-rolling until winner determined', () => {
      // Create a game in rolling-for-start state
      const players = [
        Player.initialize(
          'white',
          'clockwise',
          'rolling-for-start',
          false,
          'user-1'
        ),
        Player.initialize(
          'black',
          'counterclockwise',
          'rolling-for-start',
          false,
          'user-2'
        ),
      ] as BackgammonPlayers

      const game = Game.initialize(
        players,
        'test-game',
        'rolling-for-start'
      ) as BackgammonGameRollingForStart

      // Mock dice rolls: first a tie, then a decisive roll
      jest
        .spyOn(Dice, 'rollDie')
        .mockReturnValueOnce(4 as BackgammonDieValue) // First player rolls 4
        .mockReturnValueOnce(4 as BackgammonDieValue) // Second player rolls 4 (tie!)
        .mockReturnValueOnce(5 as BackgammonDieValue) // First player re-rolls 5
        .mockReturnValueOnce(2 as BackgammonDieValue) // Second player re-rolls 2

      // Use Game.rollForStart which handles ties by recursively re-rolling
      const gameAfterRollForStart = Game.rollForStart(game)

      // After tie resolution, game should be in 'moving' state with winner determined
      expect(gameAfterRollForStart.stateKind).toBe('rolled-for-start')
      expect(gameAfterRollForStart.activeColor).toBe('white') // White won with 5 > 2

      // rollForStartValue should reflect the final winning rolls, not the tied rolls
      const whitePlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'white'
      )!
      const blackPlayer = gameAfterRollForStart.players.find(
        (p) => p.color === 'black'
      )!

      expect(whitePlayer.rollForStartValue).toBe(5)
      expect(blackPlayer.rollForStartValue).toBe(2)
    })
  })

  describe('rollForStartValue persistence', () => {
    it('should maintain rollForStartValue through all player state transitions', () => {
      // Test that rollForStartValue persists through various state transitions
      const initialRollValue = 5 as BackgammonDieValue

      // Create player with rollForStartValue
      const inactivePlayer = {
        ...Player.initialize(
          'white',
          'clockwise',
          'inactive',
          false,
          'user-1',
          167
        ),
        rollForStartValue: initialRollValue
      }

      expect(inactivePlayer.rollForStartValue).toBe(initialRollValue)

      // Transition to rolling
      const rollingPlayer = {
        ...Player.initialize(
          'white',
          'clockwise',
          'rolling',
          false,
          'user-1',
          167
        ),
        rollForStartValue: initialRollValue
      }

      expect(rollingPlayer.rollForStartValue).toBe(initialRollValue)

      // Transition to moving
      const movingPlayer = Player.toMoving({
        ...rollingPlayer,
        stateKind: 'moving',
        dice: {
          ...rollingPlayer.dice,
          stateKind: 'rolled',
          currentRoll: [3, 4],
          total: 7,
        },
      })

      expect(movingPlayer.rollForStartValue).toBe(initialRollValue)
    })
  })
})
