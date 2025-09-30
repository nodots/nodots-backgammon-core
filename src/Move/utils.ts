import {
  BackgammonBoard,
  BackgammonCheckerContainer,
  BackgammonDieValue,
  BackgammonOff,
  BackgammonPlayerMoving,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types'

export function getDestination(
  origin: BackgammonCheckerContainer,
  board: BackgammonBoard,
  player: BackgammonPlayerMoving,
  dieValue: BackgammonDieValue
): BackgammonPoint | BackgammonOff | undefined {
  const direction = player.direction
  switch (origin.kind) {
    case 'point':
      const point = origin as BackgammonPoint
      let destinationPosition = point.position[direction] - dieValue
      if (direction === 'clockwise') {
        if (destinationPosition < 1) return undefined
      } else {
        if (destinationPosition > 24) return undefined
      }
      const destination = board.points.find(
        (p) =>
          p.position[direction] === destinationPosition && p.checkers.length < 2
      )
      if (destination) {
        return destination
      } else {
        return undefined
      }
    case 'bar':
      // return this.getBarDestination(origin, player, dieValue)
      return undefined
    case 'off':
      // return this.getOffDestination(origin, player, dieValue)
      // console.log('Bar and off not implemented')
      return undefined
    default:
      return undefined
  }
}
