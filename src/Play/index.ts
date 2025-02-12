import { generateId, Player } from '..'
import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonCube,
  BackgammonMove,
  BackgammonMoveReady,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
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

  public static initialize({
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

  public static roll(
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

    this.getValidMoves(board, moves)

    return {
      ...play,
      stateKind: 'rolled',
      player,
      moves,
    }
  }

  // public static move(
  //   board: BackgammonBoard,
  //   play: BackgammonPlayRolled | BackgammonPlayMoving,
  //   origin: BackgammonPoint | BackgammonBar
  // ): BackgammonPlayMoving {
  //   const { moves } = play
  //   // const move = moves.find((m) => m.stateKind === 'moving')
  //   // if (!move) {
  //   //   throw new Error('Move not found')
  //   // }
  //   // moves
  //   return {
  //     ...play,
  //     stateKind: 'moving',
  //     moves,
  //   }
  // }

  public static getValidMoves(
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

    moves.forEach((m: BackgammonMove) => {
      origins.map((o) => {
        m.origin = o
        const newM = Move.move(newBoard, m, true)
        validMoves.add(newM.move)
      })
    })

    return validMoves
  }
}
