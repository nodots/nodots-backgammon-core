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
} from '@nodots-llc/backgammon-types'
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
    const movesArr: BackgammonMoveReady[] = []

    // Check if player has checkers on the bar
    const bar =
      player.direction === 'clockwise'
        ? board.bar.clockwise
        : board.bar.counterclockwise
    const playerCheckersOnBar = bar.checkers.filter(
      (checker: BackgammonChecker) => checker.color === player.color
    )

    // Debug: Print player state before move generation
    console.log('[DEBUG Play.initialize] player:', {
      color: player.color,
      direction: player.direction,
      stateKind: player.stateKind,
      isRobot: (player as any).isRobot,
      dice: player.dice && player.dice.currentRoll,
    })

    // ---
    // BULLET-PROOF BAR HANDLING LOGIC:
    // Always iterate for the full number of move slots (2 or 4).
    // For each slot:
    //   - If there are checkers on the bar:
    //       - If reentry is possible, add 'reenter' and decrement barCheckersLeft.
    //       - If not, add 'no-move' (do not decrement barCheckersLeft).
    //   - If no checkers left on the bar, add 'no-move'.
    // This guarantees the move array is always the correct length and only decrements barCheckersLeft when a checker actually reenters.
    const isDoubles = roll[0] === roll[1]
    const moveCount = isDoubles ? 4 : 2
    let barCheckersLeft = playerCheckersOnBar.length
    for (let i = 0; i < moveCount; i++) {
      const dieValue = roll[i % 2]
      if (barCheckersLeft > 0) {
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
        // No checkers left on the bar, fill with 'no-move'
        movesArr.push({
          id: generateId(),
          player,
          dieValue,
          stateKind: 'ready',
          moveKind: 'no-move',
          origin: bar,
        })
      }
    }
    // Always return the correct number of moves for doubles/regular
    return {
      id: generateId(),
      board,
      player,
      moves: movesArr,
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
