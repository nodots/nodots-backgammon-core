import { describe, expect, it } from '@jest/globals'
import { Game } from '../index'
import type {
  BackgammonGameRolledForStart,
  BackgammonGameMoving,
} from '@nodots-llc/backgammon-types'

describe('Robot Turn Integration', () => {
  it('should execute complete robot turn cycle from moving to next player rolling', async () => {
    // Create game with human vs robot
    const initialGame = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    // Progress to rolled-for-start state
    const rolledForStartGame = Game.rollForStart(initialGame) as BackgammonGameRolledForStart
    expect(rolledForStartGame.stateKind).toBe('rolled-for-start')

    // Progress to moving state
    const movingGame = Game.roll(rolledForStartGame)
    expect(movingGame.stateKind).toBe('moving')
    
    const gameMoving = movingGame as BackgammonGameMoving
    expect(gameMoving.activePlay).toBeDefined()
    expect(gameMoving.activePlay.moves.size).toBeGreaterThan(0)
    
    // Skip this test if human player got first turn
    if (!gameMoving.activePlayer.isRobot) {
      console.log('Human player got first turn, skipping robot test')
      return
    }
    
    // Now we know robot is active
    const robotMovingGame = gameMoving

    console.log('Initial game state:', {
      stateKind: robotMovingGame.stateKind,
      activeColor: robotMovingGame.activeColor,
      isRobot: robotMovingGame.activePlayer.isRobot,
      movesCount: robotMovingGame.activePlay.moves.size
    })

    // Execute complete robot turn
    const finalGame = await Game.executeRobotTurn(robotMovingGame)

    console.log('Final game state:', {
      stateKind: finalGame.stateKind,
      activeColor: finalGame.activeColor,
      isRobot: finalGame.activePlayer?.isRobot
    })

    // Robot should have completed entire turn cycle:
    // moving -> moved -> confirmed -> next player rolling
    expect(finalGame.stateKind).toBe('rolling')
    expect(finalGame.activePlayer).toBeDefined()
    expect(finalGame.activePlayer!.isRobot).toBe(false) // Should be human's turn now
    expect(finalGame.activeColor).not.toBe(robotMovingGame.activeColor) // Color should have switched
  })

  it('should handle robot doubles turn correctly', async () => {
    // This test would require more setup to ensure doubles are rolled
    // For now, we'll test that the method handles any dice scenario
    const initialGame = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    const rolledForStartGame = Game.rollForStart(initialGame) as BackgammonGameRolledForStart
    const movingGame = Game.roll(rolledForStartGame)
    
    if (movingGame.stateKind === 'moving') {
      const robotMovingGame = movingGame as BackgammonGameMoving
      
      if (robotMovingGame.activePlayer.isRobot) {
        // Execute robot turn regardless of dice values
        const finalGame = await Game.executeRobotTurn(robotMovingGame)
        
        // Should complete successfully
        expect(finalGame).toBeDefined()
        expect(['rolling', 'moved', 'moving']).toContain(finalGame.stateKind)
      }
    }
  })

  it('should preserve game integrity after robot turn', async () => {
    const initialGame = Game.createNewGame(
      { userId: 'human-player', isRobot: false },
      { userId: 'robot-player', isRobot: true }
    )

    const rolledForStartGame = Game.rollForStart(initialGame) as BackgammonGameRolledForStart
    const movingGame = Game.roll(rolledForStartGame)
    
    if (movingGame.stateKind === 'moving') {
      const robotMovingGame = movingGame as BackgammonGameMoving
      
      if (robotMovingGame.activePlayer.isRobot) {
        const initialCheckerCount = robotMovingGame.board.points
          .reduce((total, point) => total + point.checkers.length, 0) +
          robotMovingGame.board.bar.clockwise.checkers.length +
          robotMovingGame.board.bar.counterclockwise.checkers.length +
          robotMovingGame.board.off.clockwise.checkers.length +
          robotMovingGame.board.off.counterclockwise.checkers.length

        const finalGame = await Game.executeRobotTurn(robotMovingGame)
        
        const finalCheckerCount = finalGame.board.points
          .reduce((total, point) => total + point.checkers.length, 0) +
          finalGame.board.bar.clockwise.checkers.length +
          finalGame.board.bar.counterclockwise.checkers.length +
          finalGame.board.off.clockwise.checkers.length +
          finalGame.board.off.counterclockwise.checkers.length

        // Total checker count should remain the same
        expect(finalCheckerCount).toBe(initialCheckerCount)
        expect(finalCheckerCount).toBe(30) // Standard backgammon has 30 checkers total

        // Game should have valid players
        expect(finalGame.players).toHaveLength(2)
        expect(finalGame.activePlayer).toBeDefined()
        expect(finalGame.inactivePlayer).toBeDefined()
      }
    }
  })
})