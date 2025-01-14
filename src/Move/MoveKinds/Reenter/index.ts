import {
  BackgammonBoard,
  BackgammonMove,
  BackgammonPlayerMoving,
} from '../../../../types'

export class Reenter {
  public static isA(board: BackgammonBoard, move: BackgammonMove): boolean {
    const { player } = move
    // const bar = board.bar[player.direction as keyof typeof board.bar]
    // return bar.checkers.length > 0
    return true
  }
}
