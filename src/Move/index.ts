import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonCheckercontainer,
  BackgammonDieValue,
  BackgammonMove,
  BackgammonMoveDirection,
  BackgammonMoveStateKind,
  BackgammonPlayerMoving,
  BackgammonRoll,
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
    roll: BackgammonRoll
  ): BackgammonMove[] {
    const origins: BackgammonCheckercontainer[] = []
    const moves: BackgammonMove[] = []
    const direction: BackgammonMoveDirection = player.direction

    const bar = board.bar[direction]

    if (bar.checkers.length > 0) console.warn('bar checkers not implemented')

    board.points.forEach((point, index) => {
      if (
        point &&
        point.checkers[0] &&
        point.checkers[0].color === player.color
      ) {
        origins.push(point)
      }
    })

    origins.forEach((origin) => {
      console.log('origin.position:', origin.position)

      const position =
        origin.position[direction as keyof typeof origin.position]
      const destinationPosition = position + roll[0]
      console.log('destinationPosition:', destinationPosition)
      // const destinationIndex = origin.index + direction * roll.currentRoll[0]
      // const destination = board.points[destinationIndex]

      // if (destination) {
      //   if (
      //     destination.checkers.length < 2 ||
      //     destination.checkers[0].color === player.color
      //   ) {
      //     moves.push({
      //       id: generateId(),
      //       stateKind: 'valid',
      //       player,
      //       origin,
      //       destination,
      //     })
      //   }
      // }
    })
    // for (let i = 0; i < board.length; i++) {
    //   const container = board[i]
    //   if (container.color === playerColor) {
    //     const destinationIndex = i + playerDirection * dieValue
    //     if (destinationIndex >= 0 && destinationIndex < board.length) {
    //       const destinationContainer = board[destinationIndex]
    //       if (
    //         destinationContainer.color === playerColor ||
    //         destinationContainer.color === null ||
    //         (destinationContainer.color !== playerColor &&
    //           destinationContainer.checkers.length === 1)
    //       ) {
    //         moves.push({
    //           id: generateId(),
    //           stateKind: 'valid',
    //           player,
    //           origin: container,
    //           destination: destinationContainer,
    //           dieValue,
    //         })
    //       }
    //     }
    //   }
    // }

    return moves
  }
}
