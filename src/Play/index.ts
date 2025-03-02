import { Board, generateId, Player } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
  BackgammonPoint,
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

  public static roll = function roll({
    board,
    player,
  }: PlayProps): BackgammonPlayRolled {
    const rollingPlayer = player as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(rollingPlayer) as BackgammonPlayerRolled
    const moves = Play.buildMoves(board, rolledPlayer)

    return {
      id: generateId(),
      stateKind: 'rolled',
      player: rolledPlayer,
      moves,
    }
  }

  public static move = function move(
    board: BackgammonBoard,
    play: BackgammonPlayMoving,
    origin: BackgammonMoveOrigin
  ): BackgammonPlayResult {
    let moves = play.moves
    let move = moves.find(
      (m) => m.stateKind === 'ready' && m.origin === undefined
    )
    if (!move) throw new Error('Move not found. Is play finished?')

    switch (origin.kind) {
      case 'point':
        const player = play.player as BackgammonPlayerMoving
        move.origin = origin as BackgammonPoint
        play = {
          ...play,
          stateKind: 'moving',
          player,
          moves,
        }
        return {
          play,
          board,
        }
      case 'bar':
        move.origin = origin as BackgammonBar
        break
      default:
        throw new Error('Invalid origin')
    }

    return {
      play,
      board,
    }
  }

  private static buildMoves = function buildMoves(
    board: BackgammonBoard,
    player: BackgammonPlayerRolled
  ): BackgammonMoves {
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
    return Array.from(moves) as BackgammonMoves
  }
}
