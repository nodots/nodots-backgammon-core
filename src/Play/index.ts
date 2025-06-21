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
    const destinationMove = possibleMoves.find((m) => m.origin === origin)

    if (!destinationMove) {
      const noMove: BackgammonMoveCompletedNoMove = {
        id: generateId(),
        player: play.player,
        dieValue: move.dieValue,
        stateKind: 'completed',
        moveKind: 'no-move',
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

    const readyMove: BackgammonMoveReady = {
      id: move.id,
      player: move.player,
      dieValue: move.dieValue,
      stateKind: 'ready',
      moveKind: isAllowedMoveKind(move.moveKind)
        ? move.moveKind
        : 'point-to-point',
      origin,
    }

    const updatedMoves: BackgammonMoves = new Set([readyMove])

    play = {
      ...play,
      moves: updatedMoves,
      board,
    } as BackgammonPlayMoving

    const completedMove: BackgammonMoveCompletedWithMove = {
      id: move.id,
      player: move.player,
      dieValue: move.dieValue,
      stateKind: 'completed',
      moveKind: isAllowedMoveKind(move.moveKind)
        ? move.moveKind
        : 'point-to-point',
      origin,
      destination: destinationMove.destination,
      isHit: false,
    }

    return {
      play: { ...play, moves: new Set(Array.from(play.moves)) },
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
          // Reentry is possible for this die: add 'reenter' and remove checker from bar
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind: 'reenter',
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
            origin: bar,
          })
          // barCheckersLeft is NOT decremented here
        }
      } else {
        // No checkers on the bar - generate moves for normal board positions
        const possibleMoves = Board.getPossibleMoves(board, player, dieValue)

        if (possibleMoves.length > 0) {
          // Find the first valid move with a checker of the player's color
          const validMove = possibleMoves.find((move) => {
            if (move.origin.kind === 'point') {
              return (
                move.origin.checkers.length > 0 &&
                move.origin.checkers[0].color === player.color
              )
            }
            return false
          })

          if (validMove) {
            // Determine move kind based on destination
            let moveKind: 'point-to-point' | 'bear-off' = 'point-to-point'
            if (validMove.destination.kind === 'off') {
              moveKind = 'bear-off'
            }

            movesArr.push({
              id: generateId(),
              player,
              dieValue,
              stateKind: 'ready',
              moveKind,
              origin: validMove.origin,
            })
          } else {
            // No valid moves found
            movesArr.push({
              id: generateId(),
              player,
              dieValue,
              stateKind: 'ready',
              moveKind: 'no-move',
              origin: undefined as any,
            })
          }
        } else {
          // No possible moves for this die
          movesArr.push({
            id: generateId(),
            player,
            dieValue,
            stateKind: 'ready',
            moveKind: 'no-move',
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
