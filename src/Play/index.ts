import { generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlayerMoved,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
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
    switch (player.stateKind) {
      case 'rolling':
        let moves: BackgammonMove[] = []
        player = Player.roll(player)
        const roll = player.dice.currentRoll
        const total = roll.reduce((a, b) => a + b, 0)

        const move0: BackgammonMoveReady = {
          id: generateId(),
          stateKind: 'ready',
          player,
          dieValue: roll[0],
        }
        const move1: BackgammonMoveReady = {
          id: generateId(),
          stateKind: 'ready',
          player,
          dieValue: roll[1],
        }

        moves = [move0, move1]

        if (roll[0] === roll[1]) {
          const move2: BackgammonMoveReady = {
            id: generateId(),
            stateKind: 'ready',
            player,
            dieValue: roll[0],
          }
          const move3: BackgammonMoveReady = {
            id: generateId(),
            stateKind: 'ready',
            player,
            dieValue: roll[1],
          }
          moves.push(move2, move3)
        }

        return {
          id: generateId(),
          stateKind: 'rolled',
          player,
          moves,
        } as BackgammonPlayRolled
      case 'rolled':
      default:
        console.error(`Invalid player state ${player.stateKind}`)
        throw new Error('Invalid player state')
    }
  }

  // public static move = function move(
  //   board: BackgammonBoard,
  //   play: BackgammonPlayMoving,
  //   origin: BackgammonMoveOrigin
  // ): BackgammonPlayResult {
  //   let moves = play.moves
  //   let move = moves.find(
  //     (m) => m.stateKind === 'ready' && m.origin === undefined
  //   )
  //   if (!move) throw new Error('Move not found. Is play finished?')

  //   switch (origin.kind) {
  //     case 'point':
  //       const player = play.player as BackgammonPlayerMoving
  //       // console.log('Play.move -> player', player)
  //       move.origin = origin as BackgammonPoint

  //       // console.log('Play.move -> move.origin', move.origin)
  //       // console.log('Play.move -> player', player)

  //       // move.destination = board.points.find(
  //       //   (p) => p.position[player.direction] === destinationPosition
  //       // ) as BackgammonPoint

  //       // const results = Move.move(board, move, false)
  //       // move = results.move as BackgammonMove
  //       // if (!move) throw new Error('Move not found')
  //       // board = results.board
  //       // moves = moves.map((m) =>
  //       //   m.id === move!.id ? move : m
  //       // ) as BackgammonMoves // FIXME: squirelly cast
  //       play = {
  //         ...play,
  //         stateKind: 'moving',
  //         player,
  //         moves,
  //       }

  //       return {
  //         play,
  //         board,
  //       }
  //     case 'bar':
  //       move.origin = origin as BackgammonBar
  //       break
  //     default:
  //       throw new Error('Invalid origin')
  //   }

  //   return {
  //     play,
  //     board,
  //   }
  // }

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
        m.origin = o
        const newM = Move.move(newBoard, m, true)
        validMoves.add(newM.move)
      })
    })

    return validMoves
  }
}
