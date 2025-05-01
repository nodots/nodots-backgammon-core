import { Board, generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveCompleted,
  BackgammonMoveInProgress,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
} from '../types'

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
  moves?: BackgammonMoves | undefined = undefined
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
    let moves = play.moves
    let move: BackgammonMoveReady = moves.find(
      (m) => m.stateKind === 'ready' && m.origin === undefined
    ) as BackgammonMoveReady
    if (move === undefined) throw new Error('No move ready')
    const destination = move.possibleMoves.find(
      (m) => m.origin === origin
    )?.destination
    if (destination === undefined) throw new Error('Invalid move')

    board = Board.moveChecker(board, origin, destination, move.player.direction)
    moves = moves.map((m) => {
      if (m.stateKind === 'ready' && m.origin === undefined) {
        return {
          ...m,
          origin,
          destination,
        } as BackgammonMoveInProgress
      }
      return m
    }) as BackgammonMoves

    play = {
      ...play,
      moves,
      board,
    }

    const completedMove = {
      ...move,
      stateKind: 'completed',
      moveKind: 'point-to-point',
      origin,
      destination,
    } as BackgammonMoveCompleted

    return {
      play,
      board,
      move: completedMove,
    }
  }

  public static initialize = function initialize(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled
  ): BackgammonPlayRolled {
    const moves = new Set<BackgammonMove>()
    const roll = player.dice.currentRoll

    const move0: BackgammonMoveReady = {
      id: generateId(),
      player,
      stateKind: 'ready',
      dieValue: roll[0],
      possibleMoves: Board.getPossibleMoves(board, player, roll[0]),
    }

    const move1: BackgammonMoveReady = {
      id: generateId(),
      player,
      stateKind: 'ready',
      dieValue: roll[1],
      possibleMoves: Board.getPossibleMoves(board, player, roll[1]),
    }
    moves.add(move0)
    moves.add(move1)
    if (roll[0] === roll[1]) {
      const move2: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        dieValue: roll[0],
        possibleMoves: Board.getPossibleMoves(board, player, roll[0]),
      }
      const move3: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        dieValue: roll[1],
        possibleMoves: Board.getPossibleMoves(board, player, roll[1]),
      }
      moves.add(move2)
      moves.add(move3)
    }
    return {
      id: generateId(),
      stateKind: 'rolled',
      board,
      player,
      moves: Array.from(moves) as BackgammonMoves,
    }
  }
}
