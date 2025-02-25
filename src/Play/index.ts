import { generateId, Player } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveInProgress,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonMoveStateKind,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
  BackgammonPoint,
} from '../../types'
import { Move } from '../Move'

export interface PlayProps {
  id?: string
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves
  player:
    | BackgammonPlayerRolling
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving
    | BackgammonPlayerMoved
}
export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves | undefined = undefined
  player!:
    | BackgammonPlayerRolling
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving

  public static roll = function roll({
    player,
  }: PlayProps): BackgammonPlayRolled {
    const rollingPlayer = player as BackgammonPlayerRolling
    player = Player.roll(rollingPlayer)
    const moves = Play.buildMoves(player)

    return {
      id: generateId(),
      stateKind: 'rolled',
      player,
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
        // console.log('Play.move -> player', player)
        move.origin = origin as BackgammonPoint

        console.log('Play.move -> move.origin', move.origin)
        console.log('Play.move -> player', player)

        // move.destination = board.points.find(
        //   (p) => p.position[player.direction] === destinationPosition
        // ) as BackgammonPoint

        // const results = Move.move(board, move, false)
        // move = results.move as BackgammonMove
        // if (!move) throw new Error('Move not found')
        // board = results.board
        // moves = moves.map((m) =>
        //   m.id === move!.id ? move : m
        // ) as BackgammonMoves // FIXME: squirelly cast
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

  public static getValidMoves = function getValidMoves(
    board: BackgammonBoard,
    moves: BackgammonMoveReady[]
  ): Set<BackgammonMove> {
    if (!moves) throw new Error('Moves not found')
    if (!board) throw new Error('Board not found')
    const player:
      | BackgammonPlayerRolled
      | BackgammonPlayerMoving
      | BackgammonPlayerMoved = moves[0].player

    let validMoves = new Set<BackgammonMove>()
    let newBoard = board

    const originPoints = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )

    // TODO: Implement reentering
    // const bar = board.bar[player.direction]
    // if (bar && bar.checkers.length > 0) {
    //   const reenter = Move.move(board, {

    //   })
    //   validMoves.add(reenter.move)
    // }

    moves.forEach(function forEachMove(m: BackgammonMoveReady) {
      originPoints.map(function mapOrigins(o) {
        const move: BackgammonMoveInProgress = {
          ...m,
          stateKind: 'in-progress' as BackgammonMoveStateKind,
          origin: o,
        } as BackgammonMoveInProgress // FIXME
        const newM = Move.move(newBoard, move, true)
        validMoves.add(newM.move)
      })
    })

    return validMoves
  }

  private static buildMoves = function buildMoves(
    player: BackgammonPlayerRolled
  ): BackgammonMoves {
    const moves = new Set<BackgammonMove>()
    const roll = player.dice.currentRoll
    const move0: BackgammonMoveReady = {
      id: generateId(),
      player,
      stateKind: 'ready',
      dieValue: roll[0],
    }
    const move1: BackgammonMoveReady = {
      id: generateId(),
      player,
      stateKind: 'ready',
      dieValue: roll[1],
    }
    moves.add(move0)
    moves.add(move1)
    if (roll[0] === roll[1]) {
      const move2: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        dieValue: roll[0],
      }
      const move3: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        dieValue: roll[1],
      }
      moves.add(move2)
      moves.add(move3)
    }
    return Array.from(moves) as BackgammonMoves
  }
}
