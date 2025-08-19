import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckerContainer,
  BackgammonDice,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGamePreparingMove,
  BackgammonGameRolled,
  BackgammonMove,
  BackgammonMoveConfirmed,
  BackgammonMoveConfirmedNoMove,
  BackgammonMoveConfirmedWithMove,
  BackgammonMoveInProgress,
  BackgammonMoveKind,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoveStateKind,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPoint,
  MoveProps,
} from '@nodots-llc/backgammon-types/dist'
import { generateId } from '..'
import { debug } from '../utils/logger'
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

      // 2. Validate game state (must be 'rolled', 'preparing-move', or 'moving')
      if (
        game.stateKind !== 'rolled' &&
        game.stateKind !== 'preparing-move' &&
        game.stateKind !== 'moving'
      ) {
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

      console.log('[DEBUG] Active play found:', {
        activePlayId: activePlay.id,
        movesCount: activePlay.moves?.size || 0,
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
        const inProgressMoves = movesArray.filter(
          (move) => move.stateKind === 'in-progress'
        )

        console.log('[DEBUG] ActivePlay.moves state assessment:', {
          totalMoves: movesArray.length,
          readyMoves: readyMoves.length,
          completedMoves: completedMoves.length,
          inProgressMoves: inProgressMoves.length,
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

        // If there are in-progress moves, this might be a race condition
        if (inProgressMoves.length > 0) {
          return {
            success: false,
            error: 'Move already in progress - wait for completion',
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
      console.log('[DEBUG] Container comparison details:', {
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

      console.log('[DEBUG] Moves from this container:', {
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

      console.log(
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
        let workingGame = game

        if (workingGame.stateKind === 'rolled') {
          workingGame = Game.prepareMove(workingGame as any)
          workingGame = Game.toMoving(workingGame)
        } else if (workingGame.stateKind === 'preparing-move') {
          workingGame = Game.toMoving(workingGame as any)
        }

        // Execute the move using executeAndRecalculate to handle automatic state transitions
        console.log('🚨 MOVE CHECKER: About to call Game.executeAndRecalculate with dice:', workingGame.activePlayer.dice?.currentRoll)
        const finalGame = Game.executeAndRecalculate(
          workingGame as any,
          moveToExecute.origin.id
        )
        console.log('🚨 MOVE CHECKER: Game.executeAndRecalculate returned with dice:', (finalGame as any).activePlayer?.dice?.currentRoll)

        console.log('[DEBUG] Human move completed successfully')
        return {
          success: true,
          game: finalGame as any,
        }
      } catch (moveError: unknown) {
        console.log(
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

      console.log('[DEBUG] Robot executing move:', {
        gameState: game.stateKind,
        activePlayState: game.activePlay?.stateKind,
        originId,
      })

      // Ensure we have a valid game state
      if (!game.activePlay) {
        console.log('[DEBUG] Robot move failed: No active play found')
        throw new Error('No active play found for robot move')
      }

      let workingGame = game

      // Handle state transitions using functional switch statement with early returns
      const transitionGameToMoving = (
        game: BackgammonGame
      ): BackgammonGameMoving => {
        switch (game.stateKind) {
          case 'rolled': {
            console.log(
              '[DEBUG] Robot transitioning from rolled to preparing-move to moving state'
            )
            try {
              // First transition to preparing-move
              const preparingGame = Game.prepareMove(
                game as BackgammonGameRolled
              )
              console.log('[DEBUG] Transitioned to preparing-move:', {
                gameState: preparingGame.stateKind,
              })

              // Then transition to moving
              const movingGame = Game.toMoving(preparingGame)
              console.log('[DEBUG] Transition completed:', {
                newGameState: movingGame.stateKind,
                newActivePlayState: movingGame.activePlay?.stateKind,
              })
              return movingGame
            } catch (transitionError: unknown) {
              const errorMessage =
                transitionError instanceof Error
                  ? transitionError.message
                  : 'Unknown error'
              console.log(
                '[DEBUG] Robot state transition failed:',
                errorMessage
              )
              throw new Error(
                `Failed to transition to moving state: ${errorMessage}`
              )
            }
          }

          case 'preparing-move': {
            console.log(
              '[DEBUG] Robot transitioning from preparing-move to moving state'
            )
            try {
              // Direct transition from preparing-move to moving
              const movingGame = Game.toMoving(
                game as BackgammonGamePreparingMove
              )
              console.log('[DEBUG] Transition completed:', {
                newGameState: movingGame.stateKind,
                newActivePlayState: movingGame.activePlay?.stateKind,
              })
              return movingGame
            } catch (transitionError: unknown) {
              const errorMessage =
                transitionError instanceof Error
                  ? transitionError.message
                  : 'Unknown error'
              console.log(
                '[DEBUG] Robot state transition from preparing-move failed:',
                errorMessage
              )
              throw new Error(
                `Failed to transition from preparing-move to moving state: ${errorMessage}`
              )
            }
          }

          case 'moving': {
            console.log(
              '[DEBUG] Robot: Game already in moving state, no transition needed'
            )
            // Already in moving state for subsequent moves in the same turn
            return game as BackgammonGameMoving
          }

          default: {
            console.log(
              '[DEBUG] Robot move failed: Invalid initial game state:',
              (game as any).stateKind
            )
            throw new Error(
              `Invalid game state for robot move: ${
                (game as any).stateKind
              }. Expected 'rolled', 'preparing-move', or 'moving'.`
            )
          }
        }
      }

      workingGame = transitionGameToMoving(workingGame)

      // Validate we're now in moving state
      if (workingGame.stateKind !== 'moving') {
        console.log(
          '[DEBUG] Robot move failed: Invalid game state after transition:',
          JSON.stringify(workingGame)
        )
        throw new Error(JSON.stringify(workingGame))
      }

      // Execute the move (now requires moving state)
      console.log('[DEBUG] Robot calling Game.move with:', {
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
            console.log(
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
          console.log(
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
        console.log('[DEBUG] Robot move completed successfully')

        console.log('[DEBUG] Robot move SUCCESS - returning game result')
        return {
          success: true,
          game: finalGame as any,
        }
      } catch (gameError: unknown) {
        console.log(
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
      console.log(
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

  /**
   * Helper method to determine possible moves for a checker
   */
  private static getPossibleMovesForChecker =
    function getPossibleMovesForChecker(
      game: BackgammonGameRolled | BackgammonGameMoving,
      checker: BackgammonChecker,
      origin: BackgammonCheckerContainer
    ): BackgammonMoveReady[] {
      const { activePlayer, board } = game
      const possibleMoves: BackgammonMoveReady[] = []

      // Get available dice values (pass activePlay to track consumed dice)
      const availableDice = Move.getAvailableDice(
        activePlayer.dice,
        game.activePlay
      )

      // For each die value, check if a move is possible
      for (const dieValue of availableDice) {
        const moveKind = Move.determineMoveKind(
          origin,
          activePlayer,
          board,
          dieValue
        )

        if (moveKind !== 'no-move') {
          // Cast container to appropriate move origin type
          const moveOrigin = origin as BackgammonMoveOrigin
          possibleMoves.push({
            id: generateId(),
            player: activePlayer,
            stateKind: 'ready',
            moveKind,
            origin: moveOrigin,
            dieValue,
            possibleMoves: [], // Will be populated if needed
          })
        }
      }

      return possibleMoves
    }

  /**
   * Helper method to get available dice values
   */
  private static getAvailableDice = function getAvailableDice(
    dice: BackgammonDice,
    activePlay?: BackgammonPlay
  ): BackgammonDieValue[] {
    if (dice.stateKind !== 'rolled' || !dice.currentRoll) {
      return []
    }

    // Get original dice values
    const originalValues: BackgammonDieValue[] = []
    const [die1, die2] = dice.currentRoll

    // Handle doubles (same value on both dice)
    if (die1 === die2) {
      // Doubles: player gets 4 moves of the same value
      originalValues.push(die1, die1, die1, die1)
    } else {
      // Regular roll: player gets 2 moves
      originalValues.push(die1, die2)
    }

    // If no activePlay, return all original values
    if (!activePlay) {
      return originalValues
    }

    // Check if activePlay has moves property (it's a play with moves, not a move itself)
    if (!('moves' in activePlay) || !activePlay.moves) {
      return originalValues
    }

    // Track consumed dice by examining moves in activePlay
    const consumedDice: BackgammonDieValue[] = []
    const movesArray = Array.from(activePlay.moves)

    for (const move of movesArray) {
      // Type guard: ensure move has the properties we need
      if (
        move &&
        typeof move === 'object' &&
        'stateKind' in move &&
        'dieValue' in move
      ) {
        const moveKind = 'moveKind' in move ? move.moveKind : 'unknown'
        const isNoMove = moveKind === 'no-move'
        const isCompleted =
          move.stateKind === 'completed' || move.stateKind === 'confirmed'

        // Count moves that have been executed:
        // Only moves that actually moved a checker should consume dice
        // 'no-move' moves should NEVER consume dice regardless of their state
        if (!isNoMove && isCompleted) {
          consumedDice.push(move.dieValue as BackgammonDieValue)
        }
      }
    }

    // Remove consumed dice from available dice
    let availableDice = [...originalValues]
    for (const consumedDie of consumedDice) {
      const index = availableDice.indexOf(consumedDie)
      if (index !== -1) {
        availableDice.splice(index, 1)
      }
    }
    return availableDice
  }

  /**
   * Helper method to determine move kind based on origin and destination
   */
  private static determineMoveKind = function determineMoveKind(
    origin: BackgammonCheckerContainer,
    player: BackgammonPlayer,
    board: BackgammonBoard,
    dieValue: BackgammonDieValue
  ): BackgammonMoveKind {
    // If checker is on the bar, it must re-enter
    if (origin.kind === 'bar') {
      return 'reenter'
    }

    // If checker is in home board and can bear off
    if (
      origin.kind === 'point' &&
      Move.canBearOff(origin as BackgammonPoint, player, board)
    ) {
      return 'bear-off'
    }

    // Otherwise it's a point-to-point move
    if (origin.kind === 'point') {
      return 'point-to-point'
    }

    return 'no-move'
  }

  /**
   * Helper method to check if a checker can bear off
   */
  private static canBearOff = function canBearOff(
    point: BackgammonPoint,
    player: BackgammonPlayer,
    board: BackgammonBoard
  ): boolean {
    // Check if all player's checkers are in home board
    // GOLDEN RULE: Use point.position[playerDirection] - no conditional logic
    const pointPosition = point.position[player.direction]

    // Home board is positions 1-6 (bear-off distance 1-6)
    if (pointPosition > 6) {
      return false
    }

    // Check if ALL player's checkers are in home board
    for (const boardPoint of board.points) {
      const boardPointPosition = boardPoint.position[player.direction]

      // If there are player's checkers outside home board, can't bear off
      if (boardPointPosition > 6) {
        for (const checker of boardPoint.checkers) {
          if (checker.color === player.color) {
            return false
          }
        }
      }
    }

    // Check bar - if player has checkers on bar, can't bear off
    const barCheckers = board.bar[player.direction].checkers
    for (const checker of barCheckers) {
      if (checker.color === player.color) {
        return false
      }
    }

    return true
  }

  public static initialize = function initializeMove({
    move,
    origin,
  }: MoveProps): BackgammonMove {
    const id = move.id ? move.id : generateId()
    const stateKind = move.stateKind ? move.stateKind : 'ready'
    return {
      ...move,
      id,
      stateKind,
      origin,
    } as BackgammonMoveReady
  }

  // Rule Reference: https://www.bkgm.com/gloss/lookup.cgi?open_point
  public static isPointOpen = function isPointOpen(
    point: BackgammonPoint,
    player: BackgammonPlayerMoving | BackgammonPlayerRolled
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
    move: BackgammonMoveReady
  ): BackgammonMoveResult {
    const { moveKind } = move
    const { player } = move
    if (!player) throw Error('Player not found')
    if (player.stateKind !== 'rolled' && player.stateKind !== 'moving')
      throw Error('Invalid player state for move')

    switch (moveKind) {
      case 'point-to-point':
        return PointToPoint.move(board, move)
      case 'reenter':
        return Reenter.move(board, move)
      case 'bear-off':
        return BearOff.move(board, move)
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

  public static confirmMove = function confirmMove(
    move: BackgammonMoveInProgress
  ): BackgammonMoveConfirmed {
    if (move.moveKind === 'no-move') {
      return {
        ...move,
        stateKind: 'confirmed',
        origin: undefined,
        destination: undefined,
        isHit: false,
      } as BackgammonMoveConfirmedNoMove
    }

    return {
      ...move,
      stateKind: 'confirmed',
      isHit:
        move.moveKind === 'point-to-point' &&
        move.destination?.checkers.length === 1 &&
        move.destination.checkers[0].color !== move.player.color,
    } as BackgammonMoveConfirmedWithMove
  }
}
