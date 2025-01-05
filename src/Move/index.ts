import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveStateKind,
  BackgammonPlayerMoving,
} from '../../types'

export class Move implements BackgammonMove {
  id: string = generateId()
  stateKind: BackgammonMoveStateKind = 'initializing'
  player: BackgammonPlayerMoving | undefined = undefined
  origin: BackgammonCheckercontainer | undefined = undefined
  destination?: BackgammonCheckercontainer | undefined = undefined

  public static initialize(
    player: BackgammonPlayerMoving,
    dieValue: BackgammonDieValue
  ): BackgammonMove {
    return {
      id: generateId(),
      stateKind: 'initializing',
      player,
      dieValue,
    }
  }

  public static getValidMoves(
    board: BackgammonBoard,
    player: BackgammonPlayerMoving,
    dieValue: BackgammonDieValue
  ): BackgammonMove[] {
    const moves: BackgammonMove[] = []
    const playerColor = player.color
    const playerDirection = player.direction
    return moves
  }
}
