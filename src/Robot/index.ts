import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { AIPluginManager } from '../AI/AIPluginManager'
import { BackgammonAIPlugin } from '../AI/interfaces/AIPlugin'
import { BasicAIPlugin } from '../AI/plugins/BasicAIPlugin'
import { BlotRobotAIPlugin } from '../AI/plugins/BlotRobotAIPlugin'
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

  // Auto-register built-in AI plugins
  static {
    this.pluginManager.registerPlugin(new BasicAIPlugin())
    this.pluginManager.registerPlugin(new BlotRobotAIPlugin())
    this.pluginManager.setDefaultPlugin('basic-ai')
  }

  /**
   * Execute complete turn automation for a robot player using functional programming patterns
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
    // Pure validation function
    const validateGame = (game: BackgammonGame): RobotMoveResult | null => {
      if (!game) {
        return { success: false, error: 'Game is null or undefined' }
      }
      if (!game.board) {
        return { success: false, error: 'Game board is undefined' }
      }
      if (!game.players || game.players.length < 2) {
        return { success: false, error: 'Game players are invalid' }
      }
      return null // Valid game
    }

    try {
      const validationError = validateGame(game)
      if (validationError) {
        return validationError
      }

      // Pattern matching on discriminated union - functional style
      return Robot.processGameState(game, difficulty, aiPlugin)
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
   * Process robot turn - simplified wrapper around makeOptimalMove
   * This method provides a clean interface for the Game.processGameState() method
   * @param game - Game state where robot needs to take action
   * @returns Promise with updated game state after robot automation
   */
  public static async processRobotTurn(
    game: BackgammonGame
  ): Promise<BackgammonGame> {
    const result = await Robot.makeOptimalMove(game, 'intermediate')

    if (result.success && result.game) {
      return result.game
    }

    // If robot automation failed, return original game state
    logger.warn(
      'Robot automation failed, returning original state:',
      result.error
    )
    return game
  }

  /**
   * Pure function for pattern matching on game state - follows FP discriminated union pattern
   */
  private static processGameState = async function processGameState(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    // Functional pattern matching on discriminated union
    switch (game.stateKind) {
      case 'rolling-for-start':
        return Robot.processRollingForStart(game)

      case 'rolled-for-start':
        return Robot.processRolledForStart(game, difficulty)

      case 'rolling':
        return Robot.processRolling(game, difficulty)

      case 'rolled':
      case 'preparing-move':
      case 'moving':
        return Robot.processMovingTurn(game, difficulty, aiPlugin)

      default:
        return {
          success: false,
          error: `Cannot process game in state: ${game.stateKind}`,
        }
    }
  }

  /**
   * Pure function to process rolling-for-start state
   */
  private static processRollingForStart = async function processRollingForStart(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    const hasRobotPlayer = (players: any[]) =>
      players.some((player) => player.isRobot)

    if (!hasRobotPlayer(game.players)) {
      return {
        success: false,
        error: 'No robot players in game',
      }
    }

    try {
      const rolledForStartGame = Game.rollForStart(game as any)

      // If robot won, continue with their turn automation
      if (rolledForStartGame.activePlayer?.isRobot) {
        return Robot.processRolledForStart(rolledForStartGame, 'beginner')
      }

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
   * Pure function to process rolled-for-start state
   */
  private static processRolledForStart = async function processRolledForStart(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    const validateActiveRobot = (game: BackgammonGame) =>
      game.activePlayer?.isRobot

    if (!validateActiveRobot(game)) {
      return {
        success: false,
        error: 'Active player is not a robot',
      }
    }

    try {
      // Roll dice first - pure function call
      const rolledGame = Game.roll(game as any)

      logger.info(
        `Robot rolled dice after winning roll-for-start: ${rolledGame.activePlayer.dice.currentRoll}`
      )

      // Complete turn using functional composition
      return Robot.processMovingTurn(rolledGame, difficulty)
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
   * Pure function to process rolling state
   */
  private static processRolling = async function processRolling(
    game: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<RobotMoveResult> {
    const validateActiveRobot = (game: BackgammonGame) =>
      game.activePlayer?.isRobot

    if (!validateActiveRobot(game)) {
      return {
        success: false,
        error: 'Active player is not a robot',
      }
    }

    try {
      // Roll dice - pure function call
      const rolledGame = Game.roll(game as any)

      // Complete turn using functional composition
      return Robot.processMovingTurn(rolledGame, difficulty)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to handle rolling',
      }
    }
  }

  /**
   * Pure functional approach to processing moving turn - follows CLAUDE.md FP guidelines
   * Uses pre-populated activePlay.moves instead of recalculating moves
   */
  private static processMovingTurn = async function processMovingTurn(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    const validateActiveRobot = (game: BackgammonGame) =>
      game.activePlayer?.isRobot

    const validateActivePlay = (game: BackgammonGame) =>
      game.activePlay && (game.activePlay as any).moves

    if (!validateActiveRobot(game)) {
      return {
        success: false,
        error: 'Active player is not a robot',
      }
    }

    try {
      // QUICK FIX: Skip problematic state transitions and work directly with original game
      // The original game already has the board and activePlay - just ensure it's in moving state
      let workingGame = game

      // Only transition if absolutely necessary
      if (game.stateKind === 'rolled') {
        const preparingGame = Game.prepareMove(game as any)
        workingGame = Game.toMoving(preparingGame)
      } else if (game.stateKind === 'preparing-move') {
        workingGame = Game.toMoving(game as any)
      }

      if (!validateActivePlay(workingGame)) {
        return {
          success: false,
          error: 'No activePlay.moves found - cannot execute robot turn',
        }
      }

      // Functional processing of moves without imperative loops
      return Robot.processMoveSequence(workingGame, difficulty, aiPlugin)
    } catch (error) {
      logger.error('Error in Robot.processMovingTurn:', error)
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
   * Pure function to transition game to moving state - no mutations
   */
  private static transitionToMovingState = function transitionToMovingState(
    game: BackgammonGame
  ): BackgammonGame {
    switch (game.stateKind) {
      case 'rolled':
        const preparingGame = Game.prepareMove(game as any)
        return Game.toMoving(preparingGame)

      case 'preparing-move':
        return Game.toMoving(game as any)

      default:
        return game
    }
  }

  /**
   * Functional processing of move sequence using reduce instead of imperative loops
   */
  private static processMoveSequence = async function processMoveSequence(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    // DEFENSIVE PROGRAMMING: Validate activePlay.moves exists and is valid
    const activePlayMoves = (game.activePlay as any)?.moves
    if (!activePlayMoves) {
      return {
        success: false,
        error: 'No activePlay.moves found - cannot execute robot turn',
      }
    }

    const movesArray = Array.from(activePlayMoves).filter((move: any) => {
      if (!move) {
        logger.warn(
          '🤖 Robot.processMoveSequence: Found null/undefined move in activePlay.moves, filtering out'
        )
        return false
      }
      if (typeof move !== 'object') {
        logger.warn(
          `🤖 Robot.processMoveSequence: Found non-object move (${typeof move}), filtering out`
        )
        return false
      }
      return true
    })

    logger.info(
      `🤖 Robot processing ${movesArray.length} valid move slots from activePlay.moves`
    )

    // Functional approach using reduce for sequence processing
    const processMove = async (
      currentGame: BackgammonGame,
      moveSlot: any,
      index: number
    ): Promise<BackgammonGame> => {
      // DEFENSIVE PROGRAMMING: Handle null/undefined/invalid move slots
      if (!moveSlot) {
        logger.warn(`🤖 Move slot ${index + 1} is null/undefined, skipping`)
        return currentGame
      }
      if (typeof moveSlot !== 'object') {
        logger.warn(
          `🤖 Move slot ${index + 1} is not an object (${typeof moveSlot}), skipping`
        )
        return currentGame
      }
      if (!('stateKind' in moveSlot)) {
        logger.warn(
          `🤖 Move slot ${index + 1} missing stateKind property, skipping`
        )
        return currentGame
      }

      // Skip non-ready moves
      if (moveSlot.stateKind !== 'ready') {
        logger.info(
          `🤖 Move slot ${index + 1} already ${moveSlot.stateKind}, skipping`
        )
        return currentGame
      }

      // Skip moves with no possible moves
      if (!moveSlot.possibleMoves || moveSlot.possibleMoves.length === 0) {
        logger.info(
          `🤖 Move slot ${index + 1} has no possible moves, marking as no-move`
        )
        return currentGame
      }

      // Select and execute move using AI plugin or difficulty-based selection
      const selectedMove = Robot.selectMoveByStrategy(
        moveSlot.possibleMoves,
        difficulty,
        currentGame,
        aiPlugin
      )

      if (!selectedMove) {
        logger.warn(
          `🤖 Could not select move from ${moveSlot.possibleMoves.length} possible moves`
        )
        return currentGame
      }

      logger.info(
        `🤖 Executing move ${index + 1}/${movesArray.length}: ${selectedMove.origin.id} → ${selectedMove.destination.id}`
      )

      // DEBUG: Check if game has board before calling executeAndRecalculate
      if (!currentGame) {
        logger.error(`🤖 CRITICAL: currentGame is undefined!`)
        throw new Error('Game object is undefined - cannot execute move')
      }

      if (!currentGame.board) {
        logger.error(`🤖 CRITICAL: currentGame has no board property!`, {
          gameStateKind: currentGame.stateKind,
          gameKeys: Object.keys(currentGame),
          hasActivePlay: !!currentGame.activePlay,
          hasActivePlayer: !!currentGame.activePlayer,
        })
        throw new Error(
          'Game object missing board property - cannot execute move'
        )
      }

      // Execute move - pure function call
      const gameAfterMove = Game.executeAndRecalculate(
        currentGame as any,
        selectedMove.origin.id
      )

      logger.info(`🤖 Move ${index + 1} executed successfully`)
      return gameAfterMove
    }

    // Process moves sequentially using reduce for functional composition
    let gameAfterMoves = game
    let executedMoveCount = 0

    for (let i = 0; i < movesArray.length; i++) {
      const moveSlot = movesArray[i]
      const gameBeforeMove = gameAfterMoves
      gameAfterMoves = await processMove(gameAfterMoves, moveSlot, i)

      // Count executed moves
      if (gameAfterMoves !== gameBeforeMove) {
        executedMoveCount++
      }

      // Check for win condition after each move
      if (gameAfterMoves.stateKind === 'completed') {
        return {
          success: true,
          game: gameAfterMoves,
          message: 'Robot won the game!',
        }
      }
    }

    logger.info(
      `🤖 Robot executed ${executedMoveCount} moves, checking turn completion`
    )

    // Complete turn using pure functions
    const finalGame = Robot.completeTurn(gameAfterMoves)

    return {
      success: true,
      game: finalGame,
      message: `Robot completed full turn successfully (${executedMoveCount} moves executed)`,
    }
  }

  /**
   * Pure function to complete turn - no side effects
   */
  private static completeTurn = function completeTurn(
    game: BackgammonGame
  ): BackgammonGame {
    // Check if game has already completed naturally (e.g., through executeAndRecalculate)
    if (game.stateKind === 'rolling' || game.stateKind === 'rolled-for-start') {
      logger.info('🤖 Turn already completed, game state:', game.stateKind)
      return game
    }

    if (Game.canConfirmTurn(game)) {
      logger.info('🤖 All moves completed, confirming turn')
      return Game.confirmTurn(game as any)
    } else {
      logger.info('🤖 Turn not naturally complete, force completing')
      return Robot.forceCompleteTurn(game as any)
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
    return Robot.processRollingForStart(game)
  }

  /**
   * Robot rolls dice
   * @deprecated Use Robot.makeOptimalMove() instead for complete automation
   */
  private static rollDice = async function rollDice(
    game: BackgammonGame
  ): Promise<RobotMoveResult> {
    return Robot.processRolling(game, 'beginner')
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
    return Robot.processMovingTurn(game, difficulty, aiPlugin)
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
   * Select a move using either AI plugin strategy or difficulty-based selection
   * @param possibleMoves - Array of possible moves
   * @param difficulty - Robot difficulty level
   * @param game - Current game state
   * @param aiPlugin - Optional AI plugin name to use
   * @returns Selected move
   */
  private static selectMoveByStrategy = function selectMoveByStrategy(
    possibleMoves: any[],
    difficulty: RobotSkillLevel,
    game: BackgammonGame,
    aiPlugin?: string
  ): any {
    // Use specific AI strategy if requested
    if (aiPlugin === 'blot-robot') {
      logger.info(`🎯 Using BlotRobot strategy for move selection`)
      return BlotRobotAIPlugin.selectBlotMove(possibleMoves, game)
    }

    // Fall back to traditional difficulty-based selection
    return Robot.selectMoveByDifficulty(possibleMoves, difficulty, game)
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
      } else {
        // Only generate ASCII if board is valid
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
