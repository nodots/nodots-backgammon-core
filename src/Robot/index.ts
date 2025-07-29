import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { AIPluginManager } from '../AI/AIPluginManager'
import { BackgammonAIPlugin } from '../AI/interfaces/AIPlugin'
import { BasicAIPlugin } from '../AI/plugins/BasicAIPlugin'
import { Board } from '../Board'
import { Game } from '../Game'
import { logger } from '../utils/logger'

export interface RobotMoveResult {
  success: boolean
  game?: BackgammonGame
  error?: string
  message?: string
}

export type RobotSkillLevel = 'beginner' | 'intermediate' | 'advanced'

export class Robot {
  private static pluginManager = new AIPluginManager()

  // Auto-register built-in basic AI
  static {
    this.pluginManager.registerPlugin(new BasicAIPlugin())
    this.pluginManager.setDefaultPlugin('basic-ai')
  }

  /**
   * Execute complete turn automation for a robot player
   * This is the main entry point for robot actions and handles full turns
   * @param game - Current game state
   * @param difficulty - Robot difficulty level (defaults to 'beginner' for backwards compatibility)
   * @param aiPlugin - Optional AI plugin name to use (defaults to default plugin)
   * @returns Result with updated game state after complete robot turn or error
   */
  public static makeOptimalMove = async function makeOptimalMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel = 'beginner',
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      // Validate game state
      if (!game) {
        return {
          success: false,
          error: 'Game is null or undefined',
        }
      }

      if (!game.board) {
        return {
          success: false,
          error: 'Game board is undefined',
        }
      }

      if (!game.players || game.players.length < 2) {
        return {
          success: false,
          error: 'Game players are invalid',
        }
      }

      // Handle different game states with complete turn automation
      switch (game.stateKind) {
        case 'rolling-for-start':
          return Robot.handleRollForStart(game, difficulty)

        case 'rolled-for-start':
          return Robot.handleRolledForStart(game, difficulty)

        case 'rolling':
          return Robot.handleRolling(game, difficulty)

        case 'rolled':
        case 'preparing-move':
        case 'moving':
          return Robot.handleCompleteMovingTurn(game, difficulty, aiPlugin)

        default:
          return {
            success: false,
            error: `Robot cannot act in game state: ${game.stateKind}`,
          }
      }
    } catch (error) {
      logger.error('Error in Robot.makeOptimalMove:', error)
      logger.error('Game state:', JSON.stringify(game, null, 2))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Handle rolling-for-start state with a single action
   */
  private static handleSingleRollForStart =
    async function handleSingleRollForStart(
      game: BackgammonGame
    ): Promise<RobotMoveResult> {
      try {
        const hasRobotPlayer = game.players.some((player) => player.isRobot)
        if (!hasRobotPlayer) {
          return {
            success: false,
            error: 'No robot players in game',
          }
        }
        const rolledForStartGame = Game.rollForStart(game as any)
        return {
          success: true,
          game: rolledForStartGame,
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
   * Handle rolled-for-start state with complete turn automation
   * After rolling, continue with complete turn execution for robots
   */
  private static handleSingleRolledForStart =
    async function handleSingleRolledForStart(
      game: BackgammonGame
    ): Promise<RobotMoveResult> {
      try {
        if (!game.activePlayer?.isRobot) {
          return {
            success: false,
            error: 'Active player is not a robot',
          }
        }

        // Roll dice first
        const rolledGame = Game.roll(game as any)

        logger.info(
          `Robot rolled dice after winning roll-for-start: ${rolledGame.activePlayer.dice.currentRoll}`
        )

        // Now complete the full turn (moving and passing to next player)
        return Robot.handleCompleteMovingTurn(rolledGame, 'beginner')
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to handle rolled-for-start',
        }
      }
    }

  /**
   * Handle rolling state with a single action
   */
  private static handleSingleRolling = async function handleSingleRolling(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    try {
      if (!game.activePlayer?.isRobot) {
        return {
          success: false,
          error: 'Active player is not a robot',
        }
      }
      const rolledGame = Game.roll(game as any)
      return {
        success: true,
        game: rolledGame,
        message: `Robot rolled: ${rolledGame.activePlay?.dice.currentRoll}`,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to handle rolling',
      }
    }
  }

  /**
   * Handle a single moving turn action without loops
   */
  private static handleSingleMovingTurn = async function handleSingleMovingTurn(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      if (!game.activePlayer?.isRobot) {
        return {
          success: false,
          error: 'Active player is not a robot',
        }
      }

      let currentGame = game

      if (
        currentGame.stateKind === 'rolled' ||
        currentGame.stateKind === 'preparing-move'
      ) {
        const preparingGame =
          currentGame.stateKind === 'rolled'
            ? Game.prepareMove(currentGame as any)
            : currentGame
        currentGame = Game.toMoving(preparingGame as any)
      }

      const possibleMovesResult = Game.getPossibleMoves(currentGame)

      if (!possibleMovesResult.success) {
        return {
          success: false,
          error: possibleMovesResult.error || 'Failed to get possible moves',
        }
      }

      if (possibleMovesResult.updatedGame) {
        return {
          success: true,
          game: possibleMovesResult.updatedGame,
          message: 'Robot turn auto-completed.',
        }
      }

      if (
        !possibleMovesResult.possibleMoves ||
        possibleMovesResult.possibleMoves.length === 0
      ) {
        if (Game.canConfirmTurn(currentGame)) {
          const nextTurnGame = Game.confirmTurn(currentGame as any)
          return {
            success: true,
            game: nextTurnGame,
            message: 'Robot completed turn (no legal moves available)',
          }
        }
        try {
          const completedGame = Robot.forceCompleteTurn(currentGame as any)
          return {
            success: true,
            game: completedGame,
            message: 'Robot forcefully completed turn (no legal moves)',
          }
        } catch (error) {
          return {
            success: false,
            error: 'Failed to complete turn with no moves available',
          }
        }
      }

      // Continue making moves until all game.activePlay.moves are completed
      let gameAfterMoves = currentGame
      let moveCount = 0
      const maxMoves = 4 // Safety limit (doubles = 4 moves max)

      while (!Game.canConfirmTurn(gameAfterMoves) && moveCount < maxMoves) {
        const currentPossibleMoves = Game.getPossibleMoves(gameAfterMoves)

        if (
          !currentPossibleMoves.success ||
          !currentPossibleMoves.possibleMoves ||
          currentPossibleMoves.possibleMoves.length === 0
        ) {
          break // No more legal moves available
        }

        const moveResult = await Robot.executeSingleMove(
          gameAfterMoves,
          currentPossibleMoves.possibleMoves,
          difficulty,
          aiPlugin
        )

        if (!moveResult.success) {
          break // Move failed, stop trying
        }

        gameAfterMoves = moveResult.game! as any
        moveCount++

        logger.info(
          `Robot completed move ${moveCount}, canConfirmTurn: ${Game.canConfirmTurn(
            gameAfterMoves
          )}`
        )
      }

      // Confirm turn if all moves completed
      if (Game.canConfirmTurn(gameAfterMoves)) {
        gameAfterMoves = Game.confirmTurn(gameAfterMoves as any) as any
        return {
          success: true,
          game: gameAfterMoves,
          message: `Robot completed ${moveCount} moves and confirmed turn.`,
        }
      }

      return {
        success: true,
        game: gameAfterMoves,
        message: `Robot executed ${moveCount} moves (incomplete turn).`,
      }
    } catch (error) {
      logger.error('Error in Robot.handleSingleMovingTurn:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to complete robot turn',
      }
    }
  }

  /**
   * Handle rolling-for-start state with complete automation
   */
  private static handleRollForStart = async function handleRollForStart(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    try {
      // Check if any player is a robot
      const hasRobotPlayer = game.players.some((player) => player.isRobot)
      if (!hasRobotPlayer) {
        return {
          success: false,
          error: 'No robot players in game',
        }
      }

      // Execute roll for start
      const rolledForStartGame = Game.rollForStart(game as any)

      // If a robot won, continue with their complete turn
      if (rolledForStartGame.activePlayer?.isRobot) {
        return Robot.handleRolledForStart(rolledForStartGame, difficulty)
      }

      // Human won, return rolled-for-start state
      return {
        success: true,
        game: rolledForStartGame,
        message: 'Human won roll for start',
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
   * Handle rolled-for-start state with complete automation
   */
  private static handleRolledForStart = async function handleRolledForStart(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    try {
      // Validate that the active player is a robot
      if (!game.activePlayer?.isRobot) {
        return {
          success: false,
          error: 'Active player is not a robot',
        }
      }

      // Roll dice for the robot
      const rolledGame = Game.roll(game as any)

      // Process the complete turn after rolling
      return Robot.handleCompleteMovingTurn(rolledGame, difficulty)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle rolled-for-start',
      }
    }
  }

  /**
   * Handle rolling state with complete automation
   */
  private static handleRolling = async function handleRolling(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    try {
      // Validate that the active player is a robot
      if (!game.activePlayer?.isRobot) {
        return {
          success: false,
          error: 'Active player is not a robot',
        }
      }

      // Roll dice for the robot
      const rolledGame = Game.roll(game as any)

      // Process the complete turn after rolling
      return Robot.handleCompleteMovingTurn(rolledGame, difficulty)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to handle rolling',
      }
    }
  }

  /**
   * Handle complete moving turn with automatic doubles and turn completion
   */
  private static handleCompleteMovingTurn =
    async function handleCompleteMovingTurn(
      game: BackgammonGame,
      difficulty: RobotSkillLevel,
      aiPlugin?: string
    ): Promise<RobotMoveResult> {
      try {
        // Validate that the active player is a robot
        if (!game.activePlayer?.isRobot) {
          return {
            success: false,
            error: 'Active player is not a robot',
          }
        }

        let currentGame = game
        let iterationCount = 0
        const maxIterations = 20 // Safety limit to prevent infinite loops

        // Continue processing until the robot's complete turn is finished
        while (
          currentGame.activePlayer?.isRobot &&
          (currentGame.stateKind === 'rolled' ||
            currentGame.stateKind === 'preparing-move' ||
            currentGame.stateKind === 'moving') &&
          iterationCount < maxIterations
        ) {
          iterationCount++

          // Transition to moving state if needed
          if (currentGame.stateKind === 'rolled') {
            const preparingGame = Game.prepareMove(currentGame as any)
            currentGame = Game.toMoving(preparingGame)
          } else if (currentGame.stateKind === 'preparing-move') {
            currentGame = Game.toMoving(currentGame as any)
          }

          // Get possible moves for current state
          const possibleMovesResult = Game.getPossibleMoves(currentGame)

          if (!possibleMovesResult.success) {
            return {
              success: false,
              error:
                possibleMovesResult.error || 'Failed to get possible moves',
            }
          }

          // Check if updated game was returned (turn auto-completed)
          if (possibleMovesResult.updatedGame) {
            currentGame = possibleMovesResult.updatedGame
            continue
          }

          // Check if no moves available
          if (
            !possibleMovesResult.possibleMoves ||
            possibleMovesResult.possibleMoves.length === 0
          ) {
            // Complete the turn - no more moves available
            if (Game.canConfirmTurn(currentGame)) {
              currentGame = Game.confirmTurn(currentGame as any)
              break
            } else {
              // Force turn completion if needed
              try {
                currentGame = Robot.forceCompleteTurn(currentGame as any)
                break
              } catch (error) {
                return {
                  success: false,
                  error: 'Failed to complete turn with no moves available',
                }
              }
            }
          }

          // Execute one move
          const moveResult = await Robot.executeSingleMove(
            currentGame,
            possibleMovesResult.possibleMoves,
            difficulty,
            aiPlugin
          )

          if (!moveResult.success) {
            // If single move fails, try to complete the turn
            if (Game.canConfirmTurn(currentGame)) {
              currentGame = Game.confirmTurn(currentGame as any)
              break
            }
            return moveResult
          }

          currentGame = moveResult.game!

          // Check for win condition
          if (currentGame.stateKind === 'completed') {
            return {
              success: true,
              game: currentGame,
              message: 'Robot won the game!',
            }
          }

          // Check if turn is naturally complete (all moves used)
          if (Game.canConfirmTurn(currentGame)) {
            currentGame = Game.confirmTurn(currentGame as any)
            break
          }

          // Note: In standard backgammon, doubles give 4 moves but do NOT trigger additional rolls
          // The turn ends normally after using all available moves
        }

        // Ensure turn is completed and passed to next player
        if (
          currentGame.activePlayer?.isRobot &&
          (currentGame.stateKind === 'moving' ||
            currentGame.stateKind === 'preparing-move')
        ) {
          if (Game.canConfirmTurn(currentGame)) {
            currentGame = Game.confirmTurn(currentGame as any)
          } else {
            currentGame = Robot.forceCompleteTurn(currentGame as any)
          }
        }

        return {
          success: true,
          game: currentGame,
          message: 'Robot completed full turn successfully',
        }
      } catch (error) {
        logger.error('Error in Robot.handleCompleteMovingTurn:', error)
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to complete robot turn',
        }
      }
    }

  /**
   * Execute a single move from available options
   */
  private static executeSingleMove = async function executeSingleMove(
    game: BackgammonGame,
    possibleMoves: any[],
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      if (!game.activePlayer?.dice) {
        return { success: false, error: 'No dice roll available for AI move' }
      }
      // Filter out invalid moves
      const validMoves = possibleMoves.filter((move) => {
        try {
          const originContainer = Board.getCheckerContainer(
            game.board,
            move.origin.id
          )
          return originContainer.checkers.some(
            (checker: any) => checker.color === game.activePlayer?.color
          )
        } catch {
          return false
        }
      })

      if (validMoves.length === 0) {
        return {
          success: false,
          error: 'No valid moves available',
        }
      }

      // Select move based on difficulty
      const selectedMove = Robot.selectMoveByDifficulty(
        validMoves,
        difficulty,
        game
      )

      if (!selectedMove) {
        return {
          success: false,
          error: 'Failed to select a move',
        }
      }

      // Execute the move
      const gameAfterMove = Game.executeAndRecalculate(
        game as any,
        selectedMove.origin.id
      )

      return {
        success: true,
        game: gameAfterMove,
        message: 'Robot executed move successfully',
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to execute move',
      }
    }
  }

  // Note: shouldRollAgainForDoubles method removed - this is not standard backgammon
  // In standard backgammon, doubles give 4 moves but turn ends normally afterward

  // =============================================================================
  // LEGACY COMPATIBILITY METHODS
  // =============================================================================

  /**
   * Robot rolls for start and automatically continues if robot wins
   * @deprecated Use Robot.makeOptimalMove() instead for complete automation
   */
  private static rollForStart = async function rollForStart(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    return Robot.handleRollForStart(game, 'beginner')
  }

  /**
   * Robot rolls dice
   * @deprecated Use Robot.makeOptimalMove() instead for complete automation
   */
  private static rollDice = async function rollDice(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    return Robot.handleRolling(game, 'beginner')
  }

  /**
   * Make AI-powered move using plugin system
   * @deprecated Use Robot.makeOptimalMove() instead for complete automation
   */
  private static makeAIMove = async function makeAIMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    return Robot.handleCompleteMovingTurn(game, difficulty, aiPlugin)
  }

  /**
   * Execute a move using the existing move execution logic
   * @deprecated Use Robot.executeSingleMove() instead
   */
  private static executeMove = async function executeMove(
    game: BackgammonGame,
    selectedMove: any
  ): Promise<RobotMoveResult> {
    try {
      const gameAfterMove = Game.executeAndRecalculate(
        game as any,
        selectedMove.origin.id
      )

      return {
        success: true,
        game: gameAfterMove,
        message: 'Robot executed move successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Move execution failed',
      }
    }
  }

  /**
   * Register new AI plugin
   */
  static registerAIPlugin(plugin: BackgammonAIPlugin): void {
    this.pluginManager.registerPlugin(plugin)
  }

  /**
   * Set default AI plugin
   */
  static setDefaultAI(pluginName: string): void {
    this.pluginManager.setDefaultPlugin(pluginName)
  }

  /**
   * List available AI plugins
   */
  static listAIPlugins(): BackgammonAIPlugin[] {
    return this.pluginManager.listAvailablePlugins()
  }

  /**
   * Get default AI plugin name
   */
  static getDefaultAI(): string | null {
    return this.pluginManager.getDefaultPlugin()
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
   * Find a checker that can make a specific move from possible moves
   * @param game - Current game state
   * @param selectedMove - The move from getPossibleMoves to execute
   * @returns Checker information or null if not found
   */
  private static findCheckerForMove = function findCheckerForMove(
    game: BackgammonGame,
    selectedMove: any
  ): { checkerId: string } | null {
    try {
      const activePlayer = game.activePlayer
      if (!activePlayer) {
        logger.error('Error finding checker for move: no active player')
        return null
      }

      // Validate game board exists
      if (!game.board) {
        logger.error('Error finding checker for move: game board is undefined')
        return null
      }

      // The selectedMove is from Game.getPossibleMoves, so it has origin and destination properties
      const originContainer = selectedMove.origin
      if (!originContainer) {
        logger.error(
          'Error finding checker for move: no origin in selected move'
        )
        return null
      }

      // Find a checker of the correct color at the origin
      if (originContainer.kind === 'point') {
        // Handle point origins
        const originPoint = game.board.points.find(
          (p) => p.id === originContainer.id
        )
        if (originPoint && originPoint.checkers.length > 0) {
          const checkerToMove = originPoint.checkers.find(
            (checker) => checker.color === activePlayer.color
          )
          if (checkerToMove) {
            logger.debug(
              `[DEBUG] Found checker for move: ${checkerToMove.id} from point ${originPoint.id}`
            )
            return { checkerId: checkerToMove.id }
          }
        }
      } else if (originContainer.kind === 'bar') {
        // Handle bar origins
        const barContainer = game.board.bar[activePlayer.direction]
        if (barContainer && barContainer.checkers.length > 0) {
          const checkerToMove = barContainer.checkers.find(
            (checker) => checker.color === activePlayer.color
          )
          if (checkerToMove) {
            logger.debug(
              `[DEBUG] Found checker for move: ${checkerToMove.id} from bar`
            )
            return { checkerId: checkerToMove.id }
          }
        }
      }

      logger.debug(
        `[DEBUG] No suitable checker found for move from ${originContainer.kind}`
      )
      return null
    } catch (error) {
      logger.error('Error finding checker for move:', error)
      return null
    }
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
      if (!activePlayer) {
        logger.error('Error finding optimal checker: no active player')
        return null
      }

      // Validate game board exists
      if (!game.board) {
        logger.error('Error finding optimal checker: game board is undefined')
        return null
      }

      // Validate board has points
      if (!game.board.points) {
        logger.error(
          'Error finding optimal checker: board points are undefined'
        )
        return null
      }

      // Validate moveToMake exists
      if (!moveToMake || !moveToMake.origin) {
        logger.error(
          'Error finding optimal checker: moveToMake or origin is undefined'
        )
        return null
      }

      // ENHANCED DEBUG: Log the exact search being performed
      logger.debug('[DEBUG] findOptimalChecker called with:', {
        activePlayerColor: activePlayer.color,
        activePlayerDirection: activePlayer.direction,
        moveOriginId: moveToMake.origin?.id,
        moveOriginKind: moveToMake.origin?.kind,
        moveOriginPosition: moveToMake.origin?.position,
        totalBoardPoints: game.board.points.length,
        gameStateKind: game.stateKind,
      })

      // CRITICAL FIX: Handle different origin formats
      // Origin can be a string like 'point-2' or an object with id property
      let originPoint = null

      if (typeof moveToMake.origin === 'string') {
        // Handle string origin like 'point-2'
        const originName = moveToMake.origin
        originPoint = game.board.points.find((point) => point.id === originName)
      } else if (moveToMake.origin && moveToMake.origin.id) {
        // Handle object origin with id property
        originPoint = game.board.points.find(
          (point) => point.id === moveToMake.origin.id
        )
      }

      // ENHANCED DEBUG: Log the origin point search results
      logger.debug('[DEBUG] Origin point search results:', {
        originPointFound: !!originPoint,
        originPointId: originPoint?.id,
        originPointPosition: originPoint?.position,
        originPointCheckerCount: originPoint?.checkers?.length || 0,
        originPointCheckerColors:
          originPoint?.checkers?.map((c) => c.color) || [],
        searchingForPointId: moveToMake.origin?.id,
      })

      if (originPoint && originPoint.checkers.length > 0) {
        // Find a checker of the correct color from the origin point
        const checkerToMove = originPoint.checkers.find(
          (checker) => checker.color === activePlayer.color
        )

        if (checkerToMove) {
          logger.debug(
            `[DEBUG] Found optimal checker: ${checkerToMove.id} from point ${originPoint.id}`
          )
          return { checkerId: checkerToMove.id }
        } else {
          logger.debug(
            `[DEBUG] No checker of color ${activePlayer.color} found at point ${originPoint.id}`
          )
          logger.debug(
            '[DEBUG] Available checkers at point:',
            originPoint.checkers.map((c) => ({ id: c.id, color: c.color }))
          )
        }
      } else {
        logger.debug(
          `[DEBUG] No origin point found for move origin:`,
          moveToMake.origin
        )

        // ENHANCED DEBUG: Show all board points for comparison
        logger.debug(
          '[DEBUG] All board point IDs:',
          game.board.points.map((p) => p.id)
        )
        logger.debug(
          '[DEBUG] Points with checkers:',
          game.board.points
            .filter((p) => p.checkers.length > 0)
            .map((p) => ({
              id: p.id,
              position: p.position,
              checkers: p.checkers.map((c) => c.color),
            }))
        )
      }

      // Check bar if the origin is bar
      if (
        moveToMake.origin === 'bar' ||
        (moveToMake.origin && moveToMake.origin.kind === 'bar')
      ) {
        // Validate bar exists
        if (!game.board.bar) {
          logger.error('Error finding optimal checker: board bar is undefined')
          return null
        }

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
      logger.error('Error finding optimal checker:', error)
      logger.error('Game state:', JSON.stringify(game, null, 2))
      logger.error('Move to make:', JSON.stringify(moveToMake, null, 2))
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
    logger.debug(
      '[DEBUG] forceCompleteTurn: Starting with game.board:',
      !!game.board
    )

    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      logger.debug(
        '[DEBUG] forceCompleteTurn: No activePlay or moves, cannot force completion'
      )
      throw new Error(
        'Cannot force turn completion: no activePlay or moves found'
      )
    }

    logger.debug(
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

    logger.debug(
      '[DEBUG] Robot forcing turn completion - marking remaining moves as no-move WITHOUT changing board'
    )
    logger.debug(
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

    logger.debug(
      '[DEBUG] forceCompleteTurn: game.board before validation:',
      !!game.board
    )

    // Validate game board before generating ASCII
    let asciiBoard = ''
    try {
      // Validate board exists and has required properties
      if (!game.board) {
        logger.error('[DEBUG] Robot forceCompleteTurn: game.board is undefined')
        asciiBoard = 'ERROR: Board is undefined'
      } else if (!game.board.points) {
        logger.error(
          '[DEBUG] Robot forceCompleteTurn: game.board.points is undefined'
        )
        asciiBoard = 'ERROR: Board points are undefined'
      } else if (!game.board.gnuPositionId) {
        logger.warn(
          '[DEBUG] Robot forceCompleteTurn: game.board.gnuPositionId is missing'
        )
        // Set a default gnuPositionId if missing
        game.board.gnuPositionId = 'cAkAAAAAAAAA'
      }

      // Only generate ASCII if board is valid
      if (game.board && game.board.points) {
        const { Board } = require('../Board')
        asciiBoard = Board.getAsciiGameBoard(
          game.board, // CRITICAL: Use the SAME board, no modifications
          updatedPlayers,
          nextColor,
          'rolling'
        )
      }
    } catch (error) {
      logger.error(
        '[DEBUG] Robot forceCompleteTurn: Error generating ASCII board:',
        error
      )
      asciiBoard = 'ERROR: Failed to generate board display'
    }

    logger.debug(
      '[DEBUG] forceCompleteTurn: Creating result game with board:',
      !!game.board
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

    logger.debug(
      '[DEBUG] forceCompleteTurn: Result game board:',
      !!resultGame.board
    )
    logger.debug(
      '[DEBUG] forceCompleteTurn: Result game board === original board:',
      resultGame.board === game.board
    )

    return resultGame
  }
}
