import { generateId, Player } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveDestination,
  BackgammonMoveDirection,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoveResult,
  BackgammonMoves,
  BackgammonPlay,
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

export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves: BackgammonMoves[] = []
  player!:
    | BackgammonPlayerRolling
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving

  public static initialize = function initializePlay({
    id,
    stateKind,
    player,
    moves,
  }: BackgammonPlay): BackgammonPlay {
    if (!id) {
      id = generateId()
    }
    if (!stateKind) {
      stateKind = 'rolling'
    }

    player = {
      ...player,
      stateKind: 'rolling',
    }

    const play = {
      id,
      stateKind,
      player,
    }
    return play
  }

  public static roll = function rollPlay(
    board: BackgammonBoard,
    play: BackgammonPlay
  ): BackgammonPlayRolled {
    let { player } = play
    const { direction } = player
    player = Player.roll(player.dice)
    const roll = player.dice.currentRoll

    let initializedMoves: BackgammonMoveReady[] = []

    const move0: BackgammonMoveReady = {
      id: generateId(),
      player,
      dieValue: roll[0],
      stateKind: 'ready',
      direction,
      isAuto: false,
      isForced: false,
    }

    const move1: BackgammonMoveReady = {
      id: generateId(),
      player,
      dieValue: roll[1],
      stateKind: 'ready',
      direction,
      isAuto: false,
      isForced: false,
    }

    initializedMoves.push(move0, move1)

    if (roll[0] === roll[1]) {
      const move2: BackgammonMoveReady = {
        id: generateId(),
        player,
        dieValue: roll[0],
        stateKind: 'ready',
        direction,
        isAuto: false,
        isForced: false,
      }

      const move3: BackgammonMoveReady = {
        id: generateId(),
        player,
        dieValue: roll[1],
        stateKind: 'ready',
        direction,
        isAuto: false,
        isForced: false,
      }

      initializedMoves.push(move2, move3)
    }

    const moves = initializedMoves

    return {
      ...play,
      stateKind: 'rolled',
      player,
      moves,
    }
  }

  public static move = function movePlay(
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
        console.log('Play.move -> player', player)
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
    moves: BackgammonMoves
  ): Set<BackgammonMove> {
    if (!moves) throw new Error('Moves not found')
    if (!board) throw new Error('Board not found')
    const player = moves[0].player as BackgammonPlayerRolled

    let validMoves = new Set<BackgammonMove>()
    let newBoard = board

    const origins = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )

    moves.forEach(function forEachMove(m: BackgammonMove) {
      origins.map(function mapOrigins(o) {
        m.origin = o
        const newM = Move.move(newBoard, m, true)
        validMoves.add(newM.move)
      })
    })

    return validMoves
  }
}
