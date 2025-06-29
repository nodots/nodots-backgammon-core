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

export interface PlayProps {
  id?: string
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves
  board: BackgammonBoard
  player: BackgammonPlayerRolling | BackgammonPlayerMoving
}

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
    let move = movesArray.find(
      (m) => m.stateKind === 'ready'
    ) as BackgammonMoveReady

    if (!move) {
      // Return a no-move completed move
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

    // --- PATCH: Handle bear-off moves using BearOff.move ---
    if (move.moveKind === 'bear-off') {
      // Delegate to BearOff.move for correct moveKind and stateKind
      const bearOffResult = BearOff.move(board, move)
      return {
        play: {
          ...play,
          moves: new Set([bearOffResult.move]),
          board: bearOffResult.board,
        },
        board: bearOffResult.board,
        move: bearOffResult.move,
      } as BackgammonPlayResult
    }
    // --- END PATCH ---

    const possibleMoves = Board.getPossibleMoves(
      board,
      move.player,
      move.dieValue
    )
    const destinationMove = possibleMoves.find((m) => m.origin.id === origin.id)

    if (!destinationMove) {
      const noMove: BackgammonMoveCompletedNoMove = {
        id: generateId(),
        player: play.player,
        dieValue: move.dieValue,
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

    board = Board.moveChecker(
      board,
      origin,
      destinationMove.destination,
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
      origin,
      destination: destinationMove.destination,
      isHit: false,
    }

    // CRITICAL FIX: Properly manage all moves - replace the consumed ready move with completed move
    // Use filter + add approach to ensure proper move replacement
    const allMoves = Array.from(play.moves)
    const otherMoves = allMoves.filter((m) => m.id !== move.id) // Remove the executed move by ID

    // 🔧 CORE LOGIC BUG FIX: Recalculate possibleMoves for remaining ready moves
    // After a move executes, board state changes, so we must recalculate possible moves
    // for remaining dice to reflect the new positions
    const updatedOtherMoves = otherMoves.map((remainingMove) => {
      if (remainingMove.stateKind === 'ready') {
        // Recalculate possible moves based on updated board state
        const freshPossibleMoves = Board.getPossibleMoves(
          board, // Use the updated board state
          remainingMove.player,
          remainingMove.dieValue
        )

        // Update the move with fresh possible moves
        return {
          ...remainingMove,
          possibleMoves: freshPossibleMoves,
          // Update origin if needed - use first possible move's origin or keep existing
          origin:
            freshPossibleMoves.length > 0
              ? freshPossibleMoves[0].origin
              : remainingMove.origin,
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

          // Use the first possible move's origin as the move's origin
          const firstMove = possibleMoves[0]

          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind,
            possibleMoves: possibleMoves, // Store all possible moves
            origin: firstMove.origin, // Use first move's origin as the move's origin
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
