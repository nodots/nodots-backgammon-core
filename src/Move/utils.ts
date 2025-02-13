import { Move } from '.'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonOff,
  BackgammonPlayerMoving,
  BackgammonPoint,
} from '../../types'

export function getDestination(
  origin: BackgammonCheckercontainer,
  board: BackgammonBoard,
  player: BackgammonPlayerMoving,
  dieValue: BackgammonDieValue
): BackgammonPoint | BackgammonOff | undefined {
  const direction: BackgammonMoveDirection = player.direction
  // console.log('getDestination', { origin, board, player, dieValue })
  switch (origin.kind) {
    case 'point':
      const point = origin as BackgammonPoint
      const destinationPosition = point.position[direction] - dieValue
      return board.points.find(
        (p) =>
          p.position[direction] === destinationPosition &&
          Move.isPointOpen(p, player)
      )
    case 'bar':
    // return this.getBarDestination(origin, player, dieValue)
    case 'off':
    // return this.getOffDestination(origin, player, dieValue)
    // console.log('Bar and off not implemented')
  }
}
