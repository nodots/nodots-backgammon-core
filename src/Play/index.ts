import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCube,
  BackgammonDieValue,
  BackgammonMoveCompletedNoMove,
  BackgammonMoveCompletedWithMove,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlayerMoving,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayStateKind,
} from '@nodots-llc/backgammon-types/dist'
import { Board, generateId } from '..'
import { BearOff } from '../Move/MoveKinds/BearOff'
import { logger, debug } from '../utils/logger'
export * from '../index'

const allowedMoveKinds = ['point-to-point', 'reenter', 'bear-off'] as const
type AllowedMoveKind = (typeof allowedMoveKinds)[number]
function isAllowedMoveKind(kind: any): kind is AllowedMoveKind {
  return allowedMoveKinds.includes(kind)
}

// PlayProps is now imported from @nodots-llc/backgammon-types

export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves = new Set()
  board!: BackgammonBoard
  player!:
    | BackgammonPlayerRolling
    | BackgammonPlayerMoving

  public static move = function move(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): BackgammonPlayResult {
    const movesArray = Array.from(play.moves)

    // CRITICAL FIX: Don't rely on cached moves from activePlay.moves - they are stale
    // Instead, calculate a fresh move for the given origin and die value
    // First, find any ready move to get the die value
    const anyReadyMove = movesArray.find((m) => m.stateKind === 'ready')
    if (!anyReadyMove) {
      debug('Play.move: No ready moves found in activePlay.moves')
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

    // Get the die value from any ready move and find other available die values
    const dieValue = anyReadyMove.dieValue
    const otherReadyMoves = movesArray.filter((m) => m.stateKind === 'ready' && m.dieValue !== dieValue)
    const otherDieValue = otherReadyMoves.length > 0 ? otherReadyMoves[0].dieValue : dieValue

    // Calculate fresh possible moves with intelligent dice switching
    const moveResult = Board.getPossibleMovesWithIntelligentDiceSwitching(
      board,
      play.player,
      dieValue,
      otherDieValue
    )

    // Find the specific move for the exact origin ID provided
    const matchingMove = moveResult.moves.find(
      (pm) => pm.origin.id === origin.id
    )

    if (!matchingMove) {
      debug('Play.move: No fresh move found for origin', {
        originId: origin.id,
        originKind: origin.kind,
        dieValue: dieValue,
        freshMovesCount: moveResult.moves.length,
        freshMoveOriginIds: moveResult.moves.map((pm) => pm.origin.id),
      })

      // CRITICAL BUG FIX: If the requested origin has no moves but fresh moves exist,
      // use the first available fresh move instead of creating a no-move.
      // This fixes the doubles bear-off bug where stale origin references prevent valid moves.
      if (moveResult.moves.length > 0) {
        debug('Play.move: Using first available fresh move as fallback', {
          fallbackOriginId: moveResult.moves[0].origin.id,
          fallbackOriginKind: moveResult.moves[0].origin.kind,
          moveKind: moveResult.moves[0].destination.kind === 'off' ? 'bear-off' : 
                   moveResult.moves[0].origin.kind === 'bar' ? 'reenter' : 'point-to-point',
        })
        // Use the first available fresh move as a fallback
        const fallbackMove = moveResult.moves[0]
        
        // Determine the correct move kind based on the fallback move
        let moveKind: 'point-to-point' | 'bear-off' | 'reenter' = 'point-to-point'
        if (fallbackMove.destination.kind === 'off') {
          moveKind = 'bear-off'
        } else if (fallbackMove.origin.kind === 'bar') {
          moveKind = 'reenter'
        } else {
          moveKind = 'point-to-point'
        }

        // Execute the fallback move using the existing bear-off logic
        if (moveKind === 'bear-off') {
          const bearOffMove: BackgammonMoveReady = {
            id: generateId(),
            player: play.player,
            dieValue: moveResult.usedDieValue,
            stateKind: 'ready',
            moveKind: 'bear-off',
            possibleMoves: [fallbackMove],
            origin: fallbackMove.origin,
          }
          
          const moveExecutionResult = BearOff.move(board, bearOffMove)
          const completedMove = moveExecutionResult.move as BackgammonMoveCompletedWithMove

          // Update the play by marking one move as completed and updating others
          const updatedMoves: BackgammonMoves = new Set()
          let moveCompleted = false

          Array.from(play.moves).forEach((move) => {
            if (move.stateKind === 'ready' && move.dieValue === moveResult.usedDieValue && !moveCompleted) {
              // Mark the first matching move as completed
              updatedMoves.add(completedMove)
              moveCompleted = true
            } else {
              updatedMoves.add(move)
            }
          })

          return {
            board: moveExecutionResult.board,
            play: { ...play, moves: updatedMoves },
            move: completedMove,
          } as BackgammonPlayResult
        } else {
          // For non-bear-off moves, use regular board move logic
          const newBoard = Board.moveChecker(
            board,
            fallbackMove.origin,
            fallbackMove.destination,
            play.player.direction
          )

          const completedMove: BackgammonMoveCompletedWithMove = {
            id: generateId(),
            player: play.player,
            dieValue: moveResult.usedDieValue,
            stateKind: 'completed',
            moveKind,
            possibleMoves: [fallbackMove],
            isHit: false,
            origin: fallbackMove.origin,
            destination: fallbackMove.destination,
          }

          // Update the play by marking one move as completed
          const updatedMoves: BackgammonMoves = new Set()
          let moveCompleted = false

          Array.from(play.moves).forEach((move) => {
            if (move.stateKind === 'ready' && move.dieValue === moveResult.usedDieValue && !moveCompleted) {
              updatedMoves.add(completedMove)
              moveCompleted = true
            } else {
              updatedMoves.add(move)
            }
          })

          return {
            board: newBoard,
            play: { ...play, moves: updatedMoves },
            move: completedMove,
          } as BackgammonPlayResult
        }
      }

      // Only create a no-move if no fresh moves are available at all
      const noMove: BackgammonMoveCompletedNoMove = {
        id: generateId(),
        player: play.player,
        dieValue: moveResult.usedDieValue,
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

    // Create a synthetic move object with the exact origin and destination
    const move: BackgammonMoveReady = {
      id: anyReadyMove.id, // Use the ID from the original ready move
      player: play.player,
      dieValue: moveResult.usedDieValue, // Use the effective die value (may be switched)
      stateKind: 'ready',
      moveKind: anyReadyMove.moveKind,
      possibleMoves: [matchingMove], // Use the fresh move
      origin: matchingMove.origin, // Use the exact origin from fresh calculation
    }
    
    // If dice were switched, update the player's current roll to reflect the new order
    if (moveResult.usedDieValue !== dieValue && otherDieValue !== dieValue) {
      const currentRoll = [...play.player.dice.currentRoll]
      if (currentRoll[0] !== currentRoll[1]) { // Only swap if not doubles
        play.player.dice.currentRoll = [currentRoll[1], currentRoll[0]]
        debug('Play.move: Swapped dice for checker move', {
          originalRoll: currentRoll,
          newRoll: play.player.dice.currentRoll,
          usedDieValue: moveResult.usedDieValue
        })
      }
    }

    // --- PATCH: Handle bear-off moves using BearOff.move ---
    if (move.moveKind === 'bear-off') {
      // Delegate to BearOff.move for correct moveKind and stateKind
      const bearOffResult = BearOff.move(board, move)

      // 🔧 FIX: Preserve all other moves, just replace the executed one
      const allMoves = Array.from(play.moves)
      // DEFENSIVE PROGRAMMING: Filter out null/undefined moves and ensure valid move objects
      const validOtherMoves = allMoves.filter((m) => {
        if (!m) {
          logger.warn('Play.move: Found null/undefined move in moves array, excluding from result')
          return false
        }
        if (typeof m !== 'object' || !('id' in m)) {
          logger.warn('Play.move: Found invalid move object, excluding from result:', m)
          return false
        }
        return m.id !== move.id
      })
      const finalMoves = new Set([...validOtherMoves, bearOffResult.move])

      return {
        play: {
          ...play,
          moves: finalMoves, // 🔧 FIX: Keep all moves, not just the completed one
          board: bearOffResult.board,
        },
        board: bearOffResult.board,
        move: bearOffResult.move,
      } as BackgammonPlayResult
    }
    // --- END PATCH ---

    // CRITICAL FIX: Use the exact destination from the fresh move calculation
    // Don't recalculate possible moves - we already have the correct destination
    debug('Play.move: Executing move with fresh destination', {
      originId: matchingMove.origin.id,
      destinationId: matchingMove.destination.id,
      dieValue: dieValue,
    })

    // CRITICAL FIX: Detect if a hit will occur before executing the move
    // Check if destination is a point with exactly one opponent checker
    let isHit = false
    if (matchingMove.destination.kind === 'point') {
      const destination = Board.getCheckerContainer(board, matchingMove.destination.id)
      if (destination.kind === 'point' && 
          destination.checkers.length === 1 && 
          destination.checkers[0].color !== move.player.color) {
        isHit = true
        debug('Play.move: Hit detected', {
          destinationId: matchingMove.destination.id,
          hitCheckerColor: destination.checkers[0].color,
          movingPlayerColor: move.player.color,
        })
      }
    }

    board = Board.moveChecker(
      board,
      matchingMove.origin,
      matchingMove.destination,
      move.player.direction
    )

    const completedMove: BackgammonMoveCompletedWithMove = {
      id: move.id,
      player: move.player,
      dieValue: move.dieValue,
      stateKind: 'completed',
      moveKind: isAllowedMoveKind(move.moveKind)
        ? move.moveKind
        : 'point-to-point',
      possibleMoves: [],
      origin: matchingMove.origin,
      destination: matchingMove.destination,
      isHit: isHit,
    }

    // CRITICAL FIX: Properly manage all moves - replace the consumed ready move with completed move
    // Use filter + add approach to ensure proper move replacement
    const allMoves = Array.from(play.moves)
    // DEFENSIVE PROGRAMMING: Filter out null/undefined moves and ensure valid move objects
    const otherMoves = allMoves.filter((m) => {
      if (!m) {
        logger.warn('Play.move: Found null/undefined move in moves array, excluding from result')
        return false
      }
      if (typeof m !== 'object' || !('id' in m)) {
        logger.warn('Play.move: Found invalid move object, excluding from result:', m)
        return false
      }
      return m.id !== move.id // Remove the executed move by ID
    })

    // CRITICAL FIX: Recalculate possibleMoves for remaining ready moves
    // After a move is executed, the board state changes and remaining moves need fresh possibleMoves
    // that reflect the current board state (e.g., checker at new position, not old position)
    const updatedOtherMoves = otherMoves.map((remainingMove) => {
      if (remainingMove.stateKind === 'ready') {
        // Recalculate fresh possible moves for this die value on the updated board
        const freshPossibleMoves = Board.getPossibleMoves(
          board, // Use the updated board after the move
          play.player,
          remainingMove.dieValue
        )
        
        debug('Play.move: Recalculated possibleMoves for remaining move', {
          moveId: remainingMove.id,
          dieValue: remainingMove.dieValue,
          oldPossibleMovesCount: remainingMove.possibleMoves.length,
          freshPossibleMovesCount: freshPossibleMoves.length,
          freshOriginIds: freshPossibleMoves.map(pm => pm.origin.id)
        })
        
        // CRITICAL BUG FIX: Handle case where recalculated possibleMoves is empty
        // When no moves are possible after board update, convert to completed no-move
        if (freshPossibleMoves.length === 0) {
          debug('Play.move: Converting remaining move to no-move (no possible moves after recalculation)', {
            moveId: remainingMove.id,
            dieValue: remainingMove.dieValue,
            originalMoveKind: remainingMove.moveKind
          })
          
          return {
            ...remainingMove,
            stateKind: 'completed' as const,
            moveKind: 'no-move' as const,
            possibleMoves: [], // No moves possible
            origin: undefined,
            destination: undefined,
            isHit: false,
          }
        }
        
        return {
          ...remainingMove,
          possibleMoves: freshPossibleMoves // Update with fresh moves
        }
      }
      return remainingMove // Keep completed moves unchanged
    })

    const finalMoves = new Set([...updatedOtherMoves, completedMove]) // Add updated moves + completed move

    // Check if all moves are now completed
    const allMovesCompleted = Array.from(finalMoves).every(
      (move) => move.stateKind === 'completed'
    )

    // Update play stateKind to 'moved' when all moves are completed
    const playStateKind = allMovesCompleted ? 'moved' : 'moving'

    return {
      play: { 
        ...play, 
        moves: finalMoves, 
        board,
        stateKind: playStateKind as 'moving' | 'moved'
      },
      board,
      move: completedMove,
    } as BackgammonPlayResult
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

    for (let i = 0; i < moveCount; i++) {
      const dieValue = roll[i % 2]

      if (barCheckersLeft > 0) {
        // 🔧 BUG FIX: Check both die values for reentry, but ensure each die is used only once
        let availableDieValues: number[] = []
        
        if (!isDoubles) {
          // For mixed rolls like [1,4], each die can only be used once for reentry
          availableDieValues = roll.filter(die => !usedBarReentryDice.has(die))
        } else {
          // For doubles like [2,2], can use the same die value multiple times (up to 4 total moves)
          availableDieValues = [dieValue]
        }
        
        let reentryMoveCreated = false
        
        // Try each available die value for reentry
        for (const availableDieValue of availableDieValues) {
          const possibleMoves = Board.getPossibleMoves(board, player, availableDieValue as BackgammonDieValue)
          
          if (possibleMoves.length > 0) {
            // Reentry is possible with this die value
            movesArr.push({
              id: generateId(),
              player,
              dieValue: availableDieValue as BackgammonDieValue,
              stateKind: 'ready',
              moveKind: 'reenter',
              possibleMoves: possibleMoves,
              origin: bar,
            })
            barCheckersLeft--
            
            // Mark this die value as used for bar reentry (only for mixed rolls)
            if (!isDoubles) {
              usedBarReentryDice.add(availableDieValue)
            }
            
            reentryMoveCreated = true
            break // Found a valid reentry, stop trying other dice
          }
        }
        
        if (!reentryMoveCreated) {
          // No reentry possible with any available die: add 'no-move', checker stays on bar
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind: 'no-move',
            possibleMoves: [],
            origin: bar,
          })
          // barCheckersLeft is NOT decremented here
        }
      } else {
        // No checkers on the bar - generate moves for normal board positions with intelligent dice switching
        const otherDieValue = roll[1 - (i % 2)] // Get the other die value
        const moveResult = Board.getPossibleMovesWithIntelligentDiceSwitching(
          board, 
          player, 
          dieValue, 
          otherDieValue
        )
        const possibleMoves = moveResult.moves
        const effectiveDieValue = moveResult.usedDieValue
        
        // If dice were switched, update the player's current roll to reflect the new order
        if (effectiveDieValue !== dieValue) {
          const currentRoll = [...player.dice.currentRoll]
          if (currentRoll[0] !== currentRoll[1]) { // Only swap if not doubles
            player.dice.currentRoll = [currentRoll[1], currentRoll[0]]
            debug('Play.initialize: Swapped dice for regular move', {
              originalRoll: currentRoll,
              newRoll: player.dice.currentRoll,
              usedDieValue: effectiveDieValue
            })
          }
        }

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
          let moveKind: 'point-to-point' | 'bear-off' | 'reenter' = 'point-to-point'
          
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
            dieValue: effectiveDieValue, // Use the effective die value (may be switched)
            stateKind: 'ready',
            moveKind,
            possibleMoves: possibleMoves, // Store all possible moves
            origin: selectedMove.origin, // Use the selected move's origin
          })
        } else {
          // No possible moves for this die (even with switching)
          movesArr.push({
            id: generateId(),
            player,
            dieValue: effectiveDieValue, // Use the effective die value
            stateKind: 'ready',
            moveKind: 'no-move',
            possibleMoves: [], // No moves possible
            origin: undefined as any,
          })
        }
      }
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
}
