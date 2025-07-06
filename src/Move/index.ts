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
} from '@nodots-llc/backgammon-types/dist'
import { generateId } from '..'
import { BearOff } from './MoveKinds/BearOff'
import { PointToPoint } from './MoveKinds/PointToPoint'
import { Reenter } from './MoveKinds/Reenter'

export interface MoveProps {
  move: BackgammonMove
  origin: BackgammonMoveOrigin
}

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

      console.log('[DEBUG] Game found:', {
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
      console.log('[DEBUG] Checker found:', {
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

      // 5. Get the active play and find moves that this checker can participate in
      if (!game.activePlay || !game.activePlay.moves) {
        return {
          success: false,
          error: 'No active play found',
        }
      }

      console.log('[DEBUG] Active play found:', {
        playId: game.activePlay.id,
        movesCount: game.activePlay.moves.size,
      })

      const availableMoves: BackgammonMoveReady[] = []
      const movesArray = Array.from(game.activePlay.moves.values())

      console.log('[DEBUG] Checking moves:', {
        totalMoves: movesArray.length,
        moves: movesArray.map((m) => ({
          id: m.id,
          dieValue: m.dieValue,
          stateKind: m.stateKind,
          moveKind: m.moveKind,
          possibleMovesCount: m.possibleMoves ? m.possibleMoves.length : 0,
        })),
      })

      // Find moves where this checker can be used
      for (const move of movesArray) {
        if (move.stateKind === 'ready' && move.possibleMoves) {
          console.log('[DEBUG] Checking move for die value:', {
            dieValue: move.dieValue,
            possibleMovesCount: move.possibleMoves.length,
            possibleMoves: move.possibleMoves.map((pm) => ({
              origin:
                pm.origin.kind === 'point'
                  ? `point-${pm.origin.position.clockwise}`
                  : pm.origin.kind,
              destination:
                pm.destination.kind === 'point'
                  ? `point-${pm.destination.position.clockwise}`
                  : pm.destination.kind,
            })),
          })

          // Check if this checker can be used in any of the possible moves for this die value
          const matchingPossibleMoves = move.possibleMoves.filter(
            (possibleMove) => {
              // Compare by ID instead of object reference
              const matches = possibleMove.origin.id === container.id
              console.log('[DEBUG] Comparing origins:', {
                possibleMoveOriginId: possibleMove.origin.id,
                possibleMoveOrigin:
                  possibleMove.origin.kind === 'point'
                    ? `point-${possibleMove.origin.position.clockwise}`
                    : possibleMove.origin.kind,
                checkerContainerId: container.id,
                checkerContainer:
                  container.kind === 'point'
                    ? `point-${(container as any).position.clockwise}`
                    : container.kind,
                matches,
              })
              return matches
            }
          )

          console.log('[DEBUG] Matching possible moves:', {
            dieValue: move.dieValue,
            matchingCount: matchingPossibleMoves.length,
          })

          if (matchingPossibleMoves.length > 0) {
            availableMoves.push({
              ...move,
              possibleMoves: matchingPossibleMoves, // Only include the moves relevant to this checker
            })
          }
        }
      }

      console.log('[DEBUG] Available moves for checker:', {
        checkerId,
        availableMovesCount: availableMoves.length,
      })

      if (availableMoves.length === 0) {
        return {
          success: false,
          error:
            'No legal moves available for this checker with the current dice',
        }
      }

      // 6. If only one move possible, execute it using proper game state management
      if (availableMoves.length === 1) {
        const moveToExecute = availableMoves[0]
        const specificMove = moveToExecute.possibleMoves[0] // Use the first (and only) possible move

        console.log(
          `[DEBUG] Single move available: die ${
            moveToExecute.dieValue
          }, origin ${
            specificMove.origin.kind === 'point'
              ? 'point-' + specificMove.origin.position.clockwise
              : specificMove.origin.kind
          }`
        )

        return Move.executeRobotMove(game, specificMove.origin.id)
      }

      // 7. If multiple moves possible, check if robot or human player
      // Find the active player to check if it's a robot
      const activePlayer = game.players.find(
        (p) => p.color === game.activeColor
      )

      if (activePlayer?.isRobot) {
        // Robot player: auto-execute the first available move
        const moveToExecute = availableMoves[0]
        const specificMove = moveToExecute.possibleMoves[0]

        console.log(
          `[DEBUG] Robot auto-selecting move: die ${
            moveToExecute.dieValue
          }, origin ${
            specificMove.origin.kind === 'point'
              ? 'point-' + specificMove.origin.position.clockwise
              : specificMove.origin.kind
          }`
        )

        // For robots, execute the move directly using the existing game flow
        // This should properly update dice, active play, and all game state
        return Move.executeRobotMove(game, specificMove.origin.id)
      } else {
        // Human player: return multiple options for user to choose
        return {
          success: true,
          possibleMoves: availableMoves,
          game: game,
          error: 'Multiple moves possible. Please specify which move to make.',
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
    const homeBoard =
      player.direction === 'clockwise'
        ? [0, 1, 2, 3, 4, 5]
        : [18, 19, 20, 21, 22, 23]

    // Check if the current point is in home board
    const pointPosition =
      player.direction === 'clockwise'
        ? point.position.clockwise
        : point.position.counterclockwise

    if (!homeBoard.includes(pointPosition)) {
      return false
    }

    // Check if ALL player's checkers are in home board
    for (const boardPoint of board.points) {
      const boardPointPosition =
        player.direction === 'clockwise'
          ? boardPoint.position.clockwise
          : boardPoint.position.counterclockwise

      // If there are player's checkers outside home board, can't bear off
      if (!homeBoard.includes(boardPointPosition)) {
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
