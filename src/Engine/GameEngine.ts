import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonMove,
  BackgammonMoveSkeleton,
  BackgammonPlayerActive,
} from '@nodots-llc/backgammon-types/dist'
import { Board } from '../Board'
import { Move } from '../Move'
import { Play } from '../Play'
import { Player } from '../Player'
import { Dice } from '../Dice'

/**
 * Pure functional game engine for Nodots Backgammon
 * 
 * This class provides side-effect-free functions for game state manipulation
 * and validation. All methods are pure functions that return new state objects
 * without mutating input parameters.
 * 
 * Key principles:
 * - All functions are pure (no side effects)
 * - Input parameters are never mutated
 * - Same input always produces same output
 * - Deterministic behavior for given inputs
 * - Immutable state transitions
 */
export class GameEngine {
  /**
   * Validate if a move is legal in the current game state
   * @param state - Current game state (immutable)
   * @param checkerId - ID of checker to move
   * @returns true if move is valid, false otherwise
   */
  static validateMove(state: BackgammonGame, checkerId: string): boolean {
    if (!state || !checkerId) {
      throw new Error('Invalid input: state and checkerId are required')
    }
    
    // Check if state allows moves
    switch (state.stateKind) {
      case 'moving':
        break
      case 'rolling-for-start':
      case 'rolled-for-start':
      case 'rolling':
      case 'doubled':
      case 'moved':
      case 'completed':
        return false
    }

    if (!state.activePlay?.moves) {
      return false
    }

    // Get possible moves for current state
    const possibleMoves = GameEngine.getPossibleMoves(state)
    if (!possibleMoves.success || !possibleMoves.moves) {
      return false
    }

    // Check if any possible move starts from the checker's position
    const checker = GameEngine.findChecker(state, checkerId)
    if (!checker) {
      return false
    }

    const checkerContainer = Board.getCheckerContainer(state.board, checker.checkercontainerId)
    if (!checkerContainer) {
      return false
    }

    // Validate that at least one possible move exists from this origin
    return possibleMoves.moves.some(move => 
      move.origin?.id === checkerContainer.id
    )
  }

  /**
   * Execute a move and return new game state
   * @param state - Current game state (immutable)
   * @param checkerId - ID of checker to move
   * @returns New game state with move executed
   */
  static executeMove(state: BackgammonGame, checkerId: string): BackgammonGame {
    // Validate move first
    if (!GameEngine.validateMove(state, checkerId)) {
      throw new Error('Invalid move attempted')
    }

    switch (state.stateKind) {
      case 'moving':
        break
      case 'rolling-for-start':
      case 'rolled-for-start':
      case 'rolling':
      case 'doubled':
      case 'moved':
      case 'completed':
        throw new Error('Game must be in moving state to execute move')
    }

    // Find the checker and its container
    const checker = GameEngine.findChecker(state, checkerId)
    if (!checker) {
      throw new Error('Checker not found')
    }

    const checkerContainer = Board.getCheckerContainer(state.board, checker.checkercontainerId)
    if (!checkerContainer) {
      throw new Error('Checker container not found')
    }

    // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state))

    // Execute the move using existing game logic but on cloned state
    const moveResult = GameEngine.executePhysicalMove(newState, checkerContainer.id)
    
    return moveResult
  }

  /**
   * Undo the last move and return new game state
   * @param state - Current game state with moves to undo
   * @returns New game state with last move undone
   */
  static undoLastMove(state: BackgammonGame): BackgammonGame {
    if (state.stateKind !== 'moving' && state.stateKind !== 'moved') {
      throw new Error('Cannot undo move from current state')
    }

    // Deep clone the state
    const newState = JSON.parse(JSON.stringify(state))

    // Use existing undo logic but return new state
    const undoResult = GameEngine.performUndo(newState)
    
    if (!undoResult.success || !undoResult.game) {
      throw new Error(undoResult.error || 'Undo failed')
    }

    return undoResult.game
  }

  /**
   * Get all possible moves for the current game state
   * @param state - Current game state
   * @returns Object with success flag and possible moves
   */
  static getPossibleMoves(state: BackgammonGame): {
    success: boolean
    moves?: BackgammonMoveSkeleton[]
    error?: string
    currentDie?: number
  } {
    switch (state.stateKind) {
      case 'moving':
        break
      case 'rolling-for-start':
      case 'rolled-for-start':
      case 'rolling':
      case 'doubled':
      case 'moved':
      case 'completed':
        return {
          success: false,
          error: 'Game is not in a state where possible moves can be calculated',
        }
    }

    const activePlayer = state.players.find(p => p.color === state.activeColor)
    if (!activePlayer) {
      return {
        success: false,
        error: 'Active player not found',
      }
    }

    // Get available dice from activePlay
    if (!state.activePlay?.moves) {
      return {
        success: false,
        error: 'No active play found',
      }
    }

    const movesArr = Array.from(state.activePlay.moves)
    const readyMoves = movesArr.filter(move => move.stateKind === 'ready')
    
    if (readyMoves.length === 0) {
      return {
        success: true,
        moves: [],
      }
    }

    // Get next available die value
    const currentDie = readyMoves[0]?.dieValue
    if (!currentDie) {
      return {
        success: true,
        moves: [],
      }
    }

    // Calculate fresh possible moves for current board state
    const possibleMoves = Board.getPossibleMoves(
      state.board,
      activePlayer,
      currentDie as BackgammonDieValue
    )

    return {
      success: true,
      moves: possibleMoves,
      currentDie,
    }
  }

  /**
   * Calculate game state hash for anti-cheat validation
   * @param state - Game state to hash
   * @returns Deterministic hash string
   */
  static calculateGameHash(state: BackgammonGame): string {
    // Create a stable representation of game state for hashing
    const stableState = {
      stateKind: state.stateKind,
      activeColor: state.activeColor,
      board: GameEngine.serializeBoard(state.board),
      players: state.players.map(p => ({
        id: p.id,
        color: p.color,
        direction: p.direction,
        stateKind: p.stateKind,
        pipCount: p.pipCount,
        dice: p.dice ? {
          currentRoll: p.dice.currentRoll,
          stateKind: p.dice.stateKind,
        } : null,
      })),
      cube: {
        value: state.cube.value,
        stateKind: state.cube.stateKind,
        owner: state.cube.owner?.id || null,
      },
    }

    // Simple hash - in production would use crypto library
    return JSON.stringify(stableState)
  }

  /**
   * Check if the game has ended (win condition)
   * @param state - Current game state
   * @returns Object with win status and winner if applicable
   */
  static checkWinCondition(state: BackgammonGame): {
    hasWinner: boolean
    winner?: BackgammonPlayerActive
    winType?: 'normal' | 'gammon' | 'backgammon'
  } {
    for (const player of state.players) {
      const direction = player.direction
      const playerOff = state.board.off[direction]
      const playerCheckersOff = playerOff.checkers.filter(
        c => c.color === player.color
      ).length

      if (playerCheckersOff === 15) {
        // Determine win type
        const opponent = state.players.find(p => p.color !== player.color)
        if (!opponent) {
          return { hasWinner: true, winner: player as BackgammonPlayerActive, winType: 'normal' }
        }

        const opponentDirection = opponent.direction
        const opponentOff = state.board.off[opponentDirection]
        const opponentCheckersOff = opponentOff.checkers.filter(
          c => c.color === opponent.color
        ).length

        let winType: 'normal' | 'gammon' | 'backgammon' = 'normal'
        
        if (opponentCheckersOff === 0) {
          // Check if opponent has checkers in player's home board (backgammon)
          const playerHomeBoard = GameEngine.getHomeBoard(state.board, player.direction)
          const opponentInHomeBoard = playerHomeBoard.some(point =>
            point.checkers.some((c: BackgammonChecker) => c.color === opponent.color)
          )
          
          if (opponentInHomeBoard || state.board.bar[opponentDirection].checkers.some((c: BackgammonChecker) => c.color === opponent.color)) {
            winType = 'backgammon'
          } else {
            winType = 'gammon'
          }
        }

        return {
          hasWinner: true,
          winner: player as BackgammonPlayerActive,
          winType,
        }
      }
    }

    return { hasWinner: false }
  }

  /**
   * Transition game state to next player's turn
   * @param state - Current game state
   * @returns New game state with next player active
   */
  static transitionToNextPlayer(state: BackgammonGame): BackgammonGame {
    const nextColor = state.activeColor === 'white' ? 'black' : 'white'
    
    // Deep clone state
    const newState = JSON.parse(JSON.stringify(state))
    
    // Update players
    const updatedPlayers = newState.players.map((player: any) => {
      if (player.color === state.activeColor) {
        return {
          ...player,
          stateKind: 'inactive',
          dice: Dice.initialize(player.color, 'inactive'),
        }
      } else {
        return {
          ...player,
          stateKind: 'rolling',
          dice: Dice.initialize(player.color, 'rolling'),
        }
      }
    })

    const newActivePlayer = updatedPlayers.find((p: any) => p.color === nextColor)
    const newInactivePlayer = updatedPlayers.find((p: any) => p.color === state.activeColor)

    return {
      ...newState,
      stateKind: 'rolling',
      activeColor: nextColor,
      players: updatedPlayers,
      activePlayer: newActivePlayer,
      inactivePlayer: newInactivePlayer,
      activePlay: undefined, // Clear active play for next player
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Find a checker by ID in the game board
   * @param state - Game state
   * @param checkerId - Checker ID to find
   * @returns Checker object or null if not found
   */
  private static findChecker(state: BackgammonGame, checkerId: string): BackgammonChecker | null {
    try {
      const allCheckers = Board.getCheckers(state.board)
      return allCheckers.find(checker => checker.id === checkerId) || null
    } catch {
      return null
    }
  }

  /**
   * Execute physical move on game state (mutating version for internal use)
   * @param state - Mutable game state
   * @param originId - Origin container ID
   * @returns Updated game state
   */
  private static executePhysicalMove(state: BackgammonGame, originId: string): BackgammonGame {
    // This would use the existing Game.move logic but on a cloned state
    // For now, delegate to existing implementation
    const { Game } = require('../Game')
    return Game.move(state as BackgammonGameMoving, originId)
  }

  /**
   * Perform undo operation on game state (mutating version for internal use)
   * @param state - Mutable game state
   * @returns Undo result with updated game state
   */
  private static performUndo(state: BackgammonGame): {
    success: boolean
    error?: string
    game?: BackgammonGame
  } {
    // This would use the existing Game.undoLastMove logic but on a cloned state
    const { Game } = require('../Game')
    return Game.undoLastMove(state)
  }

  /**
   * Serialize board state for consistent hashing
   * @param board - Board state
   * @returns Serializable board representation
   */
  private static serializeBoard(board: BackgammonBoard): any {
    return {
      points: board.points.map(point => ({
        position: point.position,
        checkers: point.checkers.map(c => ({
          id: c.id,
          color: c.color,
        })),
      })),
      bar: {
        clockwise: board.bar.clockwise.checkers.map(c => ({
          id: c.id,
          color: c.color,
        })),
        counterclockwise: board.bar.counterclockwise.checkers.map(c => ({
          id: c.id,
          color: c.color,
        })),
      },
      off: {
        clockwise: board.off.clockwise.checkers.map(c => ({
          id: c.id,
          color: c.color,
        })),
        counterclockwise: board.off.counterclockwise.checkers.map(c => ({
          id: c.id,
          color: c.color,
        })),
      },
    }
  }

  /**
   * Get home board points for a player direction
   * @param board - Board state
   * @param direction - Player direction
   * @returns Array of home board points
   */
  private static getHomeBoard(board: BackgammonBoard, direction: 'clockwise' | 'counterclockwise'): any[] {
    return board.points.filter(point => {
      const position = point.position[direction]
      return position >= 1 && position <= 6
    })
  }
}