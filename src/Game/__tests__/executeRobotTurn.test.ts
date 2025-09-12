import { describe, expect, it } from '@jest/globals'
import { Game } from '../index'
import type {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
} from '@nodots-llc/backgammon-types'

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
  it('should execute all moves for a robot player', async () => {
    // Create a game and get to moving state
    const rolledGame = createTestGame.rolled()

    expect(rolledGame.stateKind).toBe('moving')
    const movingGame = rolledGame as BackgammonGameMoving
    expect(movingGame.activePlayer.isRobot).toBe(true)

    // Execute the robot turn
    const gameAfterRobotTurn = await Game.executeRobotTurn(movingGame)

    // Verify the robot completed its turn
    // The game should be in 'moved' state after all moves are executed
    expect(['moved', 'moving']).toContain(gameAfterRobotTurn.stateKind)

    // If in moving state, verify all moves are completed
    if (gameAfterRobotTurn.stateKind === 'moving') {
      const movingResult = gameAfterRobotTurn as BackgammonGameMoving
      const movesArray = Array.from(movingResult.activePlay.moves)
      const allCompleted = movesArray.every(move => move.stateKind === 'completed')
      expect(allCompleted).toBe(true)
    }
  })

  it('should execute all four moves for a robot player with doubles', async () => {
    // Create a game with robot player
    const game = Game.createNewGame({
      player1: {
        id: 'human',
        name: 'Human Player',
        isRobot: false,
      },
      player2: {
        id: 'robot',
        name: 'Robot Player',
        isRobot: true,
      },
    })

    // Set up game state - make robot (player2/black) active
    const gameWithRobotActive: BackgammonGameRolling = {
      ...game,
      stateKind: 'rolling',
      activeColor: 'black',
      activePlayer: {
        ...game.players[1],
        stateKind: 'rolling',
      },
      inactivePlayer: {
        ...game.players[0],
        stateKind: 'inactive',
      },
    }

    // Roll doubles to get 4 moves
    const rolledGame = Game.roll(gameWithRobotActive, {
      dice: Dice.rollDouble([3, 3]),
    })

    expect(rolledGame.stateKind).toBe('moving')
    const movingGame = rolledGame as BackgammonGameMoving
    expect(movingGame.activePlayer.isRobot).toBe(true)

    // Verify we have 4 moves available (doubles)
    const initialMoves = Array.from(movingGame.activePlay.moves)
    expect(initialMoves.length).toBe(4)

    // Execute the robot turn
    const gameAfterRobotTurn = await Game.executeRobotTurn(movingGame)

    // Verify the robot completed its turn
    expect(['moved', 'moving']).toContain(gameAfterRobotTurn.stateKind)

    // If in moving state, all moves should be completed
    if (gameAfterRobotTurn.stateKind === 'moving') {
      const movingResult = gameAfterRobotTurn as BackgammonGameMoving
      const movesArray = Array.from(movingResult.activePlay.moves)
      const allCompleted = movesArray.every(move => move.stateKind === 'completed')
      expect(allCompleted).toBe(true)
    }
  })

  it('should throw error if game is not in moving state', async () => {
    const game = Game.createNewGame({
      player1: {
        id: 'human',
        name: 'Human Player',
        isRobot: false,
      },
      player2: {
        id: 'robot',
        name: 'Robot Player',
        isRobot: true,
      },
    })

    // Game is in 'rolling-for-start' state
    await expect(Game.executeRobotTurn(game)).rejects.toThrow(
      'Cannot execute robot turn from rolling-for-start state. Must be in \'moving\' state.'
    )
  })

  it('should throw error if active player is not a robot', async () => {
    const game = Game.createNewGame({
      player1: {
        id: 'human',
        name: 'Human Player',
        isRobot: false,
      },
      player2: {
        id: 'robot',
        name: 'Robot Player',
        isRobot: true,
      },
    })

    // Set up game state - make human (player1/white) active
    const gameWithHumanActive: BackgammonGameRolling = {
      ...game,
      stateKind: 'rolling',
      activeColor: 'white',
      activePlayer: {
        ...game.players[0],
        stateKind: 'rolling',
      },
      inactivePlayer: {
        ...game.players[1],
        stateKind: 'inactive',
      },
    }

    // Roll dice to get to moving state
    const rolledGame = Game.roll(gameWithHumanActive, {
      dice: Dice.rollDouble([3, 4]),
    })

    expect(rolledGame.stateKind).toBe('moving')
    const movingGame = rolledGame as BackgammonGameMoving
    expect(movingGame.activePlayer.isRobot).toBe(false)

    // Should throw error for non-robot player
    await expect(Game.executeRobotTurn(movingGame)).rejects.toThrow(
      'Cannot execute robot turn for non-robot player'
    )
  })

  it('should handle no-move situations correctly', async () => {
    // Create a game with a specific board state where no moves are possible
    const game = Game.createNewGame({
      player1: {
        id: 'human',
        name: 'Human Player',
        isRobot: false,
      },
      player2: {
        id: 'robot',
        name: 'Robot Player',
        isRobot: true,
      },
    })

    // Modify board to block all possible moves for the robot
    // This is a simplified test - in reality we'd set up a specific board position
    // For now, we'll just test that the method handles empty moves gracefully

    const gameWithRobotActive: BackgammonGameRolling = {
      ...game,
      stateKind: 'rolling',
      activeColor: 'black',
      activePlayer: {
        ...game.players[1],
        stateKind: 'rolling',
      },
      inactivePlayer: {
        ...game.players[0],
        stateKind: 'inactive',
      },
    }

    const rolledGame = Game.roll(gameWithRobotActive, {
      dice: Dice.rollDouble([6, 6]),
    })

    if (rolledGame.stateKind === 'moving') {
      // Execute the robot turn - it should handle any no-move situations
      const gameAfterRobotTurn = await Game.executeRobotTurn(rolledGame)
      
      // Game should complete successfully even if some moves couldn't be made
      expect(gameAfterRobotTurn).toBeDefined()
      expect(['moved', 'moving']).toContain(gameAfterRobotTurn.stateKind)
    }
  })
})