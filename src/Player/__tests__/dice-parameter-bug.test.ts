import { Dice } from '../../Dice'
import { Player } from '../index'

describe('Player.initialize dice parameter handling', () => {
  it('should respect dice parameter for inactive players', () => {
    // Create dice with 'rolling' state
    const rollingDice = Dice.initialize('black', 'rolling')
    expect(rollingDice.stateKind).toBe('rolling')

    // Create inactive player with rolling dice - this was the bug scenario
    const player = Player.initialize(
      'black',
      'counterclockwise',
      rollingDice,
      'test-player',
      'inactive', // Player is inactive
      false,
      'user-id'
    )

    // The player should preserve the passed dice state
    expect(player.stateKind).toBe('inactive')
    expect(player.dice.stateKind).toBe('rolling') // This was failing before the fix
    expect(player.dice.id).toBe(rollingDice.id) // Should be the same dice object
  })

  it('should respect dice parameter for rolling-for-start players', () => {
    // Create dice with 'rolling' state
    const rollingDice = Dice.initialize('white', 'rolling')
    expect(rollingDice.stateKind).toBe('rolling')

    // Create rolling-for-start player with specific dice
    const player = Player.initialize(
      'white',
      'clockwise',
      rollingDice,
      'test-player',
      'rolling-for-start',
      true,
      'user-id'
    )

    // The player should preserve the passed dice state
    expect(player.stateKind).toBe('rolling-for-start')
    expect(player.dice.stateKind).toBe('rolling')
    expect(player.dice.id).toBe(rollingDice.id)
  })

  it('should respect dice parameter for rolled-for-start players (already working)', () => {
    // Create dice with 'rolling' state
    const rollingDice = Dice.initialize('black', 'rolling')

    // Create rolled-for-start player with rolling dice
    const player = Player.initialize(
      'black',
      'counterclockwise',
      rollingDice,
      'test-player',
      'rolled-for-start',
      false,
      'user-id'
    )

    // This case was already working correctly
    expect(player.stateKind).toBe('rolled-for-start')
    expect(player.dice.stateKind).toBe('rolling')
    expect(player.dice.id).toBe(rollingDice.id)
  })

  it('should use default dice when none provided', () => {
    // Test that the fix doesn't break the default behavior
    const player = Player.initialize(
      'white',
      'clockwise',
      undefined, // No dice provided
      'test-player',
      'inactive',
      true,
      'user-id'
    )

    expect(player.stateKind).toBe('inactive')
    expect(player.dice.stateKind).toBe('inactive') // Should default to inactive
    expect(player.dice.color).toBe('white')
  })

  it('should handle the specific bug report scenario', () => {
    // Simulate the exact scenario from the bug report:
    // Black player, counterclockwise, rolled-for-start state, should have rolling dice

    const player = Player.initialize(
      'black',
      'counterclockwise',
      Dice.initialize('black', 'rolling'), // Explicitly create rolling dice
      'test-player',
      'rolled-for-start',
      false, // Human player
      'user-id'
    )

    expect(player.color).toBe('black')
    expect(player.direction).toBe('counterclockwise')
    expect(player.stateKind).toBe('rolled-for-start')
    expect(player.dice.stateKind).toBe('rolling') // This should NOT be 'inactive'
    expect(player.isRobot).toBe(false)
  })
})
