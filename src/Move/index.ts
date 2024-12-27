import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonCheckercontainer,
  BackgammonColor,
  BackgammonMoves,
  BackgammonMoveStateKind,
  BackgammonOff,
  BackgammonPoint,
  BackgammonRoll,
  MoveMoving,
  BackgammonPlayerReady,
} from '../../types'

export const _buildMoves = (
  player: BackgammonPlayerReady,
  roll: BackgammonRoll
): BackgammonMoves => {
  const move1 = {
    id: generateId(),
    stateKind: 'initializing' as BackgammonMoveStateKind,
    player,
    dieValue: roll[0],
    direction: player.direction,
    isAuto: false,
    isForced: false,
  }
  const move2 = {
    id: generateId(),
    stateKind: 'initializing' as BackgammonMoveStateKind,
    player,
    dieValue: roll[1],
    direction: player.direction,
    isAuto: false,
    isForced: false,
  }
  if (player.dice.isDoubles(roll)) {
    return [move1, move2, move1, move2]
  } else {
    return [move1, move2]
  }
}

export const getDestinationForOrigin = (
  board: BackgammonBoard,
  origin: BackgammonCheckercontainer,
  move: MoveMoving
): BackgammonPoint | BackgammonOff | void => {
  if (origin.checkers.length === 0) return
  const color = origin.checkers[0].color
  switch (origin.kind) {
    case 'off':
      console.error('Cannot move from off')
      break
    case 'bar':
      console.error('Not implemented')
      break
    case 'point':
      const { dieValue, direction } = move
      if (dieValue === undefined) {
        throw new Error('dieValue is undefined')
      }
      const point = origin
      const { position } = point as BackgammonPoint
      const { clockwise, counterclockwise } = position
      let destination: BackgammonPoint | BackgammonOff | undefined
      if (move.direction === 'clockwise') {
        const destinationPosition = clockwise - dieValue
        if (destinationPosition < 0) {
          destination = board.off.clockwise
        } else {
          destination = board.points.find(
            (p) => p.position.clockwise === destinationPosition
          )
          if (!destination) {
            throw new Error('Could not find destination')
          }
        }
      } else if (move.direction === 'counterclockwise') {
        const destinationPosition = counterclockwise - dieValue
        if (destinationPosition < 0) {
          destination = board.off.counterclockwise
        } else {
          destination = board.points.find(
            (p) => p.position.counterclockwise === destinationPosition
          )
          if (!destination) return

          if (!_isPointOpenForColor(destination, color)) {
            return
          }
          return destination
        }
      }
  }

  function _isPointOpenForColor(
    point: BackgammonPoint,
    color: BackgammonColor
  ): boolean {
    const { checkers } = point
    if (checkers.length < 2) return true
    const firstChecker = checkers[0] as BackgammonChecker
    return firstChecker.color === color ? true : false
  }
}
