import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
  BackgammonCube,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonGameDoubled,
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGamePreparingMove,
  BackgammonGameRolled,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerDoubled,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
} from '@nodots-llc/backgammon-types/dist'
import { generateId, Player, randomBackgammonColor } from '..'
import { Board } from '../Board'
import { Checker } from '../Checker'
import { Cube } from '../Cube'
import { Dice } from '../Dice'
import { BackgammonMoveDirection, Play } from '../Play'
import { logger } from '../utils/logger'

// Hardcoded constant to avoid import issues during build
const MAX_PIP_COUNT = 167

// ⚠️  CRITICAL TECH DEBT: DICE DATA DUPLICATION ⚠️
// This module contains duplicate storage of dice roll values:
// - player.dice.currentRoll (UI display purposes)
// - game.activePlay.moves[n].dieValue (move execution logic)
// This creates maintenance overhead and potential data inconsistencies.
// See preservation logic in confirmTurn() and confirmTurnFromMoved() for examples.
export * from '../index'

// GameProps is now imported from @nodots-llc/backgammon-types

export class Game {
  id: string = generateId()
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube
  activeColor!: BackgammonColor
  activePlay!: BackgammonPlay
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

  /**
   * Creates a new game between two players
   * This is the main entry point for creating games - handles all player assignments and board setup
   *
   * @param player1UserId - User ID for player 1
   * @param player2UserId - User ID for player 2
   * @param autoRollForStart - Whether to auto roll for start
   * @param player1IsRobot - Whether player 1 is a robot
   * @param player2IsRobot - Whether player 2 is a robot
   * @param colorDirectionConfig - Optional: { blackDirection, whiteDirection, blackFirst } for explicit control (for tests)
   */
  public static createNewGame = function createNewGame(
    player1UserId: string,
    player2UserId: string,
    autoRollForStart: boolean = true,
    player1IsRobot: boolean = true,
    player2IsRobot: boolean = true,
    colorDirectionConfig?: {
      blackDirection: BackgammonMoveDirection
      whiteDirection: BackgammonMoveDirection
      blackFirst?: boolean
    }
  ): BackgammonGame {
    // Determine color and direction assignments
    let blackDirection: BackgammonMoveDirection
    let whiteDirection: BackgammonMoveDirection
    let blackFirst: boolean

    if (colorDirectionConfig) {
      blackDirection = colorDirectionConfig.blackDirection
      whiteDirection = colorDirectionConfig.whiteDirection
      blackFirst = colorDirectionConfig.blackFirst ?? true
    } else {
      // Randomize directions for real games
      if (Math.random() < 0.5) {
        blackDirection = 'clockwise'
        whiteDirection = 'counterclockwise'
        blackFirst = true
      } else {
        blackDirection = 'counterclockwise'
        whiteDirection = 'clockwise'
        blackFirst = false
      }
    }

    // Assign user IDs and robot flags to colors
    const playerConfigs = blackFirst
      ? [
          {
            color: 'black' as BackgammonColor,
            direction: blackDirection,
            userId: player1UserId,
            isRobot: player1IsRobot,
          },
          {
            color: 'white' as BackgammonColor,
            direction: whiteDirection,
            userId: player2UserId,
            isRobot: player2IsRobot,
          },
        ]
      : [
          {
            color: 'white' as BackgammonColor,
            direction: whiteDirection,
            userId: player1UserId,
            isRobot: player1IsRobot,
          },
          {
            color: 'black' as BackgammonColor,
            direction: blackDirection,
            userId: player2UserId,
            isRobot: player2IsRobot,
          },
        ]

    const players = playerConfigs.map((cfg) =>
      Player.initialize(
        cfg.color as BackgammonColor,
        cfg.direction,
        undefined,
        generateId(),
        'inactive',
        cfg.isRobot,
        cfg.userId,
        MAX_PIP_COUNT
      )
    )

    // Ensure players is a tuple of length 2
    const playersTuple = players as [(typeof players)[0], (typeof players)[1]]

    // Create board with proper dual numbering system
    // The board expects: createBoardForPlayers(clockwiseColor, counterclockwiseColor)
    const board = Board.createBoardForPlayers(
      blackDirection === 'clockwise' ? 'black' : 'white',
      blackDirection === 'counterclockwise' ? 'black' : 'white'
    )

    // Initialize game
    let game: BackgammonGame = Game.initialize(
      playersTuple,
      generateId(),
      'rolling-for-start',
      board
    ) as BackgammonGameRollingForStart

    // Auto roll for start if requested
    if (autoRollForStart) {
      // --- FORCE ROBOT TO WIN ROLL FOR START IF PLAYING AGAINST HUMAN ---
      const robotPlayer = playersTuple.find((p) => p.isRobot)
      const humanPlayer = playersTuple.find((p) => !p.isRobot)
      if (
        robotPlayer &&
        humanPlayer &&
        playersTuple.filter((p) => p.isRobot).length === 1
      ) {
        // Force the robot to win the roll for start
        const desiredActiveColor = robotPlayer.color
        const rollingPlayers = playersTuple.map((p) =>
          p.color === desiredActiveColor
            ? Player.initialize(
                p.color,
                p.direction,
                Dice.initialize(p.color, 'rolling'), // Active player gets rolling dice
                p.id,
                'rolled-for-start',
                p.isRobot,
                p.userId,
                p.pipCount
              )
            : Player.initialize(
                p.color,
                p.direction,
                undefined,
                p.id,
                'inactive',
                p.isRobot,
                p.userId,
                p.pipCount
              )
        ) as BackgammonPlayers

        const activePlayer = rollingPlayers.find(
          (p) => p.color === desiredActiveColor
        ) as BackgammonPlayerRolledForStart
        const inactivePlayer = rollingPlayers.find(
          (p) => p.color !== desiredActiveColor
        ) as BackgammonPlayerInactive

        game = {
          ...game,
          stateKind: 'rolled-for-start',
          activeColor: desiredActiveColor,
          players: rollingPlayers,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      } else if (colorDirectionConfig) {
        // When configuration is provided, respect the blackFirst setting
        const desiredActiveColor = blackFirst ? 'black' : 'white'

        // Manually create rolled-for-start state with the desired active color
        const rollingPlayers = playersTuple.map((p) =>
          p.color === desiredActiveColor
            ? Player.initialize(
                p.color,
                p.direction,
                Dice.initialize(p.color, 'rolling'), // Active player gets rolling dice
                p.id,
                'rolled-for-start',
                p.isRobot,
                p.userId,
                p.pipCount
              )
            : Player.initialize(
                p.color,
                p.direction,
                undefined,
                p.id,
                'inactive',
                p.isRobot,
                p.userId,
                p.pipCount
              )
        ) as BackgammonPlayers

        const activePlayer = rollingPlayers.find(
          (p) => p.color === desiredActiveColor
        ) as BackgammonPlayerRolledForStart
        const inactivePlayer = rollingPlayers.find(
          (p) => p.color !== desiredActiveColor
        ) as BackgammonPlayerInactive

        game = {
          ...game,
          stateKind: 'rolled-for-start',
          activeColor: desiredActiveColor,
          players: rollingPlayers,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      } else {
        // No configuration provided, use random selection
        game = Game.rollForStart(game as BackgammonGameRollingForStart)
      }

      // --- ROBOT AUTOMATION HANDLED BY Robot.makeOptimalMove() ---
      // Robot automation after winning roll-for-start is now handled by the API layer
      // calling Robot.makeOptimalMove() which provides complete turn automation
      // This prevents the problematic auto-advancement that left robots in 'moving' state
      // without executing actual moves
    }

    return game
  }

  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
        } as BackgammonGameRollingForStart
      case 'rolled-for-start':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      case 'rolling':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling
      case 'preparing-move':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGamePreparingMove
      case 'moving':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGameMoving
      case 'rolled':
        throw new Error('Game cannot be initialized in the rolled state')
      case 'moved':
        throw new Error('Game cannot be initialized in the moved state')
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
      case 'doubling':
        throw new Error('Game cannot be initialized in the doubling state')
      case 'doubled':
        throw new Error('Game cannot be initialized in the doubled state')
    }
    // Exhaustiveness check
    const _exhaustiveCheck: never = stateKind
    throw new Error(`Unhandled stateKind: ${stateKind}`)
  }

  // ============================================================================
  // GAME STATE TRANSITION METHODS
  // ============================================================================

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    // ============================================================================
    // 🚨 TEMPORARY TESTING OVERRIDE - REMOVE THIS BEFORE PRODUCTION! 🚨
    // ============================================================================
    // This code forces robots to win rollForStart for e2e testing purposes.
    // It bypasses the normal random selection to make tests deterministic.
    //
    // TODO: REMOVE THIS ENTIRE BLOCK BEFORE PRODUCTION DEPLOYMENT!
    //
    // Normal behavior should use: const activeColor = randomBackgammonColor()
    // ============================================================================

    let activeColor: BackgammonColor

    // Check if any player is a robot and force them to win
    const robotPlayer = game.players.find((p) => p.isRobot)
    if (robotPlayer) {
      // Force robot to win rollForStart
      activeColor = robotPlayer.color
      logger.warn('🤖 TESTING OVERRIDE: Forcing robot to win rollForStart!')
    } else {
      // No robots, use normal random selection
      activeColor = randomBackgammonColor()
    }

    // ============================================================================
    // END OF TEMPORARY TESTING OVERRIDE - REMOVE ABOVE BLOCK!
    // ============================================================================

    const rollingPlayers = game.players.map((p) =>
      p.color === activeColor
        ? Player.initialize(
            p.color,
            p.direction,
            Dice.initialize(p.color, 'rolling'), // Active player gets rolling dice
            p.id,
            'rolled-for-start',
            p.isRobot,
            p.userId,
            p.pipCount
          )
        : Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'inactive',
            p.isRobot,
            p.userId,
            p.pipCount
          )
    ) as BackgammonPlayers

    const activePlayer = rollingPlayers.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerRolledForStart
    const inactivePlayer = rollingPlayers.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive

    // Always return rolled-for-start state
    // Robot automation will be handled in the roll() method
    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      players: rollingPlayers,
      activePlayer,
      inactivePlayer,
    } as BackgammonGameRolledForStart
  }

  /**
   * Automatically continue robot turn from rolled-for-start state
   * This handles the complete robot automation sequence until it's the opponent's turn
   * @param game - Game in 'rolled-for-start' state with robot active player
   * @returns Game state after robot completes its turn
   */
  public static automateContinueRobotTurn =
    async function automateContinueRobotTurn(
      game: BackgammonGameRolledForStart
    ): Promise<BackgammonGame> {
      if (game.stateKind !== 'rolled-for-start') {
        throw new Error('Game must be in rolled-for-start state')
      }

      if (!game.activePlayer?.isRobot) {
        throw new Error('Active player must be a robot')
      }

      // Step 1: Roll dice to get to 'rolled' or 'rolling' state
      const gameAfterRoll = Game.roll(game)

      switch (gameAfterRoll.stateKind) {
        case 'rolled':
          // Robot got 'rolled' state, continue with robot automation
          let currentGame: BackgammonGame = gameAfterRoll

          // Step 2: Continue processing robot moves until turn is complete
          let maxIterations = 10 // Safety limit to prevent infinite loops
          let iterations = 0

          while (
            currentGame.activePlayer?.isRobot &&
            (currentGame.stateKind === 'rolled' ||
              currentGame.stateKind === 'preparing-move' ||
              currentGame.stateKind === 'moving') &&
            iterations < maxIterations
          ) {
            // Use Robot.makeOptimalMove to process the robot's turn
            const { Robot } = await import('../Robot')
            const robotResult = await Robot.makeOptimalMove(
              currentGame,
              'beginner'
            )

            if (robotResult.success && robotResult.game) {
              currentGame = robotResult.game
              iterations++
            } else {
              // If robot turn fails, break out of loop and return current state
              logger.warn(
                'Robot turn failed during automation:',
                robotResult.error
              )
              break
            }
          }

          return currentGame

        default:
          // Unexpected state, return as-is
          return gameAfterRoll as BackgammonGame
      }
    }

  /**
   * Advance robot from 'rolled' to 'moving' state automatically
   * This should only be called for robot players
   * @param game - Game in 'rolled' state with robot active player
   * @returns Game in 'moving' state
   */
  public static advanceRobotToMoving = function advanceRobotToMoving(
    game: BackgammonGameRolled
  ): BackgammonGameMoving {
    if (game.stateKind !== 'rolled') {
      throw new Error('Game must be in rolled state to advance robot to moving')
    }

    if (!game.activePlayer?.isRobot) {
      throw new Error('Can only advance robot players to moving state')
    }

    // For robots, automatically proceed to moving state
    const preparingGame = Game.prepareMove(game)
    return Game.toMoving(preparingGame)
  }

  /**
   * Roll for start with automatic robot automation
   * Async version that handles robot automation internally
   * @param game - Game in 'rolling-for-start' state
   * @returns Promise with game state after rollForStart and any robot automation
   */
  public static rollForStartWithAutomation =
    async function rollForStartWithAutomation(
      game: BackgammonGameRollingForStart
    ): Promise<BackgammonGame> {
      // Step 1: Execute rollForStart normally
      const rolledForStartGame = Game.rollForStart(game)

      // Step 2: If active player is a robot, automatically continue their turn
      if (rolledForStartGame.activePlayer?.isRobot) {
        return Game.rollWithAutomation(rolledForStartGame)
      }

      // Return rolled-for-start state for human players
      return rolledForStartGame
    }

  /**
   * Roll with automatic robot automation
   * Async version that handles robot automation internally
   * @param game - Game in 'rolled-for-start' or 'rolling' state
   * @returns Promise with game state after roll and any robot automation
   */
  public static rollWithAutomation = async function rollWithAutomation(
    game: BackgammonGameRolledForStart | BackgammonGameRolling
  ): Promise<BackgammonGame> {
    // Step 1: Execute roll normally
    const gameAfterRoll = Game.roll(game)

    switch (gameAfterRoll.stateKind) {
      case 'rolled':
        // Human player or robot that didn't complete turn automatically
        if (gameAfterRoll.activePlayer?.isRobot) {
          // Robot player, process their moves
          return Game.processCompleteRobotTurn(gameAfterRoll)
        }
        // Human player, return rolled state
        return gameAfterRoll

      default:
        // Unexpected state, return as-is
        return gameAfterRoll as BackgammonGame
    }
  }

  /**
   * Process a complete robot turn automatically
   * This method handles the full robot automation sequence until the robot's turn is complete
   * @param game - Current game state with robot active player
   * @returns Promise with game state after robot completes their turn
   */
  public static processCompleteRobotTurn =
    async function processCompleteRobotTurn(
      game: BackgammonGame
    ): Promise<BackgammonGame> {
      // Validate that the active player is a robot
      if (!game.activePlayer?.isRobot) {
        throw new Error('Active player is not a robot')
      }

      // Import Robot class dynamically to avoid circular dependency
      const { Robot } = await import('../Robot')

      let currentGame = game
      let maxIterations = 10 // Safety limit to prevent infinite loops
      let iterations = 0

      // Continue processing robot moves until turn is complete or it's the opponent's turn
      while (
        currentGame.activePlayer?.isRobot &&
        (currentGame.stateKind === 'rolled' ||
          currentGame.stateKind === 'preparing-move' ||
          currentGame.stateKind === 'moving') &&
        iterations < maxIterations
      ) {
        const robotResult = await Robot.makeOptimalMove(currentGame, 'beginner')

        if (robotResult.success && robotResult.game) {
          currentGame = robotResult.game
          iterations++
        } else {
          // If robot turn fails, break out of loop and return current state
          logger.warn('Robot turn failed during automation:', robotResult.error)
          break
        }
      }

      return currentGame
    }

  /**
   * Process a complete robot turn automatically (legacy method)
   * @deprecated Use processCompleteRobotTurn instead
   */
  public static processRobotTurn = async function processRobotTurn(
    game: BackgammonGame,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<{
    success: boolean
    error?: string
    game?: BackgammonGame
    message?: string
  }> {
    try {
      const resultGame = await Game.processCompleteRobotTurn(game)
      return {
        success: true,
        game: resultGame,
        message: 'Robot turn completed',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        game: game,
      }
    }
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart | BackgammonGameRolling
  ): BackgammonGameRolled {
    if (game.stateKind === 'rolled-for-start') {
      const { players, activeColor } = game
      const rollingPlayers = players.map((p) => {
        if (p.color === activeColor) {
          // Ensure dice is in 'rolling' state
          const dice =
            p.dice.stateKind === 'rolling'
              ? p.dice
              : Dice.initialize(p.color, 'rolling')
          return {
            ...p,
            stateKind: 'rolling',
            dice,
          } as BackgammonPlayerRolling
        }
        return {
          ...p,
          stateKind: 'inactive',
        } as BackgammonPlayerInactive
      }) as BackgammonPlayers
      const newActivePlayer = rollingPlayers.find(
        (p) => p.color === activeColor
      ) as BackgammonPlayerRolling
      const inactivePlayer = rollingPlayers.find(
        (p) => p.color !== activeColor
      ) as BackgammonPlayerInactive
      const rollingGame: BackgammonGameRolling = {
        ...game,
        stateKind: 'rolling',
        players: rollingPlayers,
        activePlayer: newActivePlayer,
        inactivePlayer,
        activeColor: activeColor!,
      }
      return Game.roll(rollingGame)
    }
    const { players, board, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    if (activePlayerForColor.stateKind !== 'rolling') {
      throw new Error('Active player must be in rolling state')
    }
    const activePlayerRolling = activePlayerForColor as BackgammonPlayerRolling
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const playerRolled = Player.roll(activePlayerRolling)
    const activePlay = Play.initialize(board, playerRolled)

    const rolledPlay = {
      ...activePlay,
      stateKind: 'rolled',
      player: playerRolled,
    } as BackgammonPlayRolled

    // Update the players array to include the rolled player
    const updatedPlayers = players.map((p) =>
      p.id === playerRolled.id ? playerRolled : p
    ) as BackgammonPlayers

    const rolledGame = {
      ...game,
      stateKind: 'rolled',
      players: updatedPlayers,
      activePlayer: playerRolled,
      activePlay: rolledPlay,
      board,
    } as BackgammonGameRolled

    // Always return 'rolled' state - robot automation is handled by rollWithAutomation()
    return rolledGame
  }

  /**
   * Switch the order of dice for the active player
   * Only allowed in 'rolled' state
   */
  public static switchDice = function switchDice(
    game: BackgammonGameRolled
  ): BackgammonGameRolled {
    if (game.stateKind !== 'rolled') {
      throw new Error(`Cannot switch dice from ${game.stateKind} state`)
    }

    const { activePlayer, activePlay } = game

    if (
      !activePlayer?.dice?.currentRoll ||
      activePlayer.dice.currentRoll.length !== 2
    ) {
      throw new Error('Active player does not have valid dice to switch')
    }

    // Switch the dice using the Dice class
    const switchedDice = Dice.switchDice(activePlayer.dice)
    const updatedActivePlayer = {
      ...activePlayer,
      dice: switchedDice,
    }

    // Update the activePlay to reflect the new dice order
    const updatedActivePlay = activePlay
      ? {
          ...activePlay,
          moves: activePlay.moves
            ? (() => {
                const movesArray = Array.from(activePlay.moves)
                if (movesArray.length >= 2) {
                  // Swap the first two moves to match the new dice order
                  const swappedMoves = [...movesArray]
                  const temp = swappedMoves[0]
                  swappedMoves[0] = swappedMoves[1]
                  swappedMoves[1] = temp
                  return new Set(swappedMoves)
                }
                return activePlay.moves
              })()
            : activePlay.moves,
        }
      : activePlay

    // Update the players array
    const updatedPlayers = game.players.map((p) =>
      p.id === activePlayer.id ? updatedActivePlayer : p
    ) as BackgammonPlayers

    return {
      ...game,
      players: updatedPlayers,
      activePlayer: updatedActivePlayer,
      activePlay: updatedActivePlay,
    } as BackgammonGameRolled
  }

  /**
   * Transition from 'rolled' to 'preparing-move' state
   * This represents the player about to make a decision (move or double)
   */
  public static prepareMove = function prepareMove(
    game: BackgammonGameRolled
  ): BackgammonGamePreparingMove {
    if (game.stateKind !== 'rolled') {
      throw new Error(`Cannot prepare move from ${game.stateKind} state`)
    }

    // The preparing-move state maintains the same play and player state
    // but indicates that a decision (move or double) is about to be made
    return {
      ...game,
      stateKind: 'preparing-move',
    } as BackgammonGamePreparingMove
  }

  /**
   * Transition from 'preparing-move' or 'doubled' to 'moving' state
   * This must be called before any moves can be made
   */
  public static toMoving = function toMoving(
    game: BackgammonGamePreparingMove | BackgammonGameDoubled
  ): BackgammonGameMoving {
    const isValidState =
      game.stateKind === 'preparing-move' || game.stateKind === 'doubled'

    if (!isValidState) {
      throw new Error(
        `Cannot start moving from ${
          (game as any).stateKind
        } state. Must be in 'preparing-move' or 'doubled' state.`
      )
    }

    const movingPlay = Play.startMove(game.activePlay)
    return Game.startMove(game, movingPlay)
  }

  /**
   * Transition from 'preparing-move' to 'doubling' state
   * This represents offering a double to the opponent
   */
  public static toDoubling = function toDoubling(
    game: BackgammonGamePreparingMove
  ): BackgammonGame {
    if (game.stateKind !== 'preparing-move') {
      throw new Error(
        `Cannot start doubling from ${
          (game as any).stateKind
        } state. Must be in 'preparing-move' state.`
      )
    }

    // Delegate to the existing offerDouble logic
    return Game.offerDouble(game, game.activePlayer)
  }

  /**
   * Transition from 'moving' to 'moved' state
   * This represents that all moves are completed and the player must confirm their turn
   */
  public static toMoved = function toMoved(
    game: BackgammonGameMoving
  ): BackgammonGameMoved {
    if (game.stateKind !== 'moving') {
      throw new Error(
        `Cannot transition to moved from ${
          (game as any).stateKind
        } state. Must be in 'moving' state.`
      )
    }

    // Ensure all moves are completed before transitioning
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      throw new Error('No active play found')
    }

    const movesArray = Array.from(activePlay.moves)
    const allMovesCompleted = movesArray.every(
      (move) => move.stateKind === 'completed'
    )

    if (!allMovesCompleted) {
      throw new Error(
        'Cannot transition to moved state - not all moves are completed'
      )
    }

    // Create moved state - human player's turn is complete, waiting for dice click confirmation
    return {
      ...game,
      stateKind: 'moved',
    } as BackgammonGameMoved
  }

  public static move = function move(
    game: BackgammonGameMoving,
    originId: string
  ): BackgammonGameMoving | BackgammonGame {
    let { activePlay, board } = game

    // Require explicit moving state - no automatic transitions
    if (activePlay.stateKind !== 'moving') {
      throw new Error(
        `Cannot move from ${activePlay.stateKind} state. Call Game.toMoving() first.`
      )
    }

    const playResult = Player.move(board, activePlay, originId)
    board = playResult.board

    // Update activePlayer from the move result if available
    let movedPlayer =
      playResult.move && playResult.move.player
        ? playResult.move.player
        : game.activePlayer

    // Always update activePlay from playResult (fallback to activePlay if undefined)
    const updatedActivePlay = (playResult as any).play || activePlay

    // --- WIN CONDITION CHECK ---
    // Check if the player has won (all checkers off) AFTER the move is processed
    // IMPORTANT: This check must happen after the checker is moved off the board
    const direction = movedPlayer.direction
    const playerOff = board.off[direction]
    const playerCheckersOff = playerOff.checkers.filter(
      (c) => c.color === movedPlayer.color
    ).length
    // If the move just made was a bear-off and this brings the total to 15, end the game
    const lastMoveKind = playResult.move && playResult.move.moveKind
    // Debug output for win condition
    logger.debug('[Game] Checking win condition:', {
      playerCheckersOff,
      lastMoveKind,
      playerOffCheckers: playerOff.checkers.length,
      movedPlayerColor: movedPlayer.color,
      movedPlayerDirection: movedPlayer.direction,
    })
    if (playerCheckersOff === 15 && lastMoveKind === 'bear-off') {
      // Player has borne off all checkers, they win
      const winner = {
        ...movedPlayer,
        stateKind: 'winner',
      } as BackgammonPlayerWinner
      return {
        ...game,
        stateKind: 'completed',
        winner,
        board,
        activePlayer: winner,
        activePlay: updatedActivePlay,
      } as any // TODO: type as BackgammonGameCompleted
    }
    // --- END WIN CONDITION CHECK ---

    // Recalculate pip counts after the move
    console.log('🧮 Game.move: Recalculating pip counts after move')
    const updatedPlayers = Player.recalculatePipCounts({
      ...game,
      board,
      players: game.players.map((p) =>
        p.id === movedPlayer.id ? movedPlayer : p
      ) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayers,
    })

    return {
      ...game,
      stateKind: 'moving',
      board,
      players: updatedPlayers,
      activePlayer: updatedPlayers.find((p) => p.id === movedPlayer.id) as any,
      activePlay: updatedActivePlay,
    } as BackgammonGameMoving
  }

  /**
   * Execute a single move and recalculate fresh moves (just-in-time approach)
   * This method prevents stale move references by always calculating moves based on current board state
   * @param game - Current game state in 'moving' state
   * @param originId - ID of the origin point/bar to move from
   * @returns Updated game state with fresh moves calculated
   */
  public static executeAndRecalculate = function executeAndRecalculate(
    game: BackgammonGameMoving,
    originId: string
  ): BackgammonGameMoving | BackgammonGame {
    // First, execute the move using the existing move method
    console.log(
      '[DEBUG] Game.executeAndRecalculate: About to execute move from origin:',
      originId
    )
    const gameAfterMove = Game.move(game, originId)

    console.log(
      '[DEBUG] Game.executeAndRecalculate: Move executed, game state:',
      {
        stateKind: gameAfterMove.stateKind,
        hasActivePlay: !!(gameAfterMove as any).activePlay,
        activePlayMoves: (gameAfterMove as any).activePlay?.moves
          ? Array.from((gameAfterMove as any).activePlay.moves).length
          : 0,
      }
    )

    // Check if the game ended (win condition)
    if (gameAfterMove.stateKind === 'completed') {
      return gameAfterMove
    }

    // Game continues, ensure we have a moving game
    const movingGame = gameAfterMove as BackgammonGameMoving

    // For robot players, auto-complete turn if all moves are completed
    if (movingGame.activePlayer.isRobot) {
      // Check if turn should be completed for robot
      const gameAfterTurnCheck = Game.checkAndCompleteTurn(movingGame)

      // If the turn was completed (different active color), return the updated game
      if (gameAfterTurnCheck.activeColor !== movingGame.activeColor) {
        return gameAfterTurnCheck
      }
    } else {
      // For human players, check if all moves are completed and transition to 'moved' state
      const activePlay = movingGame.activePlay
      if (activePlay && activePlay.moves) {
        const movesArray = Array.from(activePlay.moves)
        const allMovesCompleted = movesArray.every(
          (move) => move.stateKind === 'completed'
        )

        console.log(
          '[DEBUG] Game.executeAndRecalculate: Checking move completion:',
          {
            totalMoves: movesArray.length,
            completedMoves: movesArray.filter(
              (m) => m.stateKind === 'completed'
            ).length,
            allMovesCompleted,
            moveStates: movesArray.map((m) => ({
              id: m.id,
              state: m.stateKind,
              dieValue: m.dieValue,
            })),
            activePlayerIsRobot: movingGame.activePlayer?.isRobot,
          }
        )

        if (allMovesCompleted) {
          console.log(
            '[DEBUG] 🎯 All moves completed! Transitioning to moved state'
          )
          // All moves completed for human player, transition to 'moved' state
          return Game.toMoved(movingGame)
        } else {
          console.log(
            '[DEBUG] ⏳ Not all moves completed yet, staying in moving state'
          )
        }
      }
    }

    // CRITICAL FIX: After executing a move, the activePlay.moves now contains fresh possibleMoves
    // for all remaining ready moves thanks to the fix in Play.move()
    // The movingGame already has the updated board state and refreshed activePlay

    console.log(
      '[DEBUG] Game.executeAndRecalculate: Move executed successfully, returning updated game with fresh activePlay'
    )

    // Turn continues, return the game with fresh board state and updated activePlay
    return movingGame
  }

  /**
   * Check if the current turn is complete and transition to the next player
   * This method is primarily for robot players - human players should use confirmTurn instead
   * @param game - Current game state
   * @returns Updated game state with next player or current game if turn not complete
   */
  public static checkAndCompleteTurn = function checkAndCompleteTurn(
    game: BackgammonGameMoving
  ): BackgammonGame {
    // Check if all moves in the current turn are completed
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return game // No active play, return current game
    }

    const movesArray = Array.from(activePlay.moves)
    const allMovesCompleted = movesArray.every(
      (move) => move.stateKind === 'completed'
    )

    if (!allMovesCompleted) {
      return game // Turn not complete, return current game
    }

    // All moves are completed, transition to next player
    const nextColor = game.activeColor === 'white' ? 'black' : 'white'

    // Update players: current becomes inactive, next becomes rolling
    const updatedPlayers = game.players.map((player) => {
      if (player.color === game.activeColor) {
        return {
          ...player,
          stateKind: 'inactive' as const,
          dice: Dice.initialize(player.color, 'inactive'),
        }
      } else {
        return {
          ...player,
          stateKind: 'rolling' as const,
          dice: Dice.initialize(player.color, 'rolling'),
        }
      }
    }) as BackgammonPlayers

    // Find new active and inactive players
    const newActivePlayer = updatedPlayers.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayer = updatedPlayers.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Create completed active play
    const completedActivePlay = {
      ...activePlay,
      stateKind: 'completed' as const,
    }

    // Recalculate pip counts before transitioning to next player
    console.log(
      '🧮 Game turn completion: Recalculating pip counts before transitioning to next player'
    )
    const playersWithUpdatedPips = Player.recalculatePipCounts({
      ...game,
      players: updatedPlayers,
    })

    const newActivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Return game with next player's turn using Game.initialize for proper typing
    return Game.initialize(
      playersWithUpdatedPips,
      game.id,
      'rolling',
      game.board,
      game.cube,
      undefined, // No active play for next player until they roll
      nextColor,
      newActivePlayerWithPips,
      newInactivePlayerWithPips
    )
  }

  /**
   * Check if the current turn can be confirmed (ready to pass control to next player)
   * A turn can be confirmed when:
   * 1. Game is in 'moving' state
   * 2. Player has used all available dice OR chooses to end turn early
   * 3. No more legal moves are available for remaining dice
   * @param game - Current game state
   * @returns true if turn can be confirmed, false otherwise
   */
  public static canConfirmTurn = function canConfirmTurn(
    game: BackgammonGame
  ): boolean {
    if (game.stateKind !== 'moving') {
      return false
    }

    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return false
    }

    const movesArr = Array.from(activePlay.moves)

    // Check if any moves are completed (at least one move was made)
    const hasCompletedMoves = movesArr.some(
      (move) => move.stateKind === 'completed'
    )

    // Check if all moves are completed
    const allMovesCompleted = movesArr.every(
      (move) => move.stateKind === 'completed'
    )

    // Check if remaining ready moves have no legal moves available
    const readyMoves = movesArr.filter((move) => move.stateKind === 'ready')
    const hasLegalMovesRemaining = readyMoves.some((move) => {
      const possibleMoves = Board.getPossibleMoves(
        game.board,
        game.activePlayer,
        move.dieValue as BackgammonDieValue
      )
      return possibleMoves.length > 0
    })

    // Turn can be confirmed if:
    // 1. All moves are completed, OR
    // 2. At least one move was made AND no legal moves remain for ready dice
    return allMovesCompleted || (hasCompletedMoves && !hasLegalMovesRemaining)
  }

  /**
   * Manually confirm the current turn and pass control to the next player
   * This is triggered by dice click after the player has finished their moves
   * @param game - Current game state in 'moving' state
   * @returns Updated game state with next player's turn
   */
  public static confirmTurn = function confirmTurn(
    game: BackgammonGameMoving
  ): BackgammonGame {
    if (game.stateKind !== 'moving') {
      throw new Error('Cannot confirm turn from non-moving state')
    }

    if (!Game.canConfirmTurn(game)) {
      throw new Error(
        'Turn cannot be confirmed - either no moves made or legal moves still available'
      )
    }

    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      throw new Error('No active play found')
    }

    // Mark any remaining ready moves as 'no-move' since player is confirming turn
    const movesArr = Array.from(activePlay.moves)
    const confirmedMoves = movesArr.map((move) => {
      if (move.stateKind === 'ready') {
        return {
          ...move,
          stateKind: 'completed' as const,
          moveKind: 'no-move' as const,
          possibleMoves: [],
          isHit: false,
          origin: undefined,
          destination: undefined,
        }
      }
      return move
    })

    // Update activePlay with confirmed moves
    const confirmedActivePlay = {
      ...activePlay,
      moves: new Set(confirmedMoves),
      stateKind: 'completed' as const,
    }

    // Manually transition to next player since turn is confirmed
    const nextColor = game.activeColor === 'white' ? 'black' : 'white'

    // Update players: current becomes inactive, next becomes rolling
    const updatedPlayers = game.players.map((player) => {
      if (player.color === game.activeColor) {
        // CRITICAL FIX: Preserve robot dice currentRoll values when transitioning to inactive
        // This ensures robot dice continue to display what they rolled
        //
        // ⚠️  TECH DEBT WARNING: currentRoll DATA DUPLICATION ISSUE ⚠️
        // The dice roll values are stored in TWO places in the model:
        // 1. player.dice.currentRoll - Raw rolled values [x, y]
        // 2. game.activePlay.moves[n].dieValue - Individual die values used for moves
        // This duplication creates maintenance overhead and potential inconsistency.
        // Future refactoring should consolidate this to a single source of truth.
        //
        const preservedDice =
          player.isRobot && player.dice?.currentRoll
            ? {
                ...player.dice,
                stateKind: 'inactive' as const,
              }
            : Dice.initialize(player.color, 'inactive')

        return {
          ...player,
          stateKind: 'inactive' as const,
          dice: preservedDice,
        }
      } else {
        return {
          ...player,
          stateKind: 'rolling' as const,
          dice: Dice.initialize(player.color, 'rolling'),
        }
      }
    }) as BackgammonPlayers

    // Find new active and inactive players
    const newActivePlayer = updatedPlayers.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayer = updatedPlayers.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Recalculate pip counts before transitioning to next player
    console.log(
      '🧮 Game turn completion: Recalculating pip counts before transitioning to next player'
    )
    const playersWithUpdatedPips = Player.recalculatePipCounts({
      ...game,
      players: updatedPlayers,
    })

    const newActivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Return game with next player's turn using Game.initialize for proper typing
    return Game.initialize(
      playersWithUpdatedPips,
      game.id,
      'rolling',
      game.board,
      game.cube,
      undefined, // No active play for next player until they roll
      nextColor,
      newActivePlayerWithPips,
      newInactivePlayerWithPips
    )
  }

  /**
   * Confirm turn from 'moved' state - overload for when player clicks dice after all moves completed
   * @param game - Game in 'moved' state
   * @returns Game transitioned to next player in 'rolling' state
   */
  public static confirmTurnFromMoved = function confirmTurnFromMoved(
    game: BackgammonGameMoved
  ): BackgammonGameRolling {
    if (game.stateKind !== 'moved') {
      throw new Error(
        `Cannot confirm turn from ${
          (game as any).stateKind
        } state. Must be in 'moved' state.`
      )
    }

    // All moves should already be completed in 'moved' state
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      throw new Error('No active play found')
    }

    const movesArray = Array.from(activePlay.moves)
    const allMovesCompleted = movesArray.every(
      (move) => move.stateKind === 'completed'
    )

    if (!allMovesCompleted) {
      throw new Error('Cannot confirm turn - not all moves are completed')
    }

    // Transition to next player
    const nextColor = game.activeColor === 'white' ? 'black' : 'white'

    // Update players: current becomes inactive, next becomes rolling
    const updatedPlayers = game.players.map((player) => {
      if (player.color === game.activeColor) {
        // CRITICAL FIX: Preserve robot dice currentRoll values when transitioning to inactive
        // This ensures robot dice continue to display what they rolled
        //
        // ⚠️  TECH DEBT WARNING: currentRoll DATA DUPLICATION ISSUE ⚠️
        // The dice roll values are stored in TWO places in the model:
        // 1. player.dice.currentRoll - Raw rolled values [x, y]
        // 2. game.activePlay.moves[n].dieValue - Individual die values used for moves
        // This duplication creates maintenance overhead and potential inconsistency.
        // Future refactoring should consolidate this to a single source of truth.
        //
        const preservedDice =
          player.isRobot && player.dice?.currentRoll
            ? {
                ...player.dice,
                stateKind: 'inactive' as const,
              }
            : Dice.initialize(player.color, 'inactive')

        return {
          ...player,
          stateKind: 'inactive' as const,
          dice: preservedDice,
        }
      } else {
        return {
          ...player,
          stateKind: 'rolling' as const,
          dice: Dice.initialize(player.color, 'rolling'),
        }
      }
    }) as BackgammonPlayers

    // Find new active and inactive players
    const newActivePlayer = updatedPlayers.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayer = updatedPlayers.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Recalculate pip counts before transitioning to next player
    console.log(
      '🧮 Game turn completion: Recalculating pip counts before transitioning to next player'
    )
    const playersWithUpdatedPips = Player.recalculatePipCounts({
      ...game,
      players: updatedPlayers,
    })

    const newActivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // Return game with next player's turn - transition to 'rolling' state
    return Game.initialize(
      playersWithUpdatedPips,
      game.id,
      'rolling',
      game.board,
      game.cube,
      undefined, // No active play for next player until they roll
      nextColor,
      newActivePlayerWithPips,
      newInactivePlayerWithPips
    ) as BackgammonGameRolling
  }

  public static activePlayer = function activePlayer(
    game: BackgammonGame
  ): BackgammonPlayerActive {
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind !== 'inactive'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    return activePlayer as BackgammonPlayerActive
  }

  public static inactivePlayer = function inactivePlayer(
    game: BackgammonGame
  ): BackgammonPlayerInactive {
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor && p.stateKind === 'inactive'
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return inactivePlayer as BackgammonPlayerInactive
  }

  public static getPlayersForColor = function getPlayersForColor(
    players: BackgammonPlayers,
    color: BackgammonColor
  ): [
    activePlayerForColor: BackgammonPlayerActive,
    inactivePlayerForColor: BackgammonPlayerInactive
  ] {
    const activePlayerForColor = players.find((p) => p.color === color)
    const inactivePlayerForColor = players.find((p) => p.color !== color)
    if (!activePlayerForColor || !inactivePlayerForColor) {
      throw new Error('Players not found')
    }
    return [
      activePlayerForColor as BackgammonPlayerActive,
      inactivePlayerForColor as BackgammonPlayerInactive,
    ]
  }

  public static startMove = function startMove(
    game: BackgammonGamePreparingMove | BackgammonGameDoubled,
    movingPlay: BackgammonPlayMoving
  ): BackgammonGameMoving {
    return {
      ...game,
      stateKind: 'moving',
      activePlay: movingPlay,
    } as BackgammonGameMoving
  }

  // --- Doubling Cube Logic ---

  public static canOfferDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Allow doubling from preparing-move state only (after rolling)
    // Only if player does not own the cube and cube is not maxxed or already offered
    return (
      game.stateKind === 'preparing-move' &&
      game.cube.stateKind !== 'maxxed' &&
      game.cube.stateKind !== 'offered' &&
      (!game.cube.owner || game.cube.owner.id !== player.id)
    )
  }

  // --- Player Management ---

  /**
   * Validates if rolling is allowed in the current game state
   */
  public static canRoll(game: BackgammonGame): boolean {
    return game.stateKind === 'rolled-for-start' || game.stateKind === 'rolling'
  }

  /**
   * Validates if rolling for start is allowed in the current game state
   */
  public static canRollForStart(game: BackgammonGame): boolean {
    return game.stateKind === 'rolling-for-start'
  }

  /**
   * Validates if the specified player can roll in the current game state
   */
  public static canPlayerRoll(game: BackgammonGame, playerId: string): boolean {
    if (!Game.canRoll(game)) {
      return false
    }

    // Check if the player is the active player
    if (game.activeColor) {
      const activePlayer = game.players.find(
        (p) => p.color === game.activeColor
      )
      if (!activePlayer || activePlayer.id !== playerId) {
        return false
      }
    }

    return true
  }

  /**
   * Validates if moves can be calculated for the current game state
   */
  public static canGetPossibleMoves(game: BackgammonGame): boolean {
    return game.stateKind === 'rolled' || game.stateKind === 'preparing-move'
  }

  // --- Checker Management ---

  /**
   * Finds a checker in the game board by ID
   * @param game - The game containing the board to search
   * @param checkerId - The ID of the checker to find
   * @returns The checker object or null if not found
   */
  public static findChecker(
    game: BackgammonGame,
    checkerId: string
  ): BackgammonChecker | null {
    try {
      return Checker.getChecker(game.board, checkerId)
    } catch {
      return null
    }
  }

  public static offerDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canOfferDouble(game, player))
      throw new Error('Cannot offer double')
    // Set cube to 'offered' state and transition to 'doubling' game state
    // Find the opponent
    const opponent = game.players.find((p) => p.id !== player.id)!
    // Convert players to correct types
    const activePlayer = Player.initialize(
      player.color,
      player.direction,
      player.dice,
      player.id,
      'doubled',
      true,
      player.userId,
      player.pipCount
    )
    const inactivePlayer = opponent as BackgammonPlayerInactive
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    return {
      ...game,
      stateKind: 'doubling',
      cube: {
        ...game.cube,
        stateKind: 'offered',
        owner: player,
        value: game.cube.value
          ? (game.cube.value as Exclude<typeof game.cube.value, undefined>)
          : 2,
        offeredBy: player,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubling
  }

  public static canAcceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return (
      game.cube.stateKind === 'offered' &&
      game.cube.offeredBy &&
      game.cube.offeredBy.id !== player.id
    )
  }

  public static acceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canAcceptDouble(game, player))
      throw new Error('Cannot accept double')
    // Double the cube value, transfer ownership to accepting player, clear offeredBy, set to 'doubled' or 'maxxed'
    const nextValue = Math.min(
      game.cube.value ? game.cube.value * 2 : 2,
      64
    ) as typeof game.cube.value
    const offeringPlayer = game.cube.offeredBy!
    // Convert players to correct types
    const activePlayer = {
      ...player,
      stateKind: 'doubled',
    } as BackgammonPlayerDoubled
    const inactivePlayer = {
      ...offeringPlayer,
      stateKind: 'inactive',
    } as BackgammonPlayerInactive
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    if (nextValue === 64) {
      // If maxxed, game should be completed
      const winner = {
        ...player,
        stateKind: 'winner',
      } as BackgammonPlayerWinner
      return {
        ...game,
        stateKind: 'completed',
        winner,
        cube: {
          ...game.cube,
          stateKind: 'maxxed',
          owner: undefined,
          value: 64,
          offeredBy: undefined,
        },
      } as any // TODO: type as BackgammonGameCompleted
    }
    return {
      ...game,
      stateKind: 'doubled',
      cube: {
        ...game.cube,
        stateKind: 'doubled',
        owner: player,
        value: nextValue,
        offeredBy: undefined,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubled
  }

  public static canRefuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return Game.canAcceptDouble(game, player)
  }

  public static refuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canRefuseDouble(game, player))
      throw new Error('Cannot refuse double')
    // The refusing player loses at the current cube value
    // The offering player is the winner
    const offeringPlayer = game.cube.offeredBy!
    const winner = {
      ...offeringPlayer,
      stateKind: 'winner',
    } as BackgammonPlayerWinner
    return {
      ...game,
      stateKind: 'completed',
      winner,
    } as any // TODO: type as BackgammonGameCompleted
  }

  /**
   * Get possible moves for the current die value only (just-in-time calculation)
   * This method calculates moves for only the next available die to prevent stale references
   * Call this method after each move execution to get fresh moves based on current board state
   */
  public static getPossibleMoves = function getPossibleMoves(
    game: BackgammonGame
  ): {
    success: boolean
    error?: string
    possibleMoves?: BackgammonMoveSkeleton[]
    playerColor?: string
    updatedGame?: BackgammonGame
    currentDie?: number
  } {
    // Validate game state
    if (
      game.stateKind !== 'rolled' &&
      game.stateKind !== 'preparing-move' &&
      game.stateKind !== 'moving'
    ) {
      return {
        success: false,
        error: 'Game is not in a state where possible moves can be calculated',
      }
    }

    // Use the active player from the game object
    const targetPlayer = game.players.find((p) => p.color === game.activeColor)
    if (!targetPlayer) {
      return {
        success: false,
        error: 'Unable to determine active player',
      }
    }

    // Get activePlay and moves
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return {
        success: false,
        error: 'No active play found',
      }
    }

    const movesArr = Array.isArray(activePlay.moves)
      ? activePlay.moves
      : Array.from(activePlay.moves)

    // CRITICAL FIX: Completely ignore stale activePlay.moves and calculate fresh moves
    // based on current board state and available dice values
    let possibleMoves: BackgammonMoveSkeleton[] = []
    let currentDie: number | undefined

    if (movesArr && movesArr.length > 0) {
      // Get dice values from moves that are still in 'ready' state (not yet used)
      const readyMoves = movesArr.filter((move) => move.stateKind === 'ready')
      const availableDice = readyMoves.map((move) => move.dieValue)

      // CRITICAL FIX: Only calculate moves for the FIRST available die to prevent stale references
      // This ensures moves are always fresh based on current board state
      // Robot will be called again after each move with updated board state
      currentDie = availableDice[0]

      if (currentDie) {
        // CRITICAL FIX: Always calculate completely fresh moves based on current board state
        // Ignore all cached moves - they may reference checkers that have been moved
        console.log(
          '[DEBUG] Game.getPossibleMoves calculating fresh moves for die',
          currentDie
        )

        possibleMoves = Board.getPossibleMoves(
          game.board,
          targetPlayer,
          currentDie as BackgammonDieValue
        )

        console.log(
          '[DEBUG] Game.getPossibleMoves calculated',
          possibleMoves.length,
          'fresh moves for die',
          currentDie
        )
      }

      // Auto-complete turn when no legal moves remain (only for robot players)
      if (
        possibleMoves.length === 0 &&
        movesArr.every((m) => m.stateKind === 'ready') &&
        targetPlayer.isRobot
      ) {
        logger.debug('[Game] Auto-completing robot turn: no legal moves remain')

        // Mark all remaining moves as completed with no-move
        const completedMoves = movesArr.map((move) => ({
          ...move,
          stateKind: 'completed',
          moveKind: 'no-move',
          possibleMoves: [],
          isHit: false,
          origin: undefined,
          destination: undefined,
        }))

        // Update activePlay with completed moves
        const completedActivePlay = {
          ...activePlay,
          moves: new Set(completedMoves),
          stateKind: 'completed',
        }

        // Transition game to next player's turn
        const nextColor = game.activeColor === 'white' ? 'black' : 'white'
        const updatedGame = {
          ...game,
          activePlay: null, // CRITICAL FIX: Clear activePlay when transitioning to next player's rolling state
          stateKind: 'rolling' as const,
          activeColor: nextColor,
        }

        // Update players: current becomes inactive, other becomes rolling
        const updatedPlayers = game.players.map((player) => {
          if (player.color === game.activeColor) {
            return { ...player, stateKind: 'inactive' as const }
          } else {
            return { ...player, stateKind: 'rolling' as const }
          }
        })

        const finalUpdatedGame = {
          ...updatedGame,
          players: updatedPlayers,
        } as unknown as BackgammonGame

        return {
          success: true,
          possibleMoves: [],
          playerColor: targetPlayer.color,
          updatedGame: finalUpdatedGame,
          currentDie: currentDie,
        }
      }
    }

    return {
      success: true,
      possibleMoves,
      playerColor: targetPlayer.color,
      currentDie: currentDie,
    }
  }

  /**
   * Updates the gnuPositionId for the given game
   * @param game - The game to update
   * @returns The game with updated gnuPositionId
   */
  public static updateGnuPositionId = function updateGnuPositionId(
    game: BackgammonGame
  ): BackgammonGame {
    try {
      // Use dynamic import to avoid circular dependency
      const { exportToGnuPositionId } = require('../Board/gnuPositionId')
      const gnuPositionId = exportToGnuPositionId(game)
      logger.info(`Successfully calculated GNU Position ID: ${gnuPositionId} for game state: ${game.stateKind}`)
      return {
        ...game,
        gnuPositionId,
      }
    } catch (error) {
      logger.error(`Failed to update gnuPositionId for game ${game.id} in state ${game.stateKind}:`, error)
      // Don't swallow the error - let it bubble up so we can see what's failing
      throw error
    }
  }
}
