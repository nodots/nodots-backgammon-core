import { beforeAll, describe, expect, it } from '@jest/globals'
import type {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
} from '@nodots-llc/backgammon-types'
import { Game } from '../index'

// For robot tests, we need to skip them in core package
// The AI dependency creates a circular dependency issue
const SKIP_ROBOT_TESTS = true

// Test helper functions following existing patterns
const createTestGame = {
  // Creates game in rolling-for-start state
  rollingForStart: () =>
    Game.createNewGame(
      { userId: 'human-user', isRobot: false },
      { userId: 'robot-user', isRobot: true }
    ),

  // Creates game through rolled-for-start state
  rolledForStart: () => {
    const game = createTestGame.rollingForStart()
    return Game.rollForStart(game)
  },

  // Creates game through rolled state (ready for moves)
  rolled: () => {
    const game = createTestGame.rolledForStart() as BackgammonGameRolledForStart
    return Game.roll(game)
  },
}

describe('Game.executeRobotTurn', () => {
  it.skip('should execute all moves for a robot player', async () => {
    if (SKIP_ROBOT_TESTS) return
    // Create a game and get to moving state
    const rolledGame = createTestGame.rolled()

    expect(rolledGame.stateKind).toBe('moving')
    const movingGame = rolledGame as BackgammonGameMoving
    
    // Skip test if human player got the first turn (random dice roll)
    if (!movingGame.activePlayer.isRobot) {
      console.log('Human player got first turn, skipping robot test')
      return
    }

    // Execute the robot turn
    const gameAfterRobotTurn = await Game.executeRobotTurn(movingGame)

    // Verify the robot executed its turn successfully
    // executeRobotTurn should complete the full cycle: moving -> moved -> confirmed -> rolling
    expect(gameAfterRobotTurn.stateKind).toBe('rolling')
    
    // Verify turn switched to the other player
    expect(gameAfterRobotTurn.activePlayer).toBeDefined()
    expect(gameAfterRobotTurn.activePlayer!.isRobot).toBe(false) // Should now be human's turn
  })

  it.skip('should execute multiple moves for a robot player', async () => {
    if (SKIP_ROBOT_TESTS) return
    // Create a game with robot player
    const game = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    // Progress through game states
    const rolledForStartGame = Game.rollForStart(game)
    const rolledGame = Game.roll(rolledForStartGame)

    // Skip if human player got first turn
    if (rolledGame.stateKind !== 'moving') {
      console.log('Game not in moving state, skipping test')
      return
    }
    
    const movingGame = rolledGame as BackgammonGameMoving
    
    if (!movingGame.activePlayer.isRobot) {
      console.log('Human player got first turn, skipping robot test')
      return
    }

    // Verify we have moves available
    const initialMoves = Array.from(movingGame.activePlay.moves)
    expect(initialMoves.length).toBeGreaterThan(0)

    // Execute the robot turn
    const gameAfterRobotTurn = await Game.executeRobotTurn(movingGame)

    // Verify the robot executed its turn successfully  
    // executeRobotTurn should complete the full cycle: moving -> moved -> confirmed -> rolling
    expect(gameAfterRobotTurn.stateKind).toBe('rolling')
    
    // Verify turn switched to the other player
    expect(gameAfterRobotTurn.activePlayer).toBeDefined()
    expect(gameAfterRobotTurn.activePlayer!.isRobot).toBe(false) // Should now be human's turn
  })

  it.skip('should throw error if game is not in moving state', async () => {
    if (SKIP_ROBOT_TESTS) return
    const game = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    // Game is in 'rolling-for-start' state
    await expect(Game.executeRobotTurn(game)).rejects.toThrow(
      'Cannot execute robot turn from rolling-for-start state. Must be in \'moving\' state.'
    )
  })

  it.skip('should throw error if active player is not a robot', async () => {
    if (SKIP_ROBOT_TESTS) return
    const game = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    // Progress to moving state
    const rolledForStartGame = Game.rollForStart(game)
    const rolledGame = Game.roll(rolledForStartGame)

    // Only test if we get a human player as active
    if (rolledGame.stateKind === 'moving') {
      const movingGame = rolledGame as BackgammonGameMoving
      
      if (!movingGame.activePlayer.isRobot) {
        // Should throw error for non-robot player
        await expect(Game.executeRobotTurn(movingGame)).rejects.toThrow(
          'Cannot execute robot turn for non-robot player'
        )
      }
    }
  })

  it.skip('should handle no-move situations correctly', async () => {
    if (SKIP_ROBOT_TESTS) return
    // Create a game with robot player
    const game = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    // Progress to moving state
    const rolledForStartGame = Game.rollForStart(game)
    const rolledGame = Game.roll(rolledForStartGame)

    if (rolledGame.stateKind === 'moving') {
      const movingGame = rolledGame as BackgammonGameMoving
      
      // Only test if robot is active
      if (movingGame.activePlayer.isRobot) {
        // Execute the robot turn - it should handle any no-move situations
        const gameAfterRobotTurn = await Game.executeRobotTurn(rolledGame)
        
        // Game should complete successfully even if some moves couldn't be made
        expect(gameAfterRobotTurn).toBeDefined()
        expect(gameAfterRobotTurn.stateKind).toBe('rolling')
        expect(gameAfterRobotTurn.activePlayer!.isRobot).toBe(false) // Turn should switch to human
      }
    }
  })
})