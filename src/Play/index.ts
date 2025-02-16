import { Dice, generateId, Player } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonDiceRolled,
  BackgammonMove,
  BackgammonMoveOrigin,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoved,
  BackgammonPlayMoving,
  BackgammonPlayResult,
  BackgammonPlayRolled,
  BackgammonPlayRolling,
  BackgammonPlayStateKind,
  BackgammonPoint,
} from '../../types'
import { Move } from '../Move'

export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves: BackgammonMoves | undefined = undefined
  player!:
    | BackgammonPlayerRolling
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving

  public static initialize = function initializePlay(
    player: BackgammonPlayer,
    stateKind: BackgammonPlayStateKind = 'rolled',
    id: string = generateId(),
    moves: BackgammonMoves | undefined = undefined
  ): BackgammonPlay {
    switch (stateKind) {
      case 'rolling':
        return {
          id,
          stateKind,
          player,
          moves,
        } as BackgammonPlayRolling
      case 'rolled':
        const rolledPlayer = player as BackgammonPlayerRolled
        const dice = player.dice as BackgammonDiceRolled
        const currentRoll = dice.currentRoll
        const move0: BackgammonMoveReady = {
          id: generateId(),
          player: rolledPlayer,
          dieValue: currentRoll[0],
          stateKind: 'ready',
          direction: player.direction,
          isAuto: false,
          isForced: false,
        }
        const move1: BackgammonMoveReady = {
          id: generateId(),
          player: rolledPlayer,
          dieValue: currentRoll[0],
          stateKind: 'ready',
          direction: player.direction,
          isAuto: false,
          isForced: false,
        }
        moves = [move0, move1]
        if (Dice.isDouble(dice)) {
          const move2: BackgammonMoveReady = {
            id: generateId(),
            player: rolledPlayer,
            dieValue: currentRoll[0],
            stateKind: 'ready',
            direction: player.direction,
            isAuto: false,
            isForced: false,
          }
          const move3: BackgammonMoveReady = {
            id: generateId(),
            player: rolledPlayer,
            dieValue: currentRoll[0],
            stateKind: 'ready',
            direction: player.direction,
            isAuto: false,
            isForced: false,
          }
          moves.push(move2, move3)
        }
        return {
          id,
          player,
          stateKind,
          moves,
        } as BackgammonPlayRolled
      case 'moving':
        return {
          id,
          stateKind,
          moves,
        } as BackgammonPlayMoving
      case 'moved':
        return {
          id,
          stateKind,
          moves,
        } as BackgammonPlayMoved
    }
  }

  public static roll = function roll(
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

        // console.log('Play.move -> move.origin', move.origin)
        // console.log('Play.move -> player', player)

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
