import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { Game } from '../Game'
import { Move } from '../Move'
import { AIPluginManager } from '../AI/AIPluginManager'
import { BackgammonAIPlugin } from '../AI/interfaces/AIPlugin'
import { BasicAIPlugin } from '../AI/plugins/BasicAIPlugin'

export interface RobotMoveResult {
  success: boolean
  game?: BackgammonGame
  error?: string
  message?: string
}

export type RobotSkillLevel = 'beginner' | 'intermediate' | 'advanced'

export class Robot {
  private static pluginManager = new AIPluginManager();
  
  // Auto-register built-in basic AI
  static {
    this.pluginManager.registerPlugin(new BasicAIPlugin());
    this.pluginManager.setDefaultPlugin('basic-ai');
  }
  
  /**
   * Execute the next optimal move for a robot player
   * This is the main entry point for robot actions
   * @param game - Current game state
   * @param difficulty - Robot difficulty level (defaults to 'beginner' for backwards compatibility)
   * @param aiPlugin - Optional AI plugin name to use (defaults to default plugin)
   * @returns Result with updated game state or error
   */
  public static makeOptimalMove = async function makeOptimalMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel = 'beginner',
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      // Handle different game states
      switch (game.stateKind) {
        case 'rolling-for-start':
          // For rolling-for-start, check if any player is a robot (activePlayer doesn't exist yet)
          const hasRobotPlayer = game.players.some((player) => player.isRobot)
          if (!hasRobotPlayer) {
            return {
              success: false,
              error: 'No robot players in game',
            }
          }
          return Robot.rollForStart(game)

        case 'rolled-for-start':
        case 'rolling':
          // For these states, validate that the active player is a robot
          const activePlayer = game.activePlayer
          if (!activePlayer?.isRobot) {
            return {
              success: false,
              error: 'Active player is not a robot',
            }
          }
          return Robot.rollDice(game)

        case 'rolled':
        case 'preparing-move':
        case 'moving':
          // For move states, validate that the active player is a robot
          const activePlayerForMove = game.activePlayer
          if (!activePlayerForMove?.isRobot) {
            return {
              success: false,
              error: 'Active player is not a robot',
            }
          }
          return Robot.makeAIMove(game, difficulty, aiPlugin)

        default:
          return {
            success: false,
            error: `Robot cannot act in game state: ${game.stateKind}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Robot rolls for start
   */
  private static rollForStart = async function rollForStart(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    try {
      const updatedGame = Game.rollForStart(game as any)
      return {
        success: true,
        game: updatedGame,
        message: 'Robot rolled for start',
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to roll for start',
      }
    }
  }

  /**
   * Robot rolls dice
   */
  private static rollDice = async function rollDice(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    try {
      const updatedGame = Game.roll(game as any)
      return {
        success: true,
        game: updatedGame,
        message: `Robot rolled: ${
          updatedGame.activePlayer?.dice?.currentRoll?.join(', ') || 'dice'
        }`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to roll dice',
      }
    }
  }

  /**
   * Robot makes a move using optimal strategy
   */
  private static makeMove = async function makeMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    try {
      // Get possible moves for the active player
      const possibleMovesResult = Game.getPossibleMoves(game)

      if (
        !possibleMovesResult.success ||
        !possibleMovesResult.possibleMoves ||
        possibleMovesResult.possibleMoves.length === 0
      ) {
        // This is a legitimate "no legal moves" situation - automatically pass the turn
        console.log(
          '[DEBUG] Robot has no legal moves - automatically passing turn'
        )

        // Check if Game.getPossibleMoves already handled turn completion
        if (possibleMovesResult.updatedGame) {
          return {
            success: true,
            game: possibleMovesResult.updatedGame,
            message: 'Robot passed turn (no legal moves available)',
          }
        }

        // Force turn completion for robots when no legal moves are available
        // This bypasses the Move class restriction that keeps turns active for error handling
        if (game.stateKind === 'moving' && game.activePlay) {
          try {
            const completedGame = Robot.forceCompleteTurn(game as any)
            return {
              success: true,
              game: completedGame,
              message: 'Robot passed turn (no legal moves available)',
            }
          } catch (completionError) {
            console.log('[DEBUG] Turn completion failed:', completionError)
          }
        }

        // Fallback: Return current game state with a pass message
        // The simulation should handle this gracefully and continue
        return {
          success: true,
          game: game,
          message: 'Robot attempted to pass turn (no legal moves available)',
        }
      }

      // Robot strategy: Select move based on difficulty level
      const moveToMake = Robot.selectMoveByDifficulty(
        possibleMovesResult.possibleMoves,
        difficulty,
        game
      )

      // Find a checker at the origin point that can make this move
      const checkerInfo = Robot.findOptimalChecker(game, moveToMake)
      if (!checkerInfo) {
        return {
          success: false,
          error: 'No suitable checker found for the selected move',
        }
      }

      // COMMENT: The Robot is doing redundant work here!
      // 1. Robot already called Game.getPossibleMoves() to get all legal moves
      // 2. Robot already selected the "best" move via selectMoveByDifficulty()
      // 3. Robot already found the optimal checker via findOptimalChecker()
      // 4. Now Robot should just execute the move using the existing moveChecker method
      //
      // The moveChecker method already has robot-specific logic that:
      // - Finds all possible moves for the given checker
      // - Auto-executes the first available move for robots
      // - Handles all the game state transitions properly
      // - Updates dice consumption, active play, etc.
      //
      // So instead of creating a new executeSpecificMove method, we just use the existing one!
      const gameLookup = async () => game

      const moveResult = await Move.moveChecker(
        game.id,
        checkerInfo.checkerId,
        gameLookup
      )

      if (moveResult.success && moveResult.game) {
        const originPos =
          typeof moveToMake.origin.position === 'object'
            ? moveToMake.origin.position.clockwise
            : moveToMake.origin.kind
        const destPos =
          typeof moveToMake.destination.position === 'object'
            ? moveToMake.destination.position.clockwise
            : moveToMake.destination.kind
        return {
          success: true,
          game: moveResult.game,
          message: `Robot moved from ${originPos} to ${destPos}`,
        }
      } else {
        return {
          success: false,
          error: moveResult.error || 'Move execution failed',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to make move',
      }
    }
  }

  /**
   * Select a move based on robot difficulty level with enhanced heuristics
   * @param possibleMoves - Array of possible moves
   * @param difficulty - Robot difficulty level
   * @param game - Current game state for advanced analysis
   * @returns Selected move
   */
  private static selectMoveByDifficulty = function selectMoveByDifficulty(
    possibleMoves: any[],
    difficulty: RobotSkillLevel,
    game: BackgammonGame
  ): any {
    switch (difficulty) {
      case 'beginner':
        // Beginner: Always pick the first available move (consistent behavior)
        return possibleMoves[0]

      case 'intermediate':
        // Intermediate: Use enhanced heuristics for better play
        return Robot.selectIntermediateMove(possibleMoves, game)

      case 'advanced':
        // Advanced: Use sophisticated strategy with multiple factors
        return Robot.selectAdvancedMove(possibleMoves, game)

      default:
        return possibleMoves[0]
    }
  }

  /**
   * Enhanced intermediate strategy with improved heuristics
   */
  private static selectIntermediateMove = function selectIntermediateMove(
    possibleMoves: any[],
    game: BackgammonGame
  ): any {
    const activePlayer = game.activePlayer
    if (!activePlayer) return possibleMoves[0]

    // Score each move with enhanced heuristics
    const scoredMoves = possibleMoves.map((move) => {
      let score = 0

      const originPos =
        typeof move.origin.position === 'object'
          ? move.origin.position.clockwise
          : 25 // Bar is treated as position 25

      const destPos =
        typeof move.destination.position === 'object'
          ? move.destination.position.clockwise
          : 0 // Bear off is treated as position 0

      // 1. Progress toward home (enhanced scoring)
      if (activePlayer.color === 'white') {
        score += (originPos - destPos) * 15 // Increased weight for progress
      } else {
        score += (destPos - originPos) * 15
      }

      // 2. Prioritize bearing off moves
      if (move.destination.kind === 'bear-off') {
        score += 100
      }

      // 3. Safety considerations - strong penalty for leaving blots
      if (move.origin.checkers?.length === 1) {
        score -= 60 // Very strong penalty to ensure safety is prioritized
      }

      // 4. Bonus for making points (landing on point with own checker)
      if (
        move.destination.checkers?.length === 1 &&
        move.destination.checkers[0].color === activePlayer.color
      ) {
        score += 30
      }

      // 5. Escape from opponent's home board
      const isInOpponentHome =
        activePlayer.color === 'white' ? originPos >= 19 : originPos <= 6
      if (isInOpponentHome) {
        score += 20
      }

      // 6. Prefer moves that don't leave checkers far behind
      const isRunnerMove =
        activePlayer.color === 'white' ? originPos >= 22 : originPos <= 3
      if (isRunnerMove) {
        score += 5 // Reduced runner bonus to not override safety
      }

      return { move, score }
    })

    // Return the highest scoring move
    scoredMoves.sort((a, b) => b.score - a.score)
    return scoredMoves[0].move
  }

  /**
   * Advanced strategy: Sophisticated heuristics for expert-level play
   */
  private static selectAdvancedMove = function selectAdvancedMove(
    possibleMoves: any[],
    game: BackgammonGame
  ): any {
    const activePlayer = game.activePlayer
    if (!activePlayer) return possibleMoves[0]

    // Advanced scoring with sophisticated multiple factors
    const scoredMoves = possibleMoves.map((move) => {
      let score = 0

      const originPos =
        typeof move.origin.position === 'object'
          ? move.origin.position.clockwise
          : 25

      const destPos =
        typeof move.destination.position === 'object'
          ? move.destination.position.clockwise
          : 0

      // 1. Enhanced progress scoring with position weighting
      const progressScore =
        activePlayer.color === 'white'
          ? (originPos - destPos) * 12
          : (destPos - originPos) * 12
      score += progressScore

      // 2. Bearing off gets highest priority
      if (move.destination.kind === 'bear-off') {
        score += 150
      }

      // 3. Advanced safety evaluation
      if (move.origin.checkers?.length === 1) {
        // Penalty varies by position - blots in opponent's home are more dangerous
        const isInOpponentHome =
          activePlayer.color === 'white' ? originPos >= 19 : originPos <= 6
        score -= isInOpponentHome ? 50 : 35
      }

      // 4. Hitting opponent's blots (strategic advantage)
      if (
        move.destination.checkers?.length === 1 &&
        move.destination.checkers[0].color !== activePlayer.color
      ) {
        score += 60 // Increased reward for hitting
      }

      // 5. Building and maintaining prime positions
      if (
        move.destination.checkers?.length >= 1 &&
        move.destination.checkers[0].color === activePlayer.color
      ) {
        score += 25 // Strong reward for building points
      }

      // 6. Escape priority from opponent's home board
      const isInOpponentHome =
        activePlayer.color === 'white' ? originPos >= 19 : originPos <= 6
      if (isInOpponentHome) {
        score += 40 // High priority for escaping
      }

      // 7. Advanced: Prefer moving multiple checkers over stacking
      const destinationHasOwnCheckers =
        move.destination.checkers?.some(
          (c: any) => c.color === activePlayer.color
        ) || false
      if (destinationHasOwnCheckers && move.destination.checkers?.length >= 3) {
        score -= 10 // Slight penalty for over-stacking
      }

      // 8. Runner strategy: Advance back checkers when safe
      const isRunner =
        activePlayer.color === 'white' ? originPos >= 22 : originPos <= 3
      if (
        (isRunner && !move.origin.checkers) ||
        move.origin.checkers.length > 1
      ) {
        score += 15 // Bonus for advancing runners safely
      }

      // 9. Defensive: Avoid leaving shots when possible
      const isNearOpponent =
        Math.abs(destPos - (activePlayer.color === 'white' ? 19 : 6)) <= 6
      if (isNearOpponent && move.destination.checkers?.length === 0) {
        score -= 15 // Penalty for landing alone near opponent
      }

      return { move, score }
    })

    // Return the highest scoring move
    scoredMoves.sort((a, b) => b.score - a.score)
    return scoredMoves[0].move
  }

  /**
   * Find the optimal checker for a given move
   * @param game - Current game state
   * @param moveToMake - The move to execute
   * @returns Checker information or null if not found
   */
  private static findOptimalChecker = function findOptimalChecker(
    game: BackgammonGame,
    moveToMake: any
  ): { checkerId: string } | null {
    try {
      const activePlayer = game.activePlayer
      if (!activePlayer) return null

      // Find the origin point/container
      const originPoint = game.board.points.find(
        (point) => point.id === moveToMake.origin.id
      )

      if (originPoint && originPoint.checkers.length > 0) {
        // Find a checker of the correct color from the origin point
        const checkerToMove = originPoint.checkers.find(
          (checker) => checker.color === activePlayer.color
        )

        if (checkerToMove) {
          return { checkerId: checkerToMove.id }
        }
      }

      // Check bar if the origin is bar
      if (moveToMake.origin.kind === 'bar') {
        const barContainer = game.board.bar[activePlayer.direction]
        if (barContainer && barContainer.checkers.length > 0) {
          const checkerToMove = barContainer.checkers.find(
            (checker) => checker.color === activePlayer.color
          )
          if (checkerToMove) {
            return { checkerId: checkerToMove.id }
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error finding optimal checker:', error)
      return null
    }
  }

  /**
   * Force complete the current turn when robot has no legal moves
   * This bypasses the Move class restriction that keeps turns active for error handling
   */
  private static forceCompleteTurn = function forceCompleteTurn(
    game: any // BackgammonGameMoving but using any for easier access
  ): any {
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return game
    }

    console.log(
      '[DEBUG] Robot forcing turn completion - marking remaining moves as no-move'
    )

    // Force completion by marking remaining ready moves as no-move
    // CRITICAL: Do not modify board state - just mark moves as completed with no-move
    // Convert Set to Array first since moves are stored as a Set
    const movesArray = Array.from(game.activePlay.moves)
    const updatedMoves = movesArray.map((move: any) => {
      if (move.stateKind === 'ready') {
        return {
          ...move,
          stateKind: 'completed' as const,
          moveKind: 'no-move' as const,
          // IMPORTANT: Keep origin and destination null for no-move
          // Do NOT set any board positions that would modify the board
          origin: null,
          destination: null,
          possibleMoves: [],
        }
      }
      return move
    })

    // Switch to next player's turn without modifying the board
    const nextColor = game.activeColor === 'white' ? 'black' : 'white'

    // Update players: current becomes inactive, next becomes rolling
    const updatedPlayers = game.players.map((player: any) => {
      if (player.color === game.activeColor) {
        return { ...player, stateKind: 'inactive' as const }
      } else {
        return { ...player, stateKind: 'rolling' as const }
      }
    })

    // Find the new active and inactive players
    const newActivePlayer = updatedPlayers.find(
      (p: any) => p.color === nextColor
    )
    const newInactivePlayer = updatedPlayers.find(
      (p: any) => p.color === game.activeColor
    )

    console.log(
      '[DEBUG] Robot forcing turn completion - marking remaining moves as no-move WITHOUT changing board'
    )
    console.log(
      '[DEBUG] Robot turn completed - switching from',
      game.activeColor,
      'to',
      nextColor
    )

    // Create completed active play
    const completedActivePlay = {
      ...game.activePlay,
      moves: new Set(updatedMoves),
      stateKind: 'completed' as const,
    }

    // Generate ASCII board for the new game state (board unchanged)
    const { Board } = require('../Board')
    const asciiBoard = Board.getAsciiGameBoard(
      game.board, // CRITICAL: Use the SAME board, no modifications
      updatedPlayers,
      nextColor,
      'rolling'
    )

    // Return new game state with next player rolling, but board unchanged
    const resultGame = {
      ...game,
      stateKind: 'rolling' as const,
      activeColor: nextColor,
      players: updatedPlayers,
      activePlayer: newActivePlayer,
      inactivePlayer: newInactivePlayer,
      activePlay: completedActivePlay,
      asciiBoard,
      // CRITICAL: Keep the same board - no checker modifications
      board: game.board,
    }

    return {
      success: true,
      move: 'no-move-turn-completed',
      updatedGame: resultGame,
    }
  }
  
  /**
   * Make AI-powered move using plugin system
   */
  private static makeAIMove = async function makeAIMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      const plugin = Robot.pluginManager.getPlugin(aiPlugin);
      const selectedMove = await plugin.generateMove(game, difficulty);
      
      // Execute the move using existing core logic
      return Robot.executeMove(game, selectedMove);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI move failed',
      };
    }
  };
  
  /**
   * Execute a move using the existing move execution logic
   */
  private static executeMove = async function executeMove(
    game: BackgammonGame,
    selectedMove: any
  ): Promise<RobotMoveResult> {
    try {
      // Find a checker at the origin point that can make this move
      const checkerInfo = Robot.findOptimalChecker(game, selectedMove);
      if (!checkerInfo) {
        return {
          success: false,
          error: 'No suitable checker found for the selected move',
        };
      }

      // Execute the move using the existing move execution logic
      const gameLookup = async () => game;
      const moveResult = await Move.moveChecker(
        game.id,
        checkerInfo.checkerId,
        gameLookup
      );

      if (!moveResult.success) {
        return {
          success: false,
          error: moveResult.error || 'Move execution failed',
        };
      }

      return {
        success: true,
        game: moveResult.game,
        message: 'Robot made AI-powered move',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Move execution failed',
      };
    }
  };
  
  /**
   * Register new AI plugin
   */
  static registerAIPlugin(plugin: BackgammonAIPlugin): void {
    this.pluginManager.registerPlugin(plugin);
  }
  
  /**
   * Set default AI plugin
   */
  static setDefaultAI(pluginName: string): void {
    this.pluginManager.setDefaultPlugin(pluginName);
  }
  
  /**
   * List available AI plugins
   */
  static listAIPlugins(): BackgammonAIPlugin[] {
    return this.pluginManager.listAvailablePlugins();
  }
  
  /**
   * Get default AI plugin name
   */
  static getDefaultAI(): string | null {
    return this.pluginManager.getDefaultPlugin();
  }
}
