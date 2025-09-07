import { Game } from '../index'
import { Board } from '../../Board'

describe('Game.roll() for rolled-for-start state', () => {
  test('should correctly transition from rolled-for-start to rolled state', () => {
    // Create a simple game using the real Game factory methods
    const game = Game.createNewGame(
      { userId: 'player1', isRobot: false },
      { userId: 'player2', isRobot: false }
    )
    
    // Roll for start with random dice values
    const gameWithRollForStart = Game.rollForStart(game as any)
    
    // Verify we have a rolled-for-start game
    expect(gameWithRollForStart.stateKind).toBe('rolled-for-start')
    expect(gameWithRollForStart.activePlayer.rollForStartValue).toBeGreaterThan(0)
    expect(gameWithRollForStart.activePlayer.rollForStartValue).toBeLessThanOrEqual(6)
    expect(gameWithRollForStart.inactivePlayer.rollForStartValue).toBeGreaterThan(0)
    expect(gameWithRollForStart.inactivePlayer.rollForStartValue).toBeLessThanOrEqual(6)
    expect(gameWithRollForStart.activePlayer.rollForStartValue).not.toBe(gameWithRollForStart.inactivePlayer.rollForStartValue)
    
    // Now call Game.roll() on the rolled-for-start game
    const rolledGame = Game.roll(gameWithRollForStart)

    // Verify the game transitioned to 'rolled' state
    expect(rolledGame.stateKind).toBe('rolled')
    
    // Verify the active player is in 'rolled' state
    expect(rolledGame.activePlayer.stateKind).toBe('rolled')
    
    // Verify the active player has dice combining both roll-for-start values
    const expectedDiceTotal = gameWithRollForStart.activePlayer.rollForStartValue + gameWithRollForStart.inactivePlayer.rollForStartValue
    expect(rolledGame.activePlayer.dice.currentRoll).toHaveLength(2)
    expect(rolledGame.activePlayer.dice.currentRoll).toContain(gameWithRollForStart.activePlayer.rollForStartValue)
    expect(rolledGame.activePlayer.dice.currentRoll).toContain(gameWithRollForStart.inactivePlayer.rollForStartValue)
    expect(rolledGame.activePlayer.dice.total).toBe(expectedDiceTotal)
    
    // Verify the active player retained their rollForStartValue
    expect(rolledGame.activePlayer.rollForStartValue).toBe(gameWithRollForStart.activePlayer.rollForStartValue)
    
    // Verify the inactive player is in 'inactive' state
    expect(rolledGame.inactivePlayer.stateKind).toBe('inactive')
    
    // Verify the inactive player retained their rollForStartValue
    expect(rolledGame.inactivePlayer.rollForStartValue).toBe(gameWithRollForStart.inactivePlayer.rollForStartValue)
    
    // Verify activePlay was created
    expect(rolledGame.activePlay).toBeDefined()
    expect(rolledGame.activePlay.stateKind).toBe('rolled')
  })
})