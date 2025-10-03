import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckerContainer,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonMove,
  BackgammonMoveKind,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPoint,
  MoveProps,
} from '@nodots-llc/backgammon-types'
import { generateId } from '..'
import { debug, logger } from '../utils/logger'
import { BearOff } from './MoveKinds/BearOff'
import { PointToPoint } from './MoveKinds/PointToPoint'
import { Reenter } from './MoveKinds/Reenter'

// MoveProps is now imported from @nodots-llc/backgammon-types

export interface SimpleMoveResult {
  success: boolean
  game?: BackgammonGame
  error?: string
  possibleMoves?: BackgammonMoveReady[]
}

export interface GameLookupFunction {
  (gameId: string): Promise<BackgammonGame | null>
}

export class Move {
  player!: BackgammonPlayer
  id!: string
  dieValue!: BackgammonDieValue
  stateKind!: BackgammonMoveStateKind
  moveKind: BackgammonMoveKind | undefined = undefined
  origin: BackgammonCheckerContainer | undefined = undefined
  destination: BackgammonCheckerContainer | undefined = undefined

  /**
   * Simplified move method that takes gameId and checkerId and figures out the rest
   * @param gameId - The game ID
   * @param checkerId - The checker ID to move
   * @param gameLookup - Function to lookup game by ID (injected from API layer)
   * @returns SimpleMoveResult with success/error and updated game state
   */
  public static moveChecker = async function moveChecker(
    gameId: string,
    checkerId: string,
    gameLookup: GameLookupFunction
  ): Promise<SimpleMoveResult> {
    try {
      // 1. Look up game by gameId
      const game = await gameLookup(gameId)
      if (!game) {
        return {
          success: false,
          error: 'Game not found',
        }
      }

      debug('Game found', {
        gameId,
        stateKind: game.stateKind,
        activeColor: game.activeColor,
        hasActivePlay: !!game.activePlay,
      })

      // 2. Validate game state (must be 'moving')
      switch (game.stateKind) {
        case 'moving':
          // Valid state for moving
          break
        case 'rolling-for-start':
        case 'rolled-for-start':
        case 'rolling':
        case 'doubled':
        case 'moved':
        case 'completed':
          return {
            success: false,
            error: `Game is not in a state where moving is allowed. Current state: ${game.stateKind}`,
          }
      }

      // 3. Find checker by checkerId in board
      const checkerInfo = Move.findCheckerInBoard(game.board, checkerId)
      if (!checkerInfo) {
        return {
          success: false,
          error: 'Checker not found on board',
        }
      }

      const { checker, container } = checkerInfo
      debug('Checker found', {
        checkerId: checker.id,
        checkerColor: checker.color,
        containerKind: container.kind,
        containerPosition:
          container.kind === 'point' ? container.position : container.kind,
      })

      // 4. Validate that the checker belongs to the active player
      if (checker.color !== game.activeColor) {
        return {
          success: false,
          error: "Cannot move opponent's checker",
        }
      }

      // 5. Get active play and filter possible moves by the checker's container
      const activePlay = game.activePlay
      if (!activePlay) {
        return {
          success: false,
          error: 'No active play found - player needs to roll dice first',
        }
      }

      logger.info('[DEBUG] Active play found:', {
        activePlayId: activePlay.id,
        movesCount: activePlay.moves?.length || 0,
      })

      // Get the current move (first ready move) from the sequence
      const movesArray = Array.from(activePlay.moves?.values() || [])
      const currentMove = movesArray.find((move) => move.stateKind === 'ready')

      if (!currentMove) {
        // PROPER STATE ASSESSMENT: Check activePlay.moves state machine
        const readyMoves = movesArray.filter(
          (move) => move.stateKind === 'ready'
        )
        const completedMoves = movesArray.filter(
          (move) =>
            move.stateKind === 'completed' || move.stateKind === 'confirmed'
        )
        logger.info('[DEBUG] ActivePlay.moves state assessment:', {
          totalMoves: movesArray.length,
          readyMoves: readyMoves.length,
          completedMoves: completedMoves.length,
          moveStates: movesArray.map((m) => ({
            id: m.id,
            state: m.stateKind,
            dieValue: m.dieValue,
          })),
        })

        // If all moves are completed/confirmed, turn should be completed
        if (
          completedMoves.length === movesArray.length &&
          movesArray.length > 0
        ) {
          return {
            success: false,
            error:
              'All moves in activePlay are completed - turn should be completed',
          }
        }

        // If no ready moves but not all completed, something is wrong with state
        return {
          success: false,
          error: `ActivePlay state inconsistency: ${readyMoves.length} ready, ${completedMoves.length} completed of ${movesArray.length} total moves`,
        }
      }

      if (!currentMove.possibleMoves) {
        return {
          success: false,
          error: 'No possible moves for current move',
        }
      }

      // Check if there are any possible moves from the checker's container
      const checkerContainer = checkerInfo.container

      // Enhanced debug logging to understand the mismatch
      logger.info('[DEBUG] Container comparison details:', {
        checkerContainerId: checkerContainer.id,
        checkerContainerKind: checkerContainer.kind,
        checkerContainerPosition:
          checkerContainer.kind === 'point'
            ? (checkerContainer as BackgammonPoint).position
            : 'N/A',
        possibleMovesOrigins: currentMove.possibleMoves.map((pm) => ({
          originId: pm.origin.id,
          originKind: pm.origin.kind,
          originPosition:
            pm.origin.kind === 'point'
              ? (pm.origin as BackgammonPoint).position
              : 'N/A',
        })),
      })

      const movesFromThisContainer = currentMove.possibleMoves.filter(
        (pm) => pm.origin.id === checkerContainer.id
      )

      logger.info('[DEBUG] Moves from this container:', {
        checkerId,
        containerID: checkerContainer.id,
        containerKind: checkerContainer.kind,
        currentMoveDieValue: currentMove.dieValue,
        currentMovePossibleMoves: currentMove.possibleMoves?.length || 0,
        movesFromThisContainer: movesFromThisContainer.length,
      })

      if (movesFromThisContainer.length === 0) {
        return {
          success: false,
          error: 'No legal moves available from this position',
        }
      }

      // CRITICAL FIX: Execute any valid move from this container, regardless of specific checker
      // Multiple checkers from the same point can make the same move
      const moveToExecute = movesFromThisContainer[0]

      logger.info(
        `[DEBUG] Executing move: die ${moveToExecute.dieValue}, origin ${
          moveToExecute.origin.kind === 'point'
            ? 'point-' + moveToExecute.origin.position.clockwise
            : moveToExecute.origin.kind
        }, destination ${
          moveToExecute.destination.kind === 'point'
            ? 'point-' + moveToExecute.destination.position.clockwise
            : moveToExecute.destination.kind
        }`
      )

      // Execute human move directly using Game.move
      try {
        const { Game } = await import('..')

        // Ensure game is in correct state for moving
        let workingGame: BackgammonGameMoving

        switch (game.stateKind) {
          case 'moving':
            // Already in moving state, no transition needed
            workingGame = game as BackgammonGameMoving
            break
          default:
            throw new Error(
              `Cannot execute move from ${(game as any).stateKind} state. Must be in moving state.`
            )
        }

        // Execute the move using executeAndRecalculate to handle automatic state transitions
        logger.info(
          '🚨 MOVE CHECKER: About to call Game.executeAndRecalculate with dice:',
          workingGame.activePlayer.dice?.currentRoll
        )
        const finalGame = Game.executeAndRecalculate(
          workingGame as any,
          moveToExecute.origin.id
        )
        logger.info(
          '🚨 MOVE CHECKER: Game.executeAndRecalculate returned with dice:',
          (finalGame as any).activePlayer?.dice?.currentRoll
        )

        logger.info('[DEBUG] Human move completed successfully')
        return {
          success: true,
          game: finalGame as any,
        }
      } catch (moveError: unknown) {
        logger.info(
          '[DEBUG] Human move failed:',
          moveError instanceof Error ? moveError.message : 'Unknown error'
        )
        return {
          success: false,
          error: `Move execution failed: ${moveError instanceof Error ? moveError.message : 'Unknown error'}`,
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
   * Execute a move for a robot player with explicit state management
   */
  private static executeRobotMove = async function executeRobotMove(
    game: BackgammonGame,
    originId: string
  ): Promise<SimpleMoveResult> {
    try {
      // Import Game class to use proper game state management
      const { Game } = await import('..')

      logger.info('[DEBUG] Robot executing move:', {
        gameState: game.stateKind,
        activePlayState: game.activePlay?.stateKind,
        originId,
      })

      // Ensure we have a valid game state
      if (!game.activePlay) {
        logger.info('[DEBUG] Robot move failed: No active play found')
        throw new Error('No active play found for robot move')
      }

      let workingGame = game

      // Handle state transitions using functional switch statement with early returns
      const transitionGameToMoving = (
        game: BackgammonGame
      ): BackgammonGameMoving => {
        switch (game.stateKind) {
          case 'moving': {
            logger.info(
              '[DEBUG] Robot: Game already in moving state, no transition needed'
            )
            // Already in moving state for subsequent moves in the same turn
            return game as BackgammonGameMoving
          }

          default: {
            logger.info(
              '[DEBUG] Robot move failed: Invalid initial game state:',
              (game as any).stateKind
            )
            throw new Error(
              `Invalid game state for robot move: ${
                (game as any).stateKind
              }. Expected 'moving'.`
            )
          }
        }
      }

      workingGame = transitionGameToMoving(workingGame)

      // Validate we're now in moving state
      if (workingGame.stateKind !== 'moving') {
        logger.info(
          '[DEBUG] Robot move failed: Invalid game state after transition:',
          JSON.stringify(workingGame)
        )
        throw new Error(JSON.stringify(workingGame))
      }

      // Execute the move (now requires moving state)
      logger.info('[DEBUG] Robot calling Game.move with:', {
        gameState: workingGame.stateKind,
        originId,
      })

      try {
        // SHORT-TERM FIX: Double validation right before Game.move() execution
        // This prevents the "No checker found" infinite loop by catching board state changes
        try {
          const { Board } = await import('..')
          const doubleCheckContainer = Board.getCheckerContainer(
            workingGame.board,
            originId
          )
          const doubleCheckHasValidChecker = doubleCheckContainer.checkers.some(
            (checker: any) => checker.color === workingGame.activePlayer.color
          )

          if (!doubleCheckHasValidChecker) {
            logger.info(
              '[DEBUG] Move double validation failed: Board state changed between validation and execution:',
              {
                originId: originId,
                checkerCount: doubleCheckContainer.checkers.length,
                checkerColors: doubleCheckContainer.checkers.map(
                  (c: any) => c.color
                ),
                activePlayerColor: workingGame.activePlayer.color,
              }
            )

            // Handle gracefully: Return success but indicate turn should be completed
            return {
              success: true,
              game: workingGame,
              error: 'Board state changed - validation failed, completing turn',
            }
          }
        } catch (doubleValidationError) {
          logger.info(
            '[DEBUG] Move double validation error:',
            doubleValidationError
          )
          // If double validation fails, return success but indicate turn should be completed
          return {
            success: true,
            game: workingGame,
            error: 'Double validation failed, completing turn',
          }
        }

        const finalGame = Game.move(workingGame as any, originId)
        logger.info('[DEBUG] Robot move completed successfully')

        logger.info('[DEBUG] Robot move SUCCESS - returning game result')
        return {
          success: true,
          game: finalGame as any,
        }
      } catch (gameError: unknown) {
        logger.info(
          '[DEBUG] Robot Game.move failed:',
          gameError instanceof Error ? gameError.message : 'Unknown error'
        )
        throw new Error(
          `Game.move failed: ${
            gameError instanceof Error ? gameError.message : 'Unknown error'
          }`
        )
      }
    } catch (moveError: unknown) {
      // Core should barf on illegal input - throw the error up
      logger.info(
        '[DEBUG] Robot move EXCEPTION caught:',
        moveError instanceof Error ? moveError.message : 'Unknown error'
      )
      throw new Error(
        `Robot move execution failed: ${
          moveError instanceof Error ? moveError.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Helper method to find a checker by ID in the board
   */
  private static findCheckerInBoard = function findCheckerInBoard(
    board: BackgammonBoard,
    checkerId: string
  ): {
    checker: BackgammonChecker
    container: BackgammonCheckerContainer
  } | null {
    // Search all points
    for (const point of board.points) {
      const checker = point.checkers.find((c) => c.id === checkerId)
      if (checker) {
        return { checker, container: point }
      }
    }

    // Search bar
    const barClockwise = board.bar.clockwise.checkers.find(
      (c) => c.id === checkerId
    )
    if (barClockwise) {
      return { checker: barClockwise, container: board.bar.clockwise }
    }

    const barCounterclockwise = board.bar.counterclockwise.checkers.find(
      (c) => c.id === checkerId
    )
    if (barCounterclockwise) {
      return {
        checker: barCounterclockwise,
        container: board.bar.counterclockwise,
      }
    }

    // Search off (though you can't move checkers that are off)
    const offClockwise = board.off.clockwise.checkers.find(
      (c) => c.id === checkerId
    )
    if (offClockwise) {
      return { checker: offClockwise, container: board.off.clockwise }
    }

    const offCounterclockwise = board.off.counterclockwise.checkers.find(
      (c) => c.id === checkerId
    )
    if (offCounterclockwise) {
      return {
        checker: offCounterclockwise,
        container: board.off.counterclockwise,
      }
    }

    return null
  }

  public static initialize = function initializeMove({
    move,
    origin,
  }: MoveProps): BackgammonMove {
    const id = move.id ? move.id : generateId()
    const stateKind = move.stateKind ? move.stateKind : 'ready'

    // If move is ready state, don't include origin (origin is in possibleMoves)
    // Origin gets added when move transitions to completed
    if (stateKind === 'ready') {
      return {
        ...move,
        id,
        stateKind,
      } as BackgammonMoveReady
    }

    // For other states (completed, confirmed), include origin
    return {
      ...move,
      id,
      stateKind,
      origin,
    } as BackgammonMove
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  public static isPointOpen = function isPointOpen(
    point: BackgammonPoint,
    player: BackgammonPlayerMoving
  ) {
    if (point.checkers.length < 2) return true
    if (point.checkers.length >= 2 && point.checkers[0].color === player.color)
      return true
    if (point.checkers.length > 1 && point.checkers[0].color !== player.color)
      return false
    if (point.checkers.length === 1 && point.checkers[0].color !== player.color)
      return true
    return false
  }

  public static move = function move(
    board: BackgammonBoard,
    move: BackgammonMoveReady,
    origin: BackgammonMoveOrigin
  ): BackgammonMoveResult {
    const { moveKind } = move
    const { player } = move
    if (!player) throw Error('Player not found')
    if (player.stateKind !== 'moving')
      throw Error('Invalid player state for move')

    switch (moveKind) {
      case 'point-to-point':
        return PointToPoint.move(board, move, origin)
      case 'reenter':
        return Reenter.move(board, move, origin)
      case 'bear-off':
        return BearOff.move(board, move, origin)
      case 'no-move':
      case undefined:
        return {
          board,
          move: {
            ...move,
            moveKind: 'no-move',
            stateKind: 'completed',
            origin: undefined,
            destination: undefined,
            isHit: false,
          },
        }
    }
  }
}
