import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { AIPluginManager } from '../AI/AIPluginManager'
import { BackgammonAIPlugin } from '../AI/interfaces/AIPlugin'
import { BasicAIPlugin } from '../AI/plugins/BasicAIPlugin'
import { Board } from '../Board'
import { Game } from '../Game'
import { Move } from '../Move'
import { Play } from '../Play'

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
      console.error('Error in Robot.makeOptimalMove:', error)
      console.error('Game state:', JSON.stringify(game, null, 2))
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
   * Make AI-powered move using plugin system
   */
  private static makeAIMove = async function makeAIMove(
    game: BackgammonGame,
    difficulty: RobotSkillLevel,
    aiPlugin?: string
  ): Promise<RobotMoveResult> {
    try {
      // CRITICAL FIX: Validate game state for AI moves
      if (!game.board) {
        return {
          success: false,
          error: 'Game board is undefined for AI move',
        }
      }

      if (!game.activePlayer) {
        return {
          success: false,
          error: 'No active player for AI move',
        }
      }

      // CRITICAL FIX: Validate dice state before proceeding
      if (!game.activePlayer.dice || !game.activePlayer.dice.currentRoll) {
        return {
          success: false,
          error: 'No dice roll available for AI move',
        }
      }

      // CRITICAL FIX: Handle state transition properly - only transition once per call
      let workingGame = game
      if (game.stateKind === 'rolled') {
        // First transition: rolled -> preparing-move
        const preparingGame = Game.prepareMove(game as any)
        // Second transition: preparing-move -> moving
        workingGame = Game.toMoving(preparingGame)
      } else if (game.stateKind === 'preparing-move') {
        // Direct transition: preparing-move -> moving
        workingGame = Game.toMoving(game as any)
      } else if (game.stateKind === 'moving') {
        // CRITICAL BUG FIX: Even if game state is 'moving', activePlay might still be in 'rolled' state
        // Check if activePlay needs to be transitioned to 'moving' state
        if (game.activePlay && game.activePlay.stateKind !== 'moving') {
          console.log(
            '[DEBUG] Robot: ActivePlay state needs transition:',
            game.activePlay.stateKind,
            '-> moving'
          )
          // Directly transition the activePlay using Play.startMove()
          const movingPlay = Play.startMove(game.activePlay as any)
          workingGame = {
            ...game,
            activePlay: movingPlay,
          }
        } else {
          // Already in moving state with activePlay also in moving state
          workingGame = game
        }
      } else {
        return {
          success: false,
          error: `Invalid game state for AI move: ${game.stateKind}`,
        }
      }

      // CRITICAL FIX: Check if there are any possible moves AFTER state transition
      console.log('[DEBUG] Robot requesting possible moves for game state:', {
        gameState: workingGame.stateKind,
        activePlayerColor: workingGame.activePlayer?.color,
        activePlayerDirection: workingGame.activePlayer?.direction,
        activePlayState: workingGame.activePlay?.stateKind,
        hasActivePlay: !!workingGame.activePlay,
        hasMoves: workingGame.activePlay?.moves
          ? workingGame.activePlay.moves.size
          : 0,
      })

      const possibleMovesResult = Game.getPossibleMoves(workingGame)

      console.log('[DEBUG] Robot received possible moves result:', {
        success: possibleMovesResult.success,
        error: possibleMovesResult.error,
        movesCount: possibleMovesResult.possibleMoves?.length || 0,
        firstMoveOriginId: possibleMovesResult.possibleMoves?.[0]?.origin?.id,
        firstMoveOriginKind:
          possibleMovesResult.possibleMoves?.[0]?.origin?.kind,
        allMoveOriginIds: possibleMovesResult.possibleMoves?.map(
          (m) => m.origin?.id
        ),
      })

      if (
        !possibleMovesResult.success ||
        !possibleMovesResult.possibleMoves ||
        possibleMovesResult.possibleMoves.length === 0
      ) {
        // No legal moves available
        console.log('[DEBUG] Robot has no legal moves available')

        // Check if Game.getPossibleMoves already handled turn completion
        if (possibleMovesResult.updatedGame) {
          return {
            success: true,
            game: possibleMovesResult.updatedGame,
            message: 'Robot completed turn (no legal moves available)',
          }
        }

        // CRITICAL FIX: Always force turn completion when no moves available
        // The previous logic was too restrictive and missed cases where activePlay might be missing
        try {
          console.log('[DEBUG] Forcing turn completion due to no legal moves')
          const completedGame = Robot.forceCompleteTurn(workingGame as any)
          return {
            success: true,
            game: completedGame,
            message: 'Robot completed turn (no legal moves available)',
          }
        } catch (completionError) {
          console.log('[DEBUG] Turn completion failed:', completionError)

          // EMERGENCY FALLBACK: Create a minimal turn completion manually
          console.log('[DEBUG] Attempting emergency turn completion')
          try {
            const nextColor = (
              workingGame.activeColor === 'white' ? 'black' : 'white'
            ) as 'white' | 'black'
            const nextPlayer = workingGame.players.find(
              (p) => p.color === nextColor
            )
            const currentPlayer = workingGame.players.find(
              (p) => p.color === workingGame.activeColor
            )

            if (
              !nextPlayer ||
              !currentPlayer ||
              workingGame.players.length !== 2
            ) {
              throw new Error('Could not find both players for turn switch')
            }

            const updatedNextPlayer = {
              ...nextPlayer,
              stateKind: 'rolling' as const,
            }
            const updatedCurrentPlayer = {
              ...currentPlayer,
              stateKind: 'inactive' as const,
            }

            // Create properly typed players array
            const updatedPlayers = workingGame.players.map((p) =>
              p.color === nextColor ? updatedNextPlayer : updatedCurrentPlayer
            )

            const emergencyGame = {
              ...workingGame,
              stateKind: 'rolling' as const,
              activeColor: nextColor,
              activePlayer: updatedNextPlayer,
              inactivePlayer: updatedCurrentPlayer,
              activePlay: null, // Clear active play
              players: updatedPlayers,
            } as any // Cast to any to bypass strict typing for emergency fallback

            console.log('[DEBUG] Emergency turn completion successful')
            return {
              success: true,
              game: emergencyGame,
              message:
                'Robot completed turn using emergency fallback (no legal moves available)',
            }
          } catch (emergencyError) {
            console.error(
              '[DEBUG] Emergency turn completion also failed:',
              emergencyError
            )
            return {
              success: false,
              error:
                'Failed to complete turn with no legal moves - all fallbacks failed',
            }
          }
        }
      }

      // CRITICAL FIX: Use actual possible moves and execute directly with Game.move
      // This eliminates all the complexity of finding checkers and using Move.moveChecker
      const rawPossibleMoves = possibleMovesResult.possibleMoves

      // CRITICAL FIX: Filter out invalid moves where the origin point doesn't actually have checkers
      // This prevents the "No checker found" infinite loop by validating moves against actual board state
      const actualPossibleMoves = rawPossibleMoves.filter((move: any) => {
        try {
          const originContainer = Board.getCheckerContainer(
            workingGame.board,
            move.origin.id
          )
          const hasValidChecker = originContainer.checkers.some(
            (checker: any) => checker.color === workingGame.activePlayer.color
          )

          if (!hasValidChecker) {
            console.log('[DEBUG] Robot filtered out invalid move:', {
              originId: move.origin.id,
              originKind: move.origin.kind,
              checkerCount: originContainer.checkers.length,
              checkerColors: originContainer.checkers.map((c: any) => c.color),
              activePlayerColor: workingGame.activePlayer.color,
            })
          }

          return hasValidChecker
        } catch (error) {
          console.log('[DEBUG] Robot filtered out move due to error:', {
            originId: move.origin.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          return false
        }
      })

      console.log('[DEBUG] Robot move filtering results:', {
        rawMovesCount: rawPossibleMoves.length,
        validMovesCount: actualPossibleMoves.length,
        filteredOutCount: rawPossibleMoves.length - actualPossibleMoves.length,
      })

      // Check if we filtered out all moves (no valid moves remain)
      if (actualPossibleMoves.length === 0) {
        console.log(
          '[DEBUG] Robot: All moves were filtered out - no valid checkers at origin points'
        )

        // Return the current game state - let simulation script handle turn completion
        return {
          success: true,
          game: workingGame,
          message:
            'Robot has no valid moves available - turn should be completed by simulation',
        }
      }

      // Let the Robot select from the REAL possible moves using existing difficulty logic
      console.log('[DEBUG] Robot selecting move from possible moves:', {
        totalMoves: actualPossibleMoves.length,
        difficulty: difficulty,
        possibleMoveOriginIds: actualPossibleMoves.map((m) => m.origin?.id),
      })

      const selectedMove = Robot.selectMoveByDifficulty(
        actualPossibleMoves,
        difficulty,
        workingGame
      )

      console.log('[DEBUG] Robot selected move:', {
        selectedMoveOriginId: selectedMove?.origin?.id,
        selectedMoveOriginKind: selectedMove?.origin?.kind,
        selectedMoveDestinationId: selectedMove?.destination?.id,
        selectedMoveDestinationKind: selectedMove?.destination?.kind,
        dieValue: selectedMove?.dieValue,
      })

      // Validate the selected move
      if (!selectedMove) {
        return {
          success: false,
          error: 'Failed to select a move from available options',
        }
      }

      // CRITICAL FIX: Validate that the origin point actually has checkers before attempting move
      // This prevents the "No checker found" infinite loop bug
      const originContainer = Board.getCheckerContainer(
        workingGame.board,
        selectedMove.origin.id
      )
      const activePlayer = workingGame.activePlayer

      // Check if the origin point has any checkers for the active player
      const hasValidChecker = originContainer.checkers.some(
        (checker: any) => checker.color === activePlayer.color
      )

      if (!hasValidChecker) {
        console.log(
          '[DEBUG] Robot move validation failed: No valid checker at origin point',
          {
            originId: selectedMove.origin.id,
            originKind: selectedMove.origin.kind,
            checkerCount: originContainer.checkers.length,
            checkerColors: originContainer.checkers.map((c: any) => c.color),
            activePlayerColor: activePlayer.color,
          }
        )

        return {
          success: false,
          error: 'No valid checker found at origin point - possible stale move',
        }
      }

      // STALE MOVE REFERENCE FIX: Use Game.executeAndRecalculate for just-in-time approach
      // This prevents stale move references by always calculating moves based on current board state
      try {
        console.log(
          '[DEBUG] Robot executing move with Game.executeAndRecalculate:',
          {
            gameState: workingGame.stateKind,
            originId: selectedMove.origin.id,
            originKind: selectedMove.origin.kind,
          }
        )

        // Use the new executeAndRecalculate method that handles stale move references
        const gameAfterMove = Game.executeAndRecalculate(
          workingGame as any,
          selectedMove.origin.id
        )

        // The Robot should only execute ONE move per call and return the updated game
        // The simulation script will call the Robot again if more moves are needed
        return {
          success: true,
          game: gameAfterMove,
          message:
            'Robot executed one move successfully (just-in-time approach)',
        }
      } catch (moveError) {
        // Handle "No checker found" and "stale move reference" errors properly
        if (
          moveError instanceof Error &&
          (moveError.message.includes('No checker found') ||
            moveError.message.includes('stale move reference'))
        ) {
          console.log(
            '[DEBUG] Robot caught stale move reference error - this indicates the move is no longer valid'
          )
          // Return failure to let simulation handle this properly
          return {
            success: false,
            error:
              'Move failed: No checker found at origin point (stale move reference)',
            game: workingGame,
          }
        }

        return {
          success: false,
          error:
            moveError instanceof Error
              ? moveError.message
              : 'Move execution failed',
        }
      }
    } catch (error) {
      console.error('Error in Robot.makeAIMove:', error)
      console.error('Game state:', JSON.stringify(game, null, 2))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI move failed',
      }
    }
  }

  /**
   * Execute a move using the existing move execution logic
   */
  private static executeMove = async function executeMove(
    game: BackgammonGame,
    selectedMove: any
  ): Promise<RobotMoveResult> {
    try {
      // Find a checker at the origin point that can make this move
      const checkerInfo = Robot.findOptimalChecker(game, selectedMove)
      if (!checkerInfo) {
        return {
          success: false,
          error: 'No suitable checker found for the selected move',
        }
      }

      // CRITICAL FIX: Use the game parameter (which is workingGame from caller) for move execution
      const gameLookup = async () => game
      const moveResult = await Move.moveChecker(
        game.id,
        checkerInfo.checkerId,
        gameLookup
      )

      if (!moveResult.success) {
        return {
          success: false,
          error: moveResult.error || 'Move execution failed',
        }
      }

      // Return the game after the move - let simulation handle turn completion
      const gameAfterMove = moveResult.game

      return {
        success: true,
        game: gameAfterMove,
        message: 'Robot made AI-powered move',
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
        console.error('Error finding checker for move: no active player')
        return null
      }

      // Validate game board exists
      if (!game.board) {
        console.error('Error finding checker for move: game board is undefined')
        return null
      }

      // The selectedMove is from Game.getPossibleMoves, so it has origin and destination properties
      const originContainer = selectedMove.origin
      if (!originContainer) {
        console.error(
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
            console.log(
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
            console.log(
              `[DEBUG] Found checker for move: ${checkerToMove.id} from bar`
            )
            return { checkerId: checkerToMove.id }
          }
        }
      }

      console.log(
        `[DEBUG] No suitable checker found for move from ${originContainer.kind}`
      )
      return null
    } catch (error) {
      console.error('Error finding checker for move:', error)
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
        console.error('Error finding optimal checker: no active player')
        return null
      }

      // Validate game board exists
      if (!game.board) {
        console.error('Error finding optimal checker: game board is undefined')
        return null
      }

      // Validate board has points
      if (!game.board.points) {
        console.error(
          'Error finding optimal checker: board points are undefined'
        )
        return null
      }

      // Validate moveToMake exists
      if (!moveToMake || !moveToMake.origin) {
        console.error(
          'Error finding optimal checker: moveToMake or origin is undefined'
        )
        return null
      }

      // ENHANCED DEBUG: Log the exact search being performed
      console.log('[DEBUG] findOptimalChecker called with:', {
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
      console.log('[DEBUG] Origin point search results:', {
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
          console.log(
            `[DEBUG] Found optimal checker: ${checkerToMove.id} from point ${originPoint.id}`
          )
          return { checkerId: checkerToMove.id }
        } else {
          console.log(
            `[DEBUG] No checker of color ${activePlayer.color} found at point ${originPoint.id}`
          )
          console.log(
            '[DEBUG] Available checkers at point:',
            originPoint.checkers.map((c) => ({ id: c.id, color: c.color }))
          )
        }
      } else {
        console.log(
          `[DEBUG] No origin point found for move origin:`,
          moveToMake.origin
        )

        // ENHANCED DEBUG: Show all board points for comparison
        console.log(
          '[DEBUG] All board point IDs:',
          game.board.points.map((p) => p.id)
        )
        console.log(
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
          console.error('Error finding optimal checker: board bar is undefined')
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
      console.error('Error finding optimal checker:', error)
      console.error('Game state:', JSON.stringify(game, null, 2))
      console.error('Move to make:', JSON.stringify(moveToMake, null, 2))
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
    console.log(
      '[DEBUG] forceCompleteTurn: Starting with game.board:',
      !!game.board
    )

    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      console.log(
        '[DEBUG] forceCompleteTurn: No activePlay or moves, cannot force completion'
      )
      throw new Error(
        'Cannot force turn completion: no activePlay or moves found'
      )
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

    console.log(
      '[DEBUG] forceCompleteTurn: game.board before validation:',
      !!game.board
    )

    // Validate game board before generating ASCII
    let asciiBoard = ''
    try {
      // Validate board exists and has required properties
      if (!game.board) {
        console.error(
          '[DEBUG] Robot forceCompleteTurn: game.board is undefined'
        )
        asciiBoard = 'ERROR: Board is undefined'
      } else if (!game.board.points) {
        console.error(
          '[DEBUG] Robot forceCompleteTurn: game.board.points is undefined'
        )
        asciiBoard = 'ERROR: Board points are undefined'
      } else if (!game.board.gnuPositionId) {
        console.warn(
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
      console.error(
        '[DEBUG] Robot forceCompleteTurn: Error generating ASCII board:',
        error
      )
      asciiBoard = 'ERROR: Failed to generate board display'
    }

    console.log(
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

    console.log(
      '[DEBUG] forceCompleteTurn: Result game board:',
      !!resultGame.board
    )
    console.log(
      '[DEBUG] forceCompleteTurn: Result game board === original board:',
      resultGame.board === game.board
    )

    return resultGame
  }
}
