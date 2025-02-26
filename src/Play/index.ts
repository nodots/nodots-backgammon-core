import { generateId, Player } from '..'
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
} from '../../types'

export interface PlayProps {
  id?: string
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves?: BackgammonMoves
  player: BackgammonPlayerRolling | BackgammonPlayerMoving
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
    const rolledPlayer = Player.roll(rollingPlayer) as BackgammonPlayerRolled
    const moves = Play.buildMoves(rolledPlayer)

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

    const originPoints = board.points.filter(
      (p) => p.checkers.length > 0 && p.checkers[0]?.color === player.color
    )
    const originBar = board.bar[player.direction]

    const simulateMove = (
      board: BackgammonBoard,
      move: BackgammonMoveReady
    ) => {
      const newBoard = JSON.parse(JSON.stringify(board)) as BackgammonBoard
      const origin = move.origin as BackgammonPoint | BackgammonBar
      const destination = move.destination as BackgammonPoint
      if (origin.kind === 'point') {
        const originPoint = newBoard.points.find(
          (p) =>
            p.position[player.direction] === origin.position[player.direction]
        )
        const checkerToMove = originPoint?.checkers.pop()
        if (!checkerToMove) throw new Error('Checker not found')
        destination.checkers.push(checkerToMove)
      } else if (origin.kind === 'bar') {
        const checkerToMove = newBoard.bar[player.direction].checkers.pop()
        if (!checkerToMove) throw new Error('Checker not found')
        destination.checkers.push(checkerToMove)
      }

      return newBoard
    }

    const addValidMove = (
      move: BackgammonMoveReady,
      board: BackgammonBoard
    ) => {
      const possibleMove = { ...move }
      const dieValue = move.dieValue
      const origin = move.origin as BackgammonPoint | BackgammonBar

      if (origin.kind === 'point') {
        const originPosition = origin.position[player.direction]
        const destinationPosition = originPosition + dieValue
        const destination = board.points.find(
          (p) => p.position[player.direction] === destinationPosition
        )
        if (destination) {
          const destinationCheckers = destination.checkers
          if (
            destinationCheckers.length === 0 ||
            destinationCheckers[0]?.color === player.color ||
            destinationCheckers.length === 1
          ) {
            possibleMove.destination = destination
            validMoves.add(possibleMove)
          }
        }
      } else if (origin.kind === 'bar') {
        const destinationPosition = board.points.find(
          (p) => p.position[player.direction] === dieValue
        )
        if (destinationPosition) {
          const destinationCheckers = destinationPosition.checkers
          if (
            destinationCheckers.length === 0 ||
            destinationCheckers[0]?.color === player.color
          ) {
            possibleMove.destination = destinationPosition
            validMoves.add(possibleMove)
          }
        }
      }
    }

    if (originBar.checkers.length > 0) {
      for (const move of moves) {
        move.origin = originBar
        addValidMove(move, board)
      }
    }

    for (const origin of originPoints) {
      for (const move of moves) {
        move.origin = origin
        addValidMove(move, board)
      }
    }

    const finalValidMoves = new Set<BackgammonMove>()
    for (const move of validMoves) {
      const newBoard = simulateMove(board, move as BackgammonMoveReady)
      const remainingMoves = moves.filter((m) => m.id !== move.id)
      const nextValidMoves = Play.getValidMoves(newBoard, remainingMoves)
      if (nextValidMoves.size > 0) {
        finalValidMoves.add(move)
      }
    }

    return finalValidMoves
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
