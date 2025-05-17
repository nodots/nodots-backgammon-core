import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCube,
  BackgammonMoveCompletedWithMove,
  BackgammonMoveCompletedNoMove,
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
} from 'nodots-backgammon-types'
import { Board, generateId } from '..'
import { BearOff } from '../Move/MoveKinds/BearOff'

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
        play: { ...play, moves: [noMove] } as any,
        board,
        move: noMove,
      }
    }

    // --- PATCH: Handle bear-off moves using BearOff.move ---
    if (move.moveKind === 'bear-off') {
      // Delegate to BearOff.move for correct moveKind and stateKind
      const bearOffResult = BearOff.move(board, move)
      return {
        play: {
          ...play,
          moves: [bearOffResult.move],
          board: bearOffResult.board,
        } as any,
        board: bearOffResult.board,
        move: bearOffResult.move,
      }
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
        play: { ...play, moves: [noMove] } as any,
        board,
        move: noMove,
      }
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
    }

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
      play: { ...play, moves: Array.from(play.moves) } as any,
      board,
      move: completedMove,
    }
  }

  public static initialize = function initialize(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled
  ): BackgammonPlayRolled {
    const roll = player.dice.currentRoll
    const moves = new Set<BackgammonMoveReady>()

    // Check if player has checkers on the bar
    const bar =
      player.direction === 'clockwise'
        ? board.bar.clockwise
        : board.bar.counterclockwise
    const playerCheckersOnBar = bar.checkers.filter(
      (checker: BackgammonChecker) => checker.color === player.color
    )

    // Handle checkers on the bar
    if (playerCheckersOnBar.length > 0) {
      // Player must move checkers from the bar first
      const possibleMoves = roll.map((dieValue) =>
        Board.getPossibleMoves(board, player, dieValue)
      )
      const hasNoMoves = possibleMoves.every((moves) => moves.length === 0)

      if (hasNoMoves) {
        // If no reentry moves are possible for any die, create a single no-move move
        const noMove: BackgammonMoveReady = {
          id: generateId(),
          player,
          dieValue: roll[0], // Use first die value for the no-move
          stateKind: 'ready',
          moveKind: 'no-move',
          origin: bar,
        }
        moves.add(noMove)
      } else {
        // Add reentry moves for each die that has possible moves
        roll.forEach((dieValue, index) => {
          if (possibleMoves[index].length > 0) {
            const move: BackgammonMoveReady = {
              id: generateId(),
              player,
              dieValue,
              stateKind: 'ready',
              moveKind: 'reenter',
              origin: bar,
            }
            moves.add(move)
          }
        })
      }
    } else {
      // Handle regular moves
      const possibleMoves = roll.map((dieValue) =>
        Board.getPossibleMoves(board, player, dieValue)
      )
      const hasNoMoves = possibleMoves.every((moves) => moves.length === 0)

      if (hasNoMoves) {
        // If no moves are possible for any die, create a single no-move move
        const noMove: BackgammonMoveReady = {
          id: generateId(),
          player,
          dieValue: roll[0], // Use first die value for the no-move
          stateKind: 'ready',
          moveKind: 'no-move',
          origin: board.BackgammonPoints[0], // Use first point as origin for no-move
        }
        moves.add(noMove)
      } else {
        // For doubles, we want exactly 4 moves
        if (roll[0] === roll[1]) {
          const dieValue = roll[0] // Both dice are the same
          const firstMoves = Board.getPossibleMoves(board, player, dieValue)

          if (firstMoves.length === 0) {
            // If no moves are possible, create a single no-move move
            const noMove: BackgammonMoveReady = {
              id: generateId(),
              player,
              dieValue: roll[0], // Use first die value for the no-move
              stateKind: 'ready',
              moveKind: 'no-move',
              origin: board.BackgammonPoints[0], // Use first point as origin for no-move
            }
            moves.add(noMove)
          } else {
            // Add all possible first moves
            firstMoves.forEach((skeleton) => {
              // For each first move, we can potentially move the same checker again
              // or move a different checker. We'll add all possibilities up to 4 moves.
              const move: BackgammonMoveReady = {
                id: generateId(),
                player,
                dieValue,
                stateKind: 'ready',
                moveKind: 'point-to-point',
                origin: skeleton.origin,
              }
              moves.add(move)
              moves.add({ ...move, id: generateId() })
              moves.add({ ...move, id: generateId() })
              moves.add({ ...move, id: generateId() })
            })
          }
        } else {
          // Add moves for each die that has possible moves
          roll.forEach((dieValue, index) => {
            if (possibleMoves[index].length > 0) {
              possibleMoves[index].forEach((skeleton) => {
                const move: BackgammonMoveReady = {
                  id: generateId(),
                  player,
                  dieValue,
                  stateKind: 'ready',
                  moveKind: 'point-to-point',
                  origin: skeleton.origin,
                }
                moves.add(move)
              })
            }
          })
        }
      }
    }

    return {
      id: generateId(),
      board,
      player,
      moves: Array.from(moves),
      stateKind: 'rolled',
    } as any
  }

  public static startMove = function startMove(
    play: BackgammonPlayRolled
  ): BackgammonPlayMoving {
    return {
      ...play,
      stateKind: 'moving',
      player: { ...play.player, stateKind: 'moving' },
      moves: Array.from(play.moves),
    } as any
  }
}
