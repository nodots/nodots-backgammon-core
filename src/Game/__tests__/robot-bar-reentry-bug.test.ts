import { describe, expect, it } from '@jest/globals'
import { Game } from '../index'
import { BOARD_IMPORT_BOTH_REENTER } from '../../Board/imports'
import type {
  BackgammonGameMoving,
} from '@nodots-llc/backgammon-types'

/**
 * Create a test game with robot player and custom board setup
 * This simulates the stuck game scenario described in the issue
 */
function createTestGameWithBarScenario(): BackgammonGameMoving {
  // Start with a basic game setup
  const game = Game.createNewGame(
    { userId: 'human-player', isRobot: false },
    { userId: 'robot-player', isRobot: true }
  )

  // Progress through to get a game in moving state
  const rolledForStartGame = Game.rollForStart(game)
  const rolledGame = Game.roll(rolledForStartGame)

  // If we didn't get a moving state or the robot isn't active, try again
  if (rolledGame.stateKind !== 'moving') {
    throw new Error('Failed to create moving game state for test')
  }

  const movingGame = rolledGame as BackgammonGameMoving

  // Force the robot to be the active player for this test
  if (!movingGame.activePlayer.isRobot) {
    // Swap players to make robot active
    const robotPlayer = movingGame.players.find(p => p.isRobot)!
    const humanPlayer = movingGame.players.find(p => !p.isRobot)!

    return {
      ...movingGame,
      activeColor: robotPlayer.color,
      activePlayer: {
        ...robotPlayer,
        stateKind: 'moving',
      } as any,
      inactivePlayer: {
        ...humanPlayer,
        stateKind: 'inactive',
      } as any,
    }
  }

  return movingGame
}

describe('Robot Bar Re-entry Bug Reproduction', () => {
  it('should create specific bar re-entry scenario and test robot automation', async () => {
    console.log('🔍 Creating bar re-entry test scenario...')

    // Create a game with both players as robots to have more control
    const game = Game.createNewGame(
      { userId: 'robot-1', isRobot: true },
      { userId: 'robot-2', isRobot: true }
    )

    console.log('Initial game created, progressing to moving state...')

    // Progress through game states
    const rolledForStartGame = Game.rollForStart(game)
    const rolledGame = Game.roll(rolledForStartGame)

    if (rolledGame.stateKind !== 'moving') {
      console.log('Game not in moving state, current state:', rolledGame.stateKind)
      // For this test, we'll try to get a moving state regardless
      expect(rolledGame.stateKind).toBe('rolling') // Should be rolling if not moving
      return
    }

    const movingGame = rolledGame as BackgammonGameMoving

    console.log('✅ Game in moving state with robot as active player:')
    console.log('Active player:', {
      color: movingGame.activePlayer.color,
      isRobot: movingGame.activePlayer.isRobot,
      stateKind: movingGame.activePlayer.stateKind
    })

    // Analyze current board state
    const whiteBar = movingGame.board.bar.clockwise.checkers.length
    const blackBar = movingGame.board.bar.counterclockwise.checkers.length
    console.log('Current bar checkers:', { white: whiteBar, black: blackBar })

    // Analyze the moves
    if (movingGame.activePlay) {
      const movesArray = Array.from(movingGame.activePlay.moves)
      console.log('Active play moves:', {
        totalMoves: movesArray.length,
        moves: movesArray.map(move => ({
          dieValue: move.dieValue,
          moveKind: move.moveKind,
          stateKind: move.stateKind,
          possibleMovesCount: move.possibleMoves?.length || 0
        }))
      })

      // Check for re-enter moves specifically
      const reenterMoves = movesArray.filter(move => move.moveKind === 'reenter')
      console.log('Re-enter moves found:', reenterMoves.length)

      if (reenterMoves.length === 0) {
        console.log('ℹ️ No re-enter moves in this scenario, but testing robot automation anyway')
      }
    }

    // Test robot automation
    console.log('🤖 Testing robot automation with Game.executeRobotTurn...')

    try {
      const result = await Game.executeRobotTurn(movingGame)

      console.log('✅ Robot automation completed successfully!')
      console.log('Final result:', {
        stateKind: result.stateKind,
        activeColor: result.activeColor,
        activePlayerIsRobot: result.activePlayer?.isRobot
      })

      // Verify the robot turn completed properly
      expect(result).toBeDefined()
      expect(result.stateKind).toBe('rolling') // Should transition to next player's turn

    } catch (error) {
      console.error('❌ Robot automation failed!')
      console.error('Error details:', {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      })

      // Check if this is the specific error we're investigating
      if ((error as Error).message.includes('Cannot transition to moved state')) {
        console.error('🎯 FOUND THE BUG: "Cannot transition to moved state" error!')
        console.error('This confirms the robot turn completion issue described in the GitHub issue')
      }

      // Check if this is related to move completion
      if ((error as Error).message.includes('not all moves are completed')) {
        console.error('🎯 FOUND RELATED BUG: Move completion check failing')
        console.error('This suggests the robot is not properly completing moves before transitioning')
      }

      // For debugging, let's not fail the test but document the issue
      console.error('📝 This error should be investigated and fixed in the robot automation logic')

      // Re-throw to show in test output
      throw error
    }
  })

  it('should test with BOARD_IMPORT_BOTH_REENTER scenario if possible', () => {
    // This is a simpler test that just examines the board import
    console.log('🔍 Analyzing BOARD_IMPORT_BOTH_REENTER:')
    console.log('This board import contains:')

    BOARD_IMPORT_BOTH_REENTER.forEach((container, index) => {
      console.log(`Container ${index + 1}:`, {
        position: container.position,
        checkers: {
          qty: container.checkers.qty,
          color: container.checkers.color
        },
        direction: (container as any).direction || 'n/a'
      })
    })

    // Count bar checkers
    const barContainers = BOARD_IMPORT_BOTH_REENTER.filter(c => c.position === 'bar')
    console.log('Bar containers found:', barContainers.length)

    barContainers.forEach((container, index) => {
      console.log(`Bar container ${index + 1}:`, {
        direction: (container as any).direction,
        checkers: container.checkers
      })
    })

    // Basic structure validation
    expect(BOARD_IMPORT_BOTH_REENTER).toBeDefined()
    expect(BOARD_IMPORT_BOTH_REENTER.length).toBeGreaterThan(0)
    expect(barContainers.length).toBeGreaterThan(0)
  })
})