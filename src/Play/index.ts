import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckerContainer,
  BackgammonCube,
  BackgammonDieValue,
  BackgammonMoveCompletedNoMove,
  BackgammonMoveCompletedWithMove,
  BackgammonMoveKind,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonMoveSkeleton,
  BackgammonPlayerMoving,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayStateKind,
} from '@nodots-llc/backgammon-types'
import { Board, generateId } from '..'
import { debug, logger } from '../utils/logger'
import {
  InvalidMoveSequenceError,
  MustUseBothDiceError,
  MustUseLargerDieError,
} from './errors'
export * from '../index'

const allowedMoveKinds = ['point-to-point', 'reenter', 'bear-off'] as const
type AllowedMoveKind = (typeof allowedMoveKinds)[number]
function isAllowedMoveKind(kind: any): kind is AllowedMoveKind {
  return allowedMoveKinds.includes(kind)
}

// Pure function types for immutable dice auto-switching
interface MoveExecutionPlan {
  readonly targetMoveId: string
  readonly effectiveDieValue: BackgammonDieValue
  readonly autoSwitched: boolean
  readonly originalDieValue: BackgammonDieValue
  readonly newDiceOrder: readonly [BackgammonDieValue, BackgammonDieValue]
  readonly updatedMoves: ReadonlyArray<BackgammonMoveReady>
  readonly matchingMove: any // The fresh move calculation result
}

interface ExecutionResult {
  readonly newPlay: BackgammonPlayMoving
  readonly newBoard: BackgammonBoard
  readonly completedMove: BackgammonMoveCompletedWithMove
  readonly executionPlan: MoveExecutionPlan
}

// PlayProps is now imported from @nodots-llc/backgammon-types

export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves = []
  board!: BackgammonBoard
  player!: BackgammonPlayerRolling | BackgammonPlayerMoving

  // Pure function: Plan the move execution without mutations
  private static planMoveExecution(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): MoveExecutionPlan {
    const movesArray = play.moves
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')

    if (readyMoves.length === 0) {
      throw new Error('No ready moves available')
    }

    // Get initial die values (no mutation)
    const firstDieValue = readyMoves[0].dieValue
    const otherMoves = readyMoves.filter((m) => m.dieValue !== firstDieValue)
    const secondDieValue =
      otherMoves.length > 0 ? otherMoves[0].dieValue : firstDieValue

    // Check for auto-switch opportunity
    const moveResult = Board.getPossibleMoves(
      board,
      play.player,
      firstDieValue,
      secondDieValue,
      origin
    ) as {
      moves: BackgammonMoveSkeleton[]
      usedDieValue: BackgammonDieValue
      autoSwitched: boolean
      originalDieValue: BackgammonDieValue
    }

    const matchingMove = moveResult.moves.find(
      (pm) => pm.origin.id === origin.id
    )
    if (!matchingMove) {
      throw new Error(
        `Invalid move: No legal moves available from origin ${origin.id}`
      )
    }

    // Prevent duplicate die usage validation (pure check)
    const currentRoll = play.player.dice.currentRoll
    const isDoubles = currentRoll[0] === currentRoll[1]
    const completedMoves = movesArray.filter((m) => m.stateKind === 'completed')
    const alreadyUsedDieValue = completedMoves.some(
      (m) => m.dieValue === moveResult.usedDieValue
    )

    if (!isDoubles && alreadyUsedDieValue) {
      throw new Error(
        `Die value ${moveResult.usedDieValue} has already been used in this turn. Available dice: [${currentRoll.join(', ')}]. This prevents invalid duplicate die usage.`
      )
    }

    // Plan new dice order (pure calculation)
    const newDiceOrder: [BackgammonDieValue, BackgammonDieValue] =
      moveResult.autoSwitched && currentRoll[0] !== currentRoll[1]
        ? [currentRoll[1], currentRoll[0]]
        : [currentRoll[0], currentRoll[1]]

    // Find target move: the move with the usedDieValue that contains this origin
    // For non-doubles: find by die value and origin match
    // For doubles: find the first move with this die value that has this origin
    const targetMove = readyMoves.find(
      (m) =>
        m.dieValue === moveResult.usedDieValue &&
        m.possibleMoves.some((pm) => pm.origin.id === origin.id)
    )

    if (!targetMove) {
      throw new Error(
        `No ready move found for die value ${moveResult.usedDieValue} from origin ${origin.id}`
      )
    }

    // Plan updated moves (pure calculation)
    // CRITICAL FIX: Do NOT change die values in moves
    // Moves keep their original die values from initialization
    // Only the dice order in player.dice.currentRoll changes
    const updatedMoves = readyMoves.filter((move) => {
      // Exclude the move that will be executed
      return move.id !== targetMove.id
    })

    debug('Play.planMoveExecution: Planning completed', {
      targetMoveId: targetMove.id,
      effectiveDieValue: moveResult.usedDieValue,
      autoSwitched: moveResult.autoSwitched,
      originalDieValue: moveResult.originalDieValue,
      newDiceOrder,
      updatedMovesCount: updatedMoves.length,
    })

    return {
      targetMoveId: targetMove.id,
      effectiveDieValue: moveResult.usedDieValue,
      autoSwitched: moveResult.autoSwitched,
      originalDieValue: moveResult.originalDieValue,
      newDiceOrder,
      updatedMoves,
      matchingMove,
    }
  }

  // Pure function: Execute the planned move
  private static executePlannedMove(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    plan: MoveExecutionPlan
  ): ExecutionResult {
    // Detect if a hit will occur before executing the move (pure check)
    let isHit = false
    if (plan.matchingMove.destination.kind === 'point') {
      const destination = Board.getCheckerContainer(
        board,
        plan.matchingMove.destination.id
      )
      if (
        destination.kind === 'point' &&
        destination.checkers.length === 1 &&
        destination.checkers[0].color !== play.player.color
      ) {
        isHit = true
        debug('Play.executePlannedMove: Hit detected', {
          destinationId: plan.matchingMove.destination.id,
          hitCheckerColor: destination.checkers[0].color,
          movingPlayerColor: play.player.color,
        })
      }
    }

    // Execute move on board (pure - returns new board)
    const newBoard = Board.moveChecker(
      board,
      plan.matchingMove.origin,
      plan.matchingMove.destination,
      play.player.direction
    )

    // Create completed move (pure)
    const completedMove: BackgammonMoveCompletedWithMove = {
      id: plan.targetMoveId,
      player: play.player,
      dieValue: plan.effectiveDieValue,
      stateKind: 'completed',
      moveKind: isAllowedMoveKind(
        plan.matchingMove.moveKind || 'point-to-point'
      )
        ? plan.matchingMove.moveKind || 'point-to-point'
        : 'point-to-point',
      possibleMoves: [],
      origin: plan.matchingMove.origin,
      destination: plan.matchingMove.destination,
      isHit: isHit,
    }

    // Update remaining moves with fresh possible moves based on new board state
    // CRITICAL: Preserve each move's original die value - don't reassign by index
    // The moves already know what die value they represent from initialization
    const updatedMovesWithCorrectDiceAndMoves = plan.updatedMoves.map(
      (move) => {
        // Use the move's existing die value (already correct from initialization)
        const dieValue = move.dieValue

        // Recalculate possible moves based on new board state
        const freshPossibleMoves = Board.getPossibleMoves(
          newBoard,
          play.player,
          dieValue
        ) as BackgammonMoveSkeleton[]

        if (freshPossibleMoves.length === 0) {
          // No moves possible - convert to completed no-move
          const noMove: BackgammonMoveCompletedNoMove = {
            id: move.id,
            player: move.player,
            dieValue: dieValue,
            stateKind: 'completed',
            moveKind: 'no-move',
            possibleMoves: [],
            isHit: false,
            origin: undefined,
            destination: undefined,
          }
          return noMove
        }

        // Update move with fresh possible moves (keep original die value)
        const firstPossibleMove = freshPossibleMoves[0]
        const updatedMove: BackgammonMoveReady = {
          ...move,
          dieValue: dieValue, // Keep original die value
          possibleMoves: freshPossibleMoves,
          moveKind:
            firstPossibleMove.destination.kind === 'off'
              ? 'bear-off'
              : firstPossibleMove.origin.kind === 'bar'
                ? 'reenter'
                : 'point-to-point',
        }
        return updatedMove
      }
    )

    const finalReadyMoves = updatedMovesWithCorrectDiceAndMoves.filter(
      (m) => m.stateKind === 'ready'
    )

    debug('Play.executePlannedMove: Updated remaining moves', {
      finalReadyMovesCount: finalReadyMoves.length,
      finalReadyDiceValues: finalReadyMoves.map((m) => m.dieValue),
    })

    // Create new play state (pure)
    // CRITICAL FIX: Include ALL existing completed moves (including no-moves from initialization)
    const existingCompletedMoves = play.moves.filter(
      (m) => m.stateKind === 'completed' && m.id !== plan.targetMoveId
    )
    const finalMoves = [
      ...existingCompletedMoves,
      ...updatedMovesWithCorrectDiceAndMoves,
      completedMove,
    ]
    const allMovesCompleted = finalMoves.every(
      (m) => m.stateKind === 'completed'
    )

    // Properly construct the new play object
    const newPlay: BackgammonPlayMoving = {
      ...play,
      moves: finalMoves,
      board: newBoard,
      stateKind: 'moving', // Always return 'moving' - caller handles transition to 'moved'
      player: {
        ...play.player,
        dice: {
          ...play.player.dice,
          currentRoll: [...plan.newDiceOrder] as [
            BackgammonDieValue,
            BackgammonDieValue,
          ],
        },
      },
    }

    debug('Play.executePlannedMove: Execution completed', {
      targetMoveId: plan.targetMoveId,
      newBoardState: 'updated',
      allMovesCompleted,
      finalMovesCount: finalMoves.length,
    })

    return {
      newPlay,
      newBoard,
      completedMove,
      executionPlan: plan,
    }
  }

  // Pure main function: Orchestrates the entire move process
  public static pureMove = function pureMove(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): BackgammonPlayResult {
    // Handle no-move case (pure)
    const movesArray = play.moves
    const anyReadyMove = movesArray.find((m) => m.stateKind === 'ready')
    if (!anyReadyMove) {
      debug('Play.pureMove: No ready moves found in activePlay.moves')
      const noMove: BackgammonMoveCompletedNoMove = {
        id: generateId(),
        player: play.player,
        dieValue: play.player.dice.currentRoll[0],
        stateKind: 'completed',
        moveKind: 'no-move',
        possibleMoves: [],
        isHit: false,
        origin: undefined,
        destination: undefined,
      }
      return {
        play: { ...play, moves: [noMove] },
        board,
        move: noMove,
      } as BackgammonPlayResult
    }

    // Step 1: Plan the execution (pure)
    const plan = Play.planMoveExecution(board, play, origin)

    // Step 2: Execute the plan (pure)
    const result = Play.executePlannedMove(board, play, plan)

    // Step 3: Validate the result if sequence is complete (pure)
    // FIX: Never validate during individual move execution when play has pre-completed no-moves
    // Only validate when all dice have been rolled and used, not when executing partial sequences
    const originalHadNoMoves = play.moves.some(
      (m) => m.moveKind === 'no-move'
    )
    const resultHasReadyMoves = result.newPlay.moves.some(
      (m) => m.stateKind === 'ready'
    )

    // Only validate if:
    // 1. No ready moves remain in result AND
    // 2. No pre-completed no-moves existed (meaning this is a fresh complete sequence)

    if (!resultHasReadyMoves && !originalHadNoMoves) {
      const validation = Play.validateMoveSequence(
        result.newBoard,
        result.newPlay
      )
      if (!validation.isValid) {
        // Sequence violates backgammon rules - throw appropriate error
        if (validation.error?.includes('both dice')) {
          throw MustUseBothDiceError(
            `${validation.error}. Alternative sequences exist that would use both dice.`
          )
        } else if (validation.error?.includes('larger die')) {
          throw MustUseLargerDieError(
            `${validation.error}. The larger die value must be used when only one die can be played.`
          )
        } else {
          throw InvalidMoveSequenceError(
            `Invalid move sequence: ${validation.error}`
          )
        }
      }

      // Update play stateKind to 'moved' when no ready moves remain
      // This preserves all moves including no-moves
      const finalPlay: BackgammonPlayMoving = {
        ...result.newPlay,
        stateKind: 'moved' as any, // Need to cast since 'moved' isn't in BackgammonPlayMoving type
      }

      return {
        play: finalPlay,
        board: result.newBoard,
        move: result.completedMove,
        autoSwitched: plan.autoSwitched,
        originalDieValue: plan.originalDieValue,
        usedDieValue: plan.effectiveDieValue,
      } as BackgammonPlayResult
    }

    // Return immutable result with play still in 'moving' state
    return {
      play: result.newPlay,
      board: result.newBoard,
      move: result.completedMove,
      autoSwitched: plan.autoSwitched,
      originalDieValue: plan.originalDieValue,
      usedDieValue: plan.effectiveDieValue,
    } as BackgammonPlayResult
  }

  public static move = function move(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): BackgammonPlayResult {
    // Delegate to pure function implementation to fix dice auto-switching bugs
    return Play.pureMove(board, play, origin)
  }

  // Helper: Partition moves into reentry vs regular based on bar state
  private static partitionMovesForBarReentry(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving,
    diceValues: BackgammonDieValue[]
  ): {
    reentryMoves: BackgammonMoveReady[]
    regularDiceValues: BackgammonDieValue[]
  } {
    const bar =
      player.direction === 'clockwise'
        ? board.bar.clockwise
        : board.bar.counterclockwise
    const checkersOnBar = bar.checkers.filter(
      (c) => c.color === player.color
    ).length

    if (checkersOnBar === 0) {
      return { reentryMoves: [], regularDiceValues: diceValues }
    }

    const reentryMoves: BackgammonMoveReady[] = []
    const regularDiceValues: BackgammonDieValue[] = []

    for (const dieValue of diceValues) {
      // Stop creating reentry moves once we've planned for all checkers on bar
      if (reentryMoves.length >= checkersOnBar) {
        regularDiceValues.push(dieValue)
        continue
      }

      const possibleMoves = Board.getPossibleMoves(
        board,
        player,
        dieValue
      ) as BackgammonMoveSkeleton[]

      if (possibleMoves.length > 0 && possibleMoves[0].origin.kind === 'bar') {
        // This die can reenter
        reentryMoves.push({
          id: generateId(),
          player,
          dieValue,
          stateKind: 'ready',
          moveKind: 'reenter',
          possibleMoves,
        })
      } else {
        // This die cannot reenter - will be evaluated for regular moves after reentry
        regularDiceValues.push(dieValue)
      }
    }

    return { reentryMoves, regularDiceValues }
  }

  // Helper: Simulate executing moves on a board
  private static simulateMoves(
    board: BackgammonBoard,
    moves: BackgammonMoveReady[],
    direction: 'clockwise' | 'counterclockwise'
  ): BackgammonBoard {
    let simulatedBoard = board

    for (const move of moves) {
      if (move.possibleMoves.length > 0) {
        const firstMove = move.possibleMoves[0]
        simulatedBoard = Board.moveChecker(
          simulatedBoard,
          firstMove.origin,
          firstMove.destination,
          direction
        )
      }
    }

    return simulatedBoard
  }

  // Helper: Create moves for given dice values on given board
  private static createMovesForDiceValues(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving,
    diceValues: BackgammonDieValue[]
  ): Array<BackgammonMoveReady | BackgammonMoveCompletedNoMove> {
    return diceValues.map((dieValue) => {
      const possibleMoves = Board.getPossibleMoves(
        board,
        player,
        dieValue
      ) as BackgammonMoveSkeleton[]

      if (possibleMoves.length === 0) {
        return {
          id: generateId(),
          player,
          dieValue,
          stateKind: 'completed',
          moveKind: 'no-move',
          possibleMoves: [],
          origin: undefined,
          destination: undefined,
          isHit: false,
        } as BackgammonMoveCompletedNoMove
      }

      const firstMove = possibleMoves[0]
      const moveKind =
        firstMove.destination.kind === 'off'
          ? 'bear-off'
          : firstMove.origin.kind === 'bar'
            ? 'reenter'
            : 'point-to-point'

      return {
        id: generateId(),
        player,
        dieValue,
        stateKind: 'ready',
        moveKind,
        possibleMoves,
      } as BackgammonMoveReady
    })
  }

  public static initialize = function initialize(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): BackgammonPlayMoving {
    const roll = player.dice.currentRoll
    const isDoubles = roll[0] === roll[1]
    const diceToProcess = isDoubles
      ? [roll[0], roll[0], roll[0], roll[0]]
      : [roll[0], roll[1]]

    // Step 1: Separate bar reentry moves from regular moves
    const { reentryMoves, regularDiceValues } =
      Play.partitionMovesForBarReentry(board, player, diceToProcess)

    // Step 2: Create simulated board after all reentries
    const boardAfterReentries = Play.simulateMoves(
      board,
      reentryMoves,
      player.direction
    )

    // Step 3: Create regular moves using simulated board
    const regularMoves = Play.createMovesForDiceValues(
      boardAfterReentries,
      player,
      regularDiceValues
    )

    // Step 4: Combine all moves
    const allMoves = [...reentryMoves, ...regularMoves]

    // Check if all moves are no-moves and auto-complete the play
    const allMovesAreNoMoves = allMoves.every(
      (move) => move.moveKind === 'no-move'
    )

    if (allMovesAreNoMoves) {
      debug(
        'Play.initialize: Auto-completing play - no legal moves available for any die value'
      )

      // Convert all moves to completed no-moves
      const completedMoves = allMoves.map((move) => ({
        ...move,
        stateKind: 'completed' as const,
        moveKind: 'no-move' as const,
        possibleMoves: [],
        isHit: false,
        origin: undefined,
        destination: undefined,
      }))

      return {
        id: generateId(),
        board,
        player,
        moves: completedMoves,
        stateKind: 'moving',
      } as BackgammonPlayMoving
    }

    return {
      id: generateId(),
      board,
      player,
      moves: allMoves,
      stateKind: 'moving',
    } as BackgammonPlayMoving
  }

  public static startMove = function startMove(
    play: BackgammonPlayMoving
  ): BackgammonPlayMoving {
    logger.debug('[Play] Starting move:', {
      playId: play.id,
      playerColor: play.player.color,
      playerState: play.player.stateKind,
      movesCount: play.moves.length,
      stateKind: play.stateKind,
    })
    return {
      ...play,
      stateKind: 'moving',
      player: { ...play.player, stateKind: 'moving' },
      moves: [...play.moves],
    } as BackgammonPlayMoving
  }

  /**
   * Validates if a move from the specified origin is legal
   * Returns true if the origin has valid moves, false otherwise
   * This is a defensive check to prevent invalid move attempts
   */
  static canMoveFrom(
    play: BackgammonPlayMoving,
    board: BackgammonBoard,
    origin: BackgammonCheckerContainer
  ): boolean {
    // Check if play is active and has moves
    if (!play || !play.moves || play.moves.length === 0) {
      debug('Play.canMoveFrom: No active play or moves')
      return false
    }

    // Check if any moves are ready
    const movesArray = play.moves
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')
    if (readyMoves.length === 0) {
      debug('Play.canMoveFrom: No ready moves available')
      return false
    }

    // Get fresh possible moves with intelligent dice switching
    const dieValue = readyMoves[0].dieValue
    const otherReadyMoves = readyMoves.filter((m) => m.dieValue !== dieValue)
    const otherDieValue =
      otherReadyMoves.length > 0 ? otherReadyMoves[0].dieValue : dieValue

    const moveResult = Board.getPossibleMoves(
      board,
      play.player,
      dieValue,
      otherDieValue
    ) as {
      moves: BackgammonMoveSkeleton[]
      usedDieValue: BackgammonDieValue
      autoSwitched: boolean
      originalDieValue: BackgammonDieValue
    }

    // Check if the origin has any valid moves
    const hasValidMove = moveResult.moves.some((m) => m.origin.id === origin.id)

    debug('Play.canMoveFrom: Validation result', {
      originId: origin.id,
      hasValidMove,
      validOrigins: moveResult.moves.map((m) => m.origin.id),
    })

    return hasValidMove
  }

  /**
   * Returns the list of valid origin container IDs that have legal moves
   * This can be used by UI to highlight or enable only valid checkers
   */
  static getValidOrigins(
    play: BackgammonPlayMoving,
    board: BackgammonBoard
  ): string[] {
    // Check if play is active and has moves
    if (!play || !play.moves || play.moves.length === 0) {
      return []
    }

    // Check if any moves are ready
    const movesArray = play.moves
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')
    if (readyMoves.length === 0) {
      return []
    }

    // Get fresh possible moves with intelligent dice switching
    const dieValue = readyMoves[0].dieValue
    const otherReadyMoves = readyMoves.filter((m) => m.dieValue !== dieValue)
    const otherDieValue =
      otherReadyMoves.length > 0 ? otherReadyMoves[0].dieValue : dieValue

    const moveResult = Board.getPossibleMoves(
      board,
      play.player,
      dieValue,
      otherDieValue
    ) as {
      moves: BackgammonMoveSkeleton[]
      usedDieValue: BackgammonDieValue
      autoSwitched: boolean
      originalDieValue: BackgammonDieValue
    }

    // Return unique origin IDs
    const uniqueOrigins = new Set(moveResult.moves.map((m) => m.origin.id))
    return Array.from(uniqueOrigins)
  }

  /**
   * Validates if a move sequence violates mandatory dice usage rules
   * According to backgammon rules:
   * 1. A player MUST use both dice if legally possible
   * 2. If only one die can be used, the player MUST use the larger value if possible
   * 3. A player cannot voluntarily forfeit the use of a die if there's a legal move
   */
  static validateMoveSequence(
    board: BackgammonBoard,
    play: BackgammonPlayMoving
  ): { isValid: boolean; error?: string; alternativeSequences?: any[] } {
    if (!play.moves || play.moves.length === 0) {
      return { isValid: true }
    }

    const movesArray = play.moves

    // Get completed and ready moves from the current sequence
    const completedMoves = movesArray.filter((m) => m.stateKind === 'completed')
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')

    // If there are still ready moves, the sequence is not complete yet
    if (readyMoves.length > 0) {
      return { isValid: true } // Validation happens when sequence is complete
    }

    // All moves are completed - validate the sequence
    const nonNoMoves = completedMoves.filter((m) => m.moveKind !== 'no-move')
    const noMoves = completedMoves.filter((m) => m.moveKind === 'no-move')

    // If all moves were used (no no-moves), the sequence is valid
    if (noMoves.length === 0) {
      return { isValid: true }
    }

    // Check if there was an alternative sequence that would use more dice
    const alternativeSequences = Play.findAlternativeSequences(board, play)

    const currentDiceUsed = nonNoMoves.length
    const maxPossibleDiceUsed = Math.max(
      currentDiceUsed,
      ...alternativeSequences.map((seq) => seq.diceUsed)
    )

    // Rule violation: alternative sequence could use more dice
    if (maxPossibleDiceUsed > currentDiceUsed) {
      const betterSequence = alternativeSequences.find(
        (seq) => seq.diceUsed === maxPossibleDiceUsed
      )

      if (maxPossibleDiceUsed === 2 && currentDiceUsed === 1) {
        return {
          isValid: false,
          error: 'Must use both dice when legally possible',
          alternativeSequences: [betterSequence],
        }
      } else if (currentDiceUsed === 1) {
        // Check if larger die could have been used
        const completedMove = nonNoMoves[0]
        const availableDice = movesArray.map((m) => m.dieValue)
        const largerDie = Math.max(...availableDice)

        if (completedMove.dieValue < largerDie) {
          return {
            isValid: false,
            error: 'Must use larger die when only one die can be used',
            alternativeSequences: [betterSequence],
          }
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Determines if both dice can be legally used from the current board state
   * Analyzes all possible move sequences using activePlay.moves
   */
  static canUseBothDice(
    board: BackgammonBoard,
    play: BackgammonPlayMoving
  ): boolean {
    if (!play.moves || play.moves.length === 0) {
      return false
    }

    const movesArray = play.moves
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')

    // Need at least 2 ready moves to use both dice
    if (readyMoves.length < 2) {
      return false
    }

    // Get unique die values from ready moves
    const dieValues = [...new Set(readyMoves.map((m) => m.dieValue))]

    // For doubles, we might have 4 moves with same die value
    if (dieValues.length === 1) {
      // Check if at least 2 moves have possibleMoves
      return (
        readyMoves.filter((m) => m.possibleMoves && m.possibleMoves.length > 0)
          .length >= 2
      )
    }

    // For mixed rolls, check if moves exist for both die values
    return dieValues.every((dieValue) => {
      const movesForDie = readyMoves.filter((m) => m.dieValue === dieValue)
      return movesForDie.some(
        (m) => m.possibleMoves && m.possibleMoves.length > 0
      )
    })
  }

  /**
   * Finds alternative move sequences that could use more dice
   * Uses activePlay.moves structure to simulate different sequences
   */
  static findAlternativeSequences(
    board: BackgammonBoard,
    play: BackgammonPlayMoving
  ): Array<{ sequence: any[]; diceUsed: number }> {
    if (!play.moves || play.moves.length === 0) {
      return []
    }

    const movesArray = play.moves
    const allSequences: Array<{ sequence: any[]; diceUsed: number }> = []

    // CRITICAL FIX: Actually test both dice usage by trying all possible move sequences
    // This replaces the incomplete stub implementation that caused the validation bug

    // Get all unique dice values from the moves
    const diceValues = movesArray
      .map((m) => m.dieValue)
      .filter((v, i, arr) => arr.indexOf(v) === i)

    if (diceValues.length >= 2) {
      // Test both possible orders: first die then second die, and second die then first die
      const maxUsable1 = this.testSequenceDiceUsage(board, play, [
        diceValues[0],
        diceValues[1],
      ])
      const maxUsable2 = this.testSequenceDiceUsage(board, play, [
        diceValues[1],
        diceValues[0],
      ])

      if (maxUsable1 > 0) {
        allSequences.push({ sequence: [], diceUsed: maxUsable1 })
      }
      if (maxUsable2 > 0 && maxUsable2 !== maxUsable1) {
        allSequences.push({ sequence: [], diceUsed: maxUsable2 })
      }
    } else if (diceValues.length === 1) {
      // Doubles case - test how many of the same die can be used
      const doublesUsable = this.testSequenceDiceUsage(board, play, [
        diceValues[0],
        diceValues[0],
        diceValues[0],
        diceValues[0],
      ])
      if (doublesUsable > 0) {
        allSequences.push({ sequence: [], diceUsed: doublesUsable })
      }
    }

    return allSequences
  }

  /**
   * Test how many dice can actually be used by trying to execute moves in sequence
   * This is the proper implementation that was missing, causing validation to fail
   */
  private static testSequenceDiceUsage(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    diceSequence: BackgammonDieValue[]
  ): number {
    const clonePlay = (
      sourcePlay: BackgammonPlayMoving
    ): BackgammonPlayMoving => {
      return JSON.parse(JSON.stringify(sourcePlay))
    }

    const cloneBoard = (sourceBoard: BackgammonBoard): BackgammonBoard => {
      return JSON.parse(JSON.stringify(sourceBoard))
    }

    const exploreSequence = (
      currentBoard: BackgammonBoard,
      currentPlay: BackgammonPlayMoving,
      remainingDice: BackgammonDieValue[]
    ): number => {
      if (remainingDice.length === 0) {
        return 0
      }

      let maxDiceUsed = 0
      const [currentDie, ...restDice] = remainingDice

      const movesArray = currentPlay.moves
      const readyMoves = movesArray.filter(
        (m) =>
          m.stateKind === 'ready' &&
          m.dieValue === currentDie &&
          Array.isArray(m.possibleMoves) &&
          m.possibleMoves.length > 0
      )

      if (readyMoves.length === 0) {
        return 0
      }

      for (const readyMove of readyMoves) {
        const possibleMoves =
          readyMove.possibleMoves as BackgammonMoveSkeleton[]

        for (const moveSkeleton of possibleMoves) {
          if (!moveSkeleton.origin?.id) {
            continue
          }

          try {
            const boardClone = cloneBoard(currentBoard)
            const playClone = clonePlay(currentPlay)

            const originOnCloneCandidate = Board.getCheckerContainer(
              boardClone,
              moveSkeleton.origin.id
            )

            if (
              originOnCloneCandidate.kind !== 'point' &&
              originOnCloneCandidate.kind !== 'bar'
            ) {
              continue
            }

            const originOnClone = originOnCloneCandidate as BackgammonMoveOrigin

            const moveResult = Play.pureMove(
              boardClone,
              playClone,
              originOnClone
            )
            const nextPlay = moveResult.play as BackgammonPlayMoving
            const nextBoard = moveResult.board

            const diceUsedInBranch =
              1 + exploreSequence(nextBoard, nextPlay, restDice)

            if (diceUsedInBranch > maxDiceUsed) {
              maxDiceUsed = diceUsedInBranch

              if (maxDiceUsed === remainingDice.length) {
                return maxDiceUsed
              }
            }
          } catch (error) {
            // Ignore branches that fail due to invalid simulated moves
            continue
          }
        }
      }

      return maxDiceUsed
    }

    const startingBoard = cloneBoard(board)
    const startingPlay = clonePlay(play)

    return exploreSequence(startingBoard, startingPlay, diceSequence.slice())
  }

  /**
   * Returns the mandatory move sequence when backgammon rules dictate a specific sequence
   * This enforces rules like "must use both dice" and "must use larger die"
   */
  static getMandatoryMoveSequence(
    board: BackgammonBoard,
    play: BackgammonPlayMoving
  ): { isMandatory: boolean; sequence?: any[]; reason?: string } {
    // FIX: Only validate when sequence is complete (no ready moves)
    // This prevents validation of incomplete sequences, matching pureMove() behavior
    const hasReadyMoves = play.moves.some(
      (m) => m.stateKind === 'ready'
    )
    if (hasReadyMoves) {
      return { isMandatory: false } // Don't validate incomplete sequences
    }

    const validation = Play.validateMoveSequence(board, play)

    if (validation.isValid) {
      return { isMandatory: false }
    }

    // Return the alternative sequence that uses more dice
    if (
      validation.alternativeSequences &&
      validation.alternativeSequences.length > 0
    ) {
      return {
        isMandatory: true,
        sequence: validation.alternativeSequences[0].sequence,
        reason: validation.error,
      }
    }

    return { isMandatory: false }
  }
}
