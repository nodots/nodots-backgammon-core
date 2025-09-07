import { Dice } from '../../Dice'
import { Player } from '../index'

describe('Player.initialize dice parameter handling', () => {
  it('should create appropriate dice for inactive players', () => {
    // Create inactive player - dice should be created automatically
    const player = Player.initialize(
      'black',
      'counterclockwise',
      'inactive', // Player is inactive
      false,
      'user-id'
    )

    // The player should have appropriate dice state for inactive players
    expect(player.stateKind).toBe('inactive')
    expect(player.dice.stateKind).toBe('inactive') // Inactive players get inactive dice
    expect(player.dice.color).toBe('black')
  })

  it('should create appropriate dice for rolling-for-start players', () => {
    // Create rolling-for-start player - dice should be created automatically
    const player = Player.initialize(
      'white',
      'clockwise',
      'rolling-for-start',
      true,
      'user-id'
    )

    // The player should have appropriate dice state for rolling-for-start
    expect(player.stateKind).toBe('rolling-for-start')
    expect(player.dice.stateKind).toBe('rolling-for-start')
    expect(player.dice.color).toBe('white')
  })

  it('should create appropriate dice for rolling players', () => {
    // Create rolling player - dice should be created automatically
    const player = Player.initialize(
      'black',
      'counterclockwise',
      'rolling',
      false,
      'user-id'
    )

    // The player should have appropriate dice state for rolling
    expect(player.stateKind).toBe('rolling')
    expect(player.dice.stateKind).toBe('inactive') // Rolling players get inactive dice initially
    expect(player.dice.color).toBe('black')
  })

  it('should use default dice behavior', () => {
    // Test that the default behavior works correctly
    const player = Player.initialize(
      'white',
      'clockwise',
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
    // Black player, counterclockwise, moving state, should have appropriate dice

    const player = Player.initialize(
      'black',
      'counterclockwise',
      'moving',
      false, // Human player
      'user-id'
    )

    expect(player.color).toBe('black')
    expect(player.direction).toBe('counterclockwise')
    expect(player.stateKind).toBe('moving')
    expect(player.dice.stateKind).toBe('inactive') // Moving players have inactive dice
    expect(player.isRobot).toBe(false)
  })
})
