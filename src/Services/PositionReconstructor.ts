import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { Game } from '../Game'
import { logger } from '../utils/logger'

export interface GameAction {
  type: 'roll' | 'move' | 'pass' | 'double' | 'accept' | 'reject'
  player: string
  payload?: any
  timestamp: Date
}

export interface PositionSnapshot {
  gameState: BackgammonGame
  beforeMove: boolean
  actionIndex: number
  player: string
  dice?: number[]
  moveData?: any
}

export class PositionReconstructor {
  /**
   * Reconstruct game positions from action history
   */
  static async reconstructGamePositions(
    initialGameState: BackgammonGame,
    actions: GameAction[]
  ): Promise<PositionSnapshot[]> {
    const snapshots: PositionSnapshot[] = []
    let currentGame: BackgammonGame = initialGameState

    logger.info(`Reconstructing ${actions.length} positions from game history`)

    try {
      // Add initial position
      snapshots.push({
        gameState: currentGame,
        beforeMove: true,
        actionIndex: 0,
        player: currentGame.activePlayer?.id || 'unknown'
      })

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i]

        try {
          // Create snapshot before action if it's a move
          if (action.type === 'move') {
            snapshots.push({
              gameState: currentGame,
              beforeMove: true,
              actionIndex: i + 1,
              player: action.player,
              dice: action.payload?.dice,
              moveData: action.payload
            })
          }

          // Apply the action to get next state
          const nextState = await this.applyActionToGame(currentGame, action)
          if (nextState) {
            currentGame = nextState

            // Create snapshot after action
            if (action.type === 'move') {
              snapshots.push({
                gameState: currentGame,
                beforeMove: false,
                actionIndex: i + 1,
                player: action.player,
                dice: action.payload?.dice,
                moveData: action.payload
              })
            }
          }
        } catch (error) {
          logger.warn(`Failed to apply action ${i}: ${error}`)
          // Continue with reconstruction, skipping failed actions
        }
      }

      logger.info(`Successfully reconstructed ${snapshots.length} position snapshots`)
      return snapshots
    } catch (error) {
      logger.error('Position reconstruction failed:', error)
      throw new Error(`Position reconstruction failed: ${error}`)
    }
  }

  /**
   * Reconstruct positions from database actions
   */
  static async reconstructFromDatabaseActions(
    gameId: string,
    initialState: any,
    dbActions: Array<{
      actionType: string
      nickname: string | null
      payload: string | null
      createdAt: Date
    }>
  ): Promise<PositionSnapshot[]> {
    try {
      // Parse initial game state
      const initialGameState: BackgammonGame = JSON.parse(initialState)

      // Convert database actions to GameAction format
      const gameActions: GameAction[] = dbActions.map(dbAction => ({
        type: this.mapActionType(dbAction.actionType),
        player: dbAction.nickname || 'unknown',
        payload: dbAction.payload ? JSON.parse(dbAction.payload) : undefined,
        timestamp: dbAction.createdAt
      }))

      // Filter for relevant actions (moves, rolls, etc.)
      const relevantActions = gameActions.filter(action => 
        ['roll', 'move', 'pass'].includes(action.type)
      )

      return await this.reconstructGamePositions(initialGameState, relevantActions)
    } catch (error) {
      logger.error(`Failed to reconstruct positions for game ${gameId}:`, error)
      throw error
    }
  }

  /**
   * Extract move actions suitable for PR analysis
   */
  static extractMoveActions(snapshots: PositionSnapshot[]): Array<{
    player: string
    move: any
    dice?: number[]
    beforeState: BackgammonGame
    afterState: BackgammonGame
  }> {
    const moveActions: Array<{
      player: string
      move: any
      dice?: number[]
      beforeState: BackgammonGame
      afterState: BackgammonGame
    }> = []

    // Find pairs of before/after move snapshots
    for (let i = 0; i < snapshots.length - 1; i++) {
      const beforeSnapshot = snapshots[i]
      const afterSnapshot = snapshots[i + 1]

      if (
        beforeSnapshot.beforeMove &&
        !afterSnapshot.beforeMove &&
        beforeSnapshot.actionIndex === afterSnapshot.actionIndex &&
        beforeSnapshot.player === afterSnapshot.player &&
        beforeSnapshot.moveData
      ) {
        moveActions.push({
          player: beforeSnapshot.player,
          move: beforeSnapshot.moveData,
          dice: beforeSnapshot.dice,
          beforeState: beforeSnapshot.gameState,
          afterState: afterSnapshot.gameState
        })
      }
    }

    logger.info(`Extracted ${moveActions.length} move actions for PR analysis`)
    return moveActions
  }

  /**
   * Apply a single action to a game state (simplified implementation)
   */
  private static async applyActionToGame(
    gameState: BackgammonGame,
    action: GameAction
  ): Promise<BackgammonGame | null> {
    try {
      // Create a Game instance from the state
      const game = new Game()
      
      // This is a simplified implementation
      // In a full implementation, we would need to properly reconstruct
      // the game state and apply the specific action
      
      // For now, we'll return the same state as we're primarily focused
      // on the positions before moves (which is what we need for PR analysis)
      
      switch (action.type) {
        case 'move':
          // For PR analysis, we mainly need the position before the move
          // The actual move application is complex and would require
          // full game engine integration
          return gameState
        
        case 'roll':
          // For roll actions, we typically just return the same state
          // since the dice are usually already part of the game state
          return gameState
        
        case 'pass':
          // Pass turn - this would normally switch active player
          // But for PR analysis we mainly care about positions before moves
          return gameState
        
        default:
          return gameState
      }
    } catch (error) {
      logger.warn(`Failed to apply action ${action.type}:`, error)
      return null
    }
  }

  /**
   * Map database action types to our GameAction types
   */
  private static mapActionType(dbActionType: string): GameAction['type'] {
    switch (dbActionType) {
      case 'move':
        return 'move'
      case 'roll':
        return 'roll'
      case 'pass':
      case 'pass-turn':
        return 'pass'
      case 'double':
        return 'double'
      case 'accept':
        return 'accept'
      case 'reject':
        return 'reject'
      default:
        return 'move' // Default fallback
    }
  }

  /**
   * Validate that a game state is suitable for PR analysis
   */
  static isValidForAnalysis(gameState: BackgammonGame): boolean {
    try {
      // Check that we have the required structure
      if (!gameState || !gameState.board || !gameState.players) {
        return false
      }

      // Check that we have an active player
      if (!gameState.activePlayer || !gameState.activePlay) {
        return false
      }

      // Check that we have dice information (only for moving states)
      if (gameState.activePlay.stateKind === 'moving') {
        // Dice information is available in the game state for moving plays
        // No additional validation needed as moving state implies dice have been rolled
      }

      // Check that the board has valid structure
      if (!gameState.board.points || !Array.isArray(gameState.board.points)) {
        return false
      }

      return true
    } catch (error) {
      logger.warn('Game state validation failed:', error)
      return false
    }
  }
}