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
  deserializeGameState,
  serializeGameState,
} from '../utils/serialization'
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
  moves?: BackgammonMoves = new Set()
  board!: BackgammonBoard
  player!: BackgammonPlayerRolling | BackgammonPlayerMoving

  // Pure function: Plan the move execution without mutations
  private static planMoveExecution(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): MoveExecutionPlan {
    const movesArray = Array.from(play.moves)
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

    // Find target move using ORIGINAL die values (before any reordering)
    const targetMove = readyMoves.find(
      (m) =>
        m.dieValue ===
        (moveResult.autoSwitched
          ? moveResult.originalDieValue
          : moveResult.usedDieValue)
    )

    if (!targetMove) {
      throw new Error(
        `No ready move found for die value ${moveResult.usedDieValue}`
      )
    }

    // Plan updated moves with new die values (pure calculation)
    // CRITICAL FIX: Use filter instead of map + filter to prevent move loss
    const updatedMoves = readyMoves
      .filter((move) => {
        // Exclude the move that will be executed
        return move.id !== targetMove.id
      })
      .map((move) => {
        if (moveResult.autoSwitched && currentRoll[0] !== currentRoll[1]) {
          // Calculate new die value for remaining moves
          const newDieValue =
            move.dieValue === moveResult.originalDieValue
              ? moveResult.usedDieValue
              : move.dieValue === moveResult.usedDieValue
                ? moveResult.originalDieValue
                : move.dieValue

          // CRITICAL FIX: Recalculate possibleMoves for the new die value
          // Don't just update dieValue - the possibleMoves and origin may be completely different
          const freshPossibleMoves = Board.getPossibleMoves(
            board,
            play.player,
            newDieValue
          ) as BackgammonMoveSkeleton[]

          if (freshPossibleMoves.length === 0) {
            // No moves possible with new die value - convert to no-move
            // Keep original origin for type safety, but mark as no-move
            return {
              ...move,
              dieValue: newDieValue,
              stateKind: 'ready' as const,
              moveKind: 'no-move' as const,
              possibleMoves: [],
            }
          }

          // Use first available move as the new move definition
          const firstPossibleMove = freshPossibleMoves[0]
          const moveKind =
            firstPossibleMove.destination.kind === 'off'
              ? 'bear-off'
              : firstPossibleMove.origin.kind === 'bar'
                ? 'reenter'
                : 'point-to-point'
          return {
            ...move,
            dieValue: newDieValue,
            possibleMoves: freshPossibleMoves,
            origin: firstPossibleMove.origin,
            moveKind: moveKind as BackgammonMoveKind, // Explicit casting as comment requires
          }
        }

        return move
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

    // Calculate remaining available dice after move completion
    // We need to look at ALL moves in the play to see what has been used so far
    const existingMoves = Array.from(play.moves)
    const allMovesAfterExecution = [
      ...existingMoves.filter((m) => m.id !== plan.targetMoveId),
      completedMove,
    ]
    const completedMoves = allMovesAfterExecution.filter(
      (m) => m.stateKind === 'completed'
    )
    const usedDiceValues = completedMoves.map((m) => m.dieValue)
    const originalRoll = play.player.dice.currentRoll
    const isDoubles = originalRoll[0] === originalRoll[1]

    // Calculate remaining available dice values
    const availableDiceValues: BackgammonDieValue[] = isDoubles
      ? Array(4 - usedDiceValues.length).fill(originalRoll[0])
      : originalRoll.filter((die) => !usedDiceValues.includes(die))

    // Update remaining moves with correct die values and fresh possible moves
    const updatedMovesWithCorrectDiceAndMoves = plan.updatedMoves.map(
      (move, index) => {
        // Assign correct die value from available dice
        const correctDieValue =
          index < availableDiceValues.length
            ? availableDiceValues[index]
            : undefined

        if (!correctDieValue) {
          // No more dice available - convert to completed no-move
          const noMove: BackgammonMoveCompletedNoMove = {
            id: move.id,
            player: move.player,
            dieValue: move.dieValue, // Keep original die value for tracking
            stateKind: 'completed',
            moveKind: 'no-move',
            possibleMoves: [],
            isHit: false,
            origin: undefined,
            destination: undefined,
          }
          return noMove
        }

        // Recalculate possible moves with correct die value
        const freshPossibleMoves = Board.getPossibleMoves(
          newBoard,
          play.player,
          correctDieValue
        ) as BackgammonMoveSkeleton[]

        if (freshPossibleMoves.length === 0) {
          // No moves possible - convert to completed no-move
          const noMove: BackgammonMoveCompletedNoMove = {
            id: move.id,
            player: move.player,
            dieValue: correctDieValue,
            stateKind: 'completed',
            moveKind: 'no-move',
            possibleMoves: [],
            isHit: false,
            origin: undefined,
            destination: undefined,
          }
          return noMove
        }

        // Update move with correct die value and fresh possible moves
        const firstPossibleMove = freshPossibleMoves[0]
        const updatedMove: BackgammonMoveReady = {
          ...move,
          dieValue: correctDieValue,
          possibleMoves: freshPossibleMoves,
          origin: firstPossibleMove.origin,
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

    // Validation: Ensure no duplicate die usage in remaining ready moves
    const finalReadyMoves = updatedMovesWithCorrectDiceAndMoves.filter(
      (m) => m.stateKind === 'ready'
    )
    const readyDiceValues = finalReadyMoves.map((m) => m.dieValue)
    const uniqueReadyDice = new Set(readyDiceValues)

    if (!isDoubles && readyDiceValues.length !== uniqueReadyDice.size) {
      throw new Error(
        `Duplicate die values in remaining moves: ${readyDiceValues.join(', ')}`
      )
    }

    debug('Play.executePlannedMove: Updated remaining moves', {
      originalRoll: originalRoll,
      usedDiceValues: usedDiceValues,
      availableDiceValues: availableDiceValues,
      finalReadyMovesCount: finalReadyMoves.length,
      finalReadyDiceValues: readyDiceValues,
    })

    // Create new play state (pure)
    // CRITICAL FIX: Include ALL existing completed moves (including no-moves from initialization)
    const existingCompletedMoves = Array.from(play.moves).filter(
      (m) => m.stateKind === 'completed' && m.id !== plan.targetMoveId
    )
    const finalMoves = new Set([
      ...existingCompletedMoves,
      ...updatedMovesWithCorrectDiceAndMoves,
      completedMove,
    ])
    const allMovesCompleted = Array.from(finalMoves).every(
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
      finalMovesCount: finalMoves.size,
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
    const movesArray = Array.from(play.moves)
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
        play: { ...play, moves: new Set([noMove]) },
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
    const originalHadNoMoves = Array.from(play.moves).some(
      (m) => m.moveKind === 'no-move'
    )
    const resultHasReadyMoves = Array.from(result.newPlay.moves).some(
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

  public static initialize = function initialize(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving
  ): BackgammonPlayMoving {
    const roll = player.dice.currentRoll
    const movesArr: BackgammonMoveReady[] = []

    // Check if player has checkers on the bar
    const bar =
      player.direction === 'clockwise'
        ? board.bar.clockwise
        : board.bar.counterclockwise
    const playerCheckersOnBar = bar.checkers.filter(
      (checker: BackgammonChecker) => checker.color === player.color
    )

    const isDoubles = roll[0] === roll[1]
    const moveCount = isDoubles ? 4 : 2
    let barCheckersLeft = playerCheckersOnBar.length

    // For doubles, we need to track which origins we've used to distribute moves properly
    const usedOrigins = new Map<string, number>() // originId -> count

    // 🔧 CRITICAL BUG FIX: Track which die values have been used for bar reentry
    // This prevents both checkers from reentering using the same effective die value
    const usedBarReentryDice = new Set<number>()

    // Track which dice have been used to avoid duplicates
    const usedDiceValues = new Set<number>()

    // CRITICAL BUG FIX: Ensure each die value is used exactly once for mixed rolls
    // For mixed rolls, we create exactly one move per unique die value
    const diceToProcess = isDoubles
      ? [roll[0], roll[0], roll[0], roll[0]]
      : [roll[0], roll[1]]

    for (let i = 0; i < moveCount; i++) {
      let dieValue = diceToProcess[i]

      // CRITICAL FIX: For mixed rolls, each move must use a unique die value
      // Don't skip or create no-moves for already used die values in mixed rolls
      // The dice tracking logic handles this correctly below

      // Check if there are checkers on bar that need this die value
      const playerCheckersOnBarCount = bar.checkers.filter(
        (c) => c.color === player.color
      ).length
      const barReentryMovesAlreadyPlanned = movesArr.filter(
        (m) => m.moveKind === 'reenter'
      ).length

      // CRITICAL FIX: For mixed rolls, only plan ONE bar reentry move per checker on bar
      // After the first bar reentry move is executed, remaining dice should be used for normal moves
      const checkerNeedsReentry =
        playerCheckersOnBarCount > 0 &&
        barReentryMovesAlreadyPlanned < playerCheckersOnBarCount

      if (checkerNeedsReentry) {
        // Check if this specific die value can be used for reentry
        // For mixed rolls: only if die value hasn't been used for bar reentry yet
        // For doubles: allow multiple uses, but respect checker count limit (handled above)
        if (!usedBarReentryDice.has(dieValue) || isDoubles) {
          const possibleMoves = Board.getPossibleMoves(
            board,
            player,
            dieValue
          ) as BackgammonMoveSkeleton[]

          if (possibleMoves.length > 0) {
            // Reentry is possible with this die value
            movesArr.push({
              id: generateId(),
              player,
              dieValue,
              stateKind: 'ready',
              moveKind: 'reenter',
              possibleMoves: possibleMoves,
              origin: bar,
            })

            // Mark this die value as used for bar reentry (only for mixed rolls)
            if (!isDoubles) {
              usedBarReentryDice.add(dieValue)
              usedDiceValues.add(dieValue)
            }
          } else {
            // No reentry possible with this die value
            const noMove: BackgammonMoveCompletedNoMove = {
              id: generateId(),
              player,
              dieValue,
              stateKind: 'completed',
              moveKind: 'no-move',
              possibleMoves: [],
              origin: undefined,
              destination: undefined,
              isHit: false,
            }
            movesArr.push(noMove as any)
            // Mark die as used even for no-move
            if (!isDoubles) {
              usedDiceValues.add(dieValue)
            }
          }
        } else {
          // Die value already used for reentry - all checkers needing reentry are handled
          // Continue to regular move generation (fall through to else block)
        }
      } else {
        // No checkers on the bar OR all bar checkers have been planned for reentry
        // CRITICAL FIX: Use simulated board state that accounts for planned reentries

        // Create a simulated board state that includes the effects of any planned reentry moves
        let simulatedBoard = board
        const plannedReentryMoves = movesArr.filter(
          (m) => m.moveKind === 'reenter'
        )

        if (plannedReentryMoves.length > 0) {
          // Simulate the board state after planned reentries
          for (const reentryMove of plannedReentryMoves) {
            if (reentryMove.possibleMoves.length > 0) {
              const firstPossibleMove = reentryMove.possibleMoves[0]
              // Simulate moving a checker from bar to the landing point
              simulatedBoard = Board.moveChecker(
                simulatedBoard,
                firstPossibleMove.origin,
                firstPossibleMove.destination,
                player.direction
              )
            }
          }
        }

        // Calculate possible moves using the simulated board state
        const possibleMoves = Board.getPossibleMoves(
          simulatedBoard,
          player,
          dieValue
        ) as BackgammonMoveSkeleton[]

        // CRITICAL FIX: Do NOT mutate player.dice.currentRoll during initialization loop
        // This was causing duplicate die values when reentry + normal moves were mixed
        // The dice swapping should happen after all moves are created, not during the loop

        if (possibleMoves.length > 0) {
          // 🔧 CRITICAL FIX: For doubles, distribute moves across available origins
          // instead of always using the first possible move's origin
          let selectedMove = possibleMoves[0] // Default to first move

          if (isDoubles && possibleMoves.length > 1) {
            // For doubles, try to find an origin that hasn't been used too much
            // This ensures moves are distributed across available positions
            const availableMoves = possibleMoves.filter((move) => {
              const originId = move.origin.id
              const currentCount = usedOrigins.get(originId) || 0

              // For doubles, we want to distribute moves, but still allow multiple moves
              // from the same origin if there are enough checkers there
              if (move.origin.kind === 'point') {
                const origin = move.origin as any
                const checkersAtOrigin = origin.checkers.filter(
                  (c: any) => c.color === player.color
                ).length

                // Allow up to the number of checkers available at this origin
                return currentCount < checkersAtOrigin
              }

              // For bar moves, allow multiple moves from bar
              return currentCount < 4 // Max 4 for doubles
            })

            if (availableMoves.length > 0) {
              // Use the first available move that hasn't been overused
              selectedMove = availableMoves[0]
            } else {
              // Fallback to first move if all origins are saturated
              selectedMove = possibleMoves[0]
            }
          }

          // Track usage of this origin
          const originId = selectedMove.origin.id
          usedOrigins.set(originId, (usedOrigins.get(originId) || 0) + 1)

          // 🐛 BUG FIX: Determine moveKind based on the specific selectedMove, not all possible moves
          // This prevents point-to-point moves from being incorrectly classified as bear-off
          let moveKind: 'point-to-point' | 'bear-off' | 'reenter' =
            'point-to-point'

          if (selectedMove.destination.kind === 'off') {
            moveKind = 'bear-off'
          } else if (selectedMove.origin.kind === 'bar') {
            moveKind = 'reenter'
          } else {
            moveKind = 'point-to-point'
          }

          movesArr.push({
            id: generateId(),
            player,
            dieValue: dieValue, // CRITICAL FIX: Use original die value, not effective die value
            stateKind: 'ready',
            moveKind,
            possibleMoves: possibleMoves, // Store all possible moves
            origin: selectedMove.origin, // Use the selected move's origin
          })

          // Track that this die value has been used
          if (!isDoubles) {
            usedDiceValues.add(dieValue) // CRITICAL FIX: Track original die value
          }
        } else {
          // No possible moves for this die (even with switching) - mark as completed no-move
          const noMove: BackgammonMoveCompletedNoMove = {
            id: generateId(),
            player,
            dieValue: dieValue, // CRITICAL FIX: Use original die value, not effective die value
            stateKind: 'completed',
            moveKind: 'no-move',
            possibleMoves: [], // No moves possible
            origin: undefined,
            destination: undefined,
            isHit: false,
          }
          movesArr.push(noMove as any) // Type assertion needed for mixed array
          // Track that this die value has been used even for no-move
          if (!isDoubles) {
            usedDiceValues.add(dieValue) // CRITICAL FIX: Track original die value
          }
        }
      }
    }

    // Check if all moves are no-moves and auto-complete the play
    const allMovesAreNoMoves = movesArr.every(
      (move) => move.moveKind === 'no-move'
    )

    if (allMovesAreNoMoves) {
      debug(
        'Play.initialize: Auto-completing play - no legal moves available for any die value'
      )

      // TODO: Consider calling Game.roll() as part of Play.initialize() to handle
      // the full game state transition when no moves are available. This would
      // eliminate the need to handle this edge case in multiple places and
      // centralize the logic for transitioning between game states.

      // Convert all moves to completed no-moves but keep in 'moving' state
      // The Game layer will handle transitioning to 'moved' state
      const completedMoves = movesArr.map((move) => ({
        ...move,
        stateKind: 'completed' as const,
        moveKind: 'no-move' as const,
        possibleMoves: [],
        isHit: false,
        origin: undefined,
        destination: undefined,
      }))

      // Return play in 'moving' state with all moves completed
      // This signals to Game layer that play should transition to 'moved'
      return {
        id: generateId(),
        board,
        player,
        moves: new Set(completedMoves),
        stateKind: 'moving',
      } as BackgammonPlayMoving
    }

    // Always return the correct number of moves for doubles/regular
    return {
      id: generateId(),
      board,
      player,
      moves: new Set(movesArr),
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
      movesCount: play.moves.size,
      stateKind: play.stateKind,
    })
    return {
      ...play,
      stateKind: 'moving',
      player: { ...play.player, stateKind: 'moving' },
      moves: new Set(Array.from(play.moves)),
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
    if (!play || !play.moves || play.moves.size === 0) {
      debug('Play.canMoveFrom: No active play or moves')
      return false
    }

    // Check if any moves are ready
    const movesArray = Array.from(play.moves)
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
    if (!play || !play.moves || play.moves.size === 0) {
      return []
    }

    // Check if any moves are ready
    const movesArray = Array.from(play.moves)
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
    if (!play.moves || play.moves.size === 0) {
      return { isValid: true }
    }

    const movesArray = Array.from(play.moves)

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
    if (!play.moves || play.moves.size === 0) {
      return false
    }

    const movesArray = Array.from(play.moves)
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
    if (!play.moves || play.moves.size === 0) {
      return []
    }

    const movesArray = Array.from(play.moves)
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
      const serialized = serializeGameState(sourcePlay)
      return deserializeGameState(serialized) as BackgammonPlayMoving
    }

    const cloneBoard = (sourceBoard: BackgammonBoard): BackgammonBoard => {
      const serialized = serializeGameState(sourceBoard)
      return deserializeGameState(serialized) as BackgammonBoard
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

      const movesArray = Array.from(currentPlay.moves)
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
    const hasReadyMoves = Array.from(play.moves).some(
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
