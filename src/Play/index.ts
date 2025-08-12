import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCube,
  BackgammonMoveCompletedNoMove,
  BackgammonMoveCompletedWithMove,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
} from '@nodots-llc/backgammon-types/dist'
import { Board, generateId } from '..'
import { BearOff } from '../Move/MoveKinds/BearOff'
import { logger } from '../utils/logger'
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
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving

  public static move = function move(
    board: BackgammonBoard,
    play: BackgammonPlayRolled | BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): BackgammonPlayResult {
    const movesArray = Array.from(play.moves)

    // CRITICAL FIX: Don't rely on cached moves from activePlay.moves - they are stale
    // Instead, calculate a fresh move for the given origin and die value
    // First, find any ready move to get the die value
    const anyReadyMove = movesArray.find((m) => m.stateKind === 'ready')
    if (!anyReadyMove) {
      console.log('[DEBUG] Play.move: No ready moves found in activePlay.moves')
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

    // Get the die value from any ready move
    const dieValue = anyReadyMove.dieValue

    // Calculate fresh possible moves for this die value
    const freshPossibleMoves = Board.getPossibleMoves(
      board,
      play.player,
      dieValue
    )

    // Find the specific move for the exact origin ID provided
    const matchingMove = freshPossibleMoves.find(
      (pm) => pm.origin.id === origin.id
    )

    if (!matchingMove) {
      console.log('[DEBUG] Play.move: No fresh move found for origin:', {
        originId: origin.id,
        originKind: origin.kind,
        dieValue: dieValue,
        freshMovesCount: freshPossibleMoves.length,
        freshMoveOriginIds: freshPossibleMoves.map((pm) => pm.origin.id),
      })
      const noMove: BackgammonMoveCompletedNoMove = {
        id: generateId(),
        player: play.player,
        dieValue: dieValue,
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
      dieValue: dieValue,
      stateKind: 'ready',
      moveKind: anyReadyMove.moveKind,
      possibleMoves: [matchingMove], // Use the fresh move
      origin: matchingMove.origin, // Use the exact origin from fresh calculation
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
    console.log('[DEBUG] Play.move: Executing move with fresh destination:', {
      originId: matchingMove.origin.id,
      destinationId: matchingMove.destination.id,
      dieValue: dieValue,
    })

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
      isHit: false,
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
        
        console.log('[DEBUG] Play.move: Recalculated possibleMoves for remaining move:', {
          moveId: remainingMove.id,
          dieValue: remainingMove.dieValue,
          oldPossibleMovesCount: remainingMove.possibleMoves.length,
          freshPossibleMovesCount: freshPossibleMoves.length,
          freshOriginIds: freshPossibleMoves.map(pm => pm.origin.id)
        })
        
        return {
          ...remainingMove,
          possibleMoves: freshPossibleMoves // Update with fresh moves
        }
      }
      return remainingMove // Keep completed moves unchanged
    })

    const finalMoves = new Set([...updatedOtherMoves, completedMove]) // Add updated moves + completed move

    return {
      play: { ...play, moves: finalMoves, board },
      board,
      move: completedMove,
    } as BackgammonPlayResult
  }

  public static initialize = function initialize(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled
  ): BackgammonPlayRolled {
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

    for (let i = 0; i < moveCount; i++) {
      const dieValue = roll[i % 2]

      if (barCheckersLeft > 0) {
        // Handle checkers on the bar
        const possibleMoves = Board.getPossibleMoves(board, player, dieValue)
        if (possibleMoves.length > 0) {
          // Reentry is possible for this die: add 'reenter' move with possibleMoves
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind: 'reenter',
            possibleMoves: possibleMoves, // Store the actual possible moves
            origin: bar,
          })
          barCheckersLeft-- // Only decrement if a reentry actually happens
        } else {
          // No reentry possible for this die: add 'no-move', checker stays on bar
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind: 'no-move',
            possibleMoves: [], // No moves possible
            origin: bar,
          })
          // barCheckersLeft is NOT decremented here
        }
      } else {
        // No checkers on the bar - generate moves for normal board positions
        const possibleMoves = Board.getPossibleMoves(board, player, dieValue)

        if (possibleMoves.length > 0) {
          // Determine move kind based on the possible moves
          let moveKind: 'point-to-point' | 'bear-off' | 'reenter' =
            'point-to-point'

          // Check if any of the possible moves are bear-offs
          const hasBearOffMove = possibleMoves.some(
            (move) => move.destination.kind === 'off'
          )
          if (hasBearOffMove) {
            moveKind = 'bear-off'
          }

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

          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind,
            possibleMoves: possibleMoves, // Store all possible moves
            origin: selectedMove.origin, // Use the selected move's origin
          })
        } else {
          // No possible moves for this die
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
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
      stateKind: 'rolled',
    } as BackgammonPlayRolled
  }

  public static startMove = function startMove(
    play: BackgammonPlayRolled
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
