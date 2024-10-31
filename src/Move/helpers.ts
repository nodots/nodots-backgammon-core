import {
  CHECKERS_PER_PLAYER,
  DieValue,
  NodotsBoard,
  NodotsCheckercontainer,
  NodotsColor,
  NodotsGamePlayer,
  Off,
  Point,
} from '../../@types'
import { getCheckercontainers } from '../Board'

export const getOriginsForColor = (
  board: NodotsBoard,
  color: NodotsColor
): NodotsCheckercontainer[] => {
  return board.bar[color].checkers.length > 0
    ? [board.bar[color]]
    : getCheckercontainers(board).filter(
        (checkercontainer) =>
          checkercontainer.checkers.length > 0 &&
          checkercontainer.checkers[0].color === color
      )
}

export const getDestinationForOrigin = (
  board: NodotsBoard,
  player: NodotsGamePlayer,
  origin: NodotsCheckercontainer,
  dieValue: DieValue
): Off | Point | undefined => {
  const mostDistantPointPosition = getMostDistantOccupiedPointPosition(
    board,
    player
  )
  switch (origin.kind) {
    case 'point':
      const originPoint = origin as Point
      const opp = originPoint.position[player.direction]
      const delta = dieValue * -1
      const dpp = opp + delta
      const destinationPoint = board.points.find(
        (point) => point.position[player.direction] === dpp
      )

      if (!destinationPoint) {
        return undefined
      } else {
        if (
          destinationPoint.checkers.length < 2 ||
          destinationPoint.checkers[0].color === player.color
        ) {
          return destinationPoint
        }
      }
      break
    case 'bar':
      const reentryPosition = 25 - dieValue
      const reentryPoint = board.points.find((point) => {
        return point.position[player.direction] === reentryPosition
      }) as Point // FIXME
      if (
        reentryPoint.checkers.length > 1 &&
        reentryPoint.checkers[0].color !== player.color
      ) {
        return undefined
      }
      return reentryPoint
    case 'off':
    default:
      break
  }
}

const getMostDistantOccupiedPointPosition = (
  board: NodotsBoard,
  player: NodotsGamePlayer
) => {
  if (board.bar[player.color].checkers.length > 0) return 25 // Player is on the bar
  const occupiedPoints = board.points.filter(
    (point) =>
      point.checkers.length > 0 && point.checkers[0].color === player.color
  )

  const mostDistantPoint =
    player.direction === 'clockwise'
      ? occupiedPoints[occupiedPoints.length - 1]
      : occupiedPoints[0]
  return mostDistantPoint.position[player.direction]
}

export const isReentering = (
  board: NodotsBoard,
  player: NodotsGamePlayer
): boolean => (board.bar[player.color].checkers.length > 0 ? true : false)

export const getOriginPointById = (board: NodotsBoard, id: string): Point => {
  const point = board.points.find((point) => point.id === id)
  if (!point) {
    throw new Error(`Could not find point for id ${id}`)
  }
  return point
}

// export const isMoveSane = (payload: NodotsMovePayload): boolean => {
//   const { checker, origin, destination, state } = payload
//   const { board, player } = state
//   if (board.bar[player.color].checkers.length > 0 && origin.kind !== 'bar') {
//     console.error(`${player.username} has checkers on the bar`)
//     return false
//   }

//   if (
//     destination &&
//     destination.checkers &&
//     destination.checkers.length > 1 &&
//     destination.checkers[0].color !== checker.color
//   ) {
//     console.warn(`destination point occupied`)
//     return false
//   }

//   if (checker.color !== player.color) {
//     console.error(`Not ${player.username}'s checker`)
//     return false
//   }

//   return true
// }

// export const isMoveHit = (payload: NodotsMovePayload): boolean => {
//   const { checker, destination } = payload

//   if (
//     destination.checkers.length === 1 &&
//     destination.checkers[0].color !== checker.color
//   )
//     return true

//   return false
// }

export const isBearOffing = (
  board: NodotsBoard,
  player: NodotsGamePlayer
): boolean => {
  const homeBoardPoints = board.points.filter(
    (point) => point.position[player.direction] <= 6
  )
  const homeBoardCheckerCount = homeBoardPoints
    .map((point) =>
      point.checkers.length > 0 && point.checkers[0].color === player.color
        ? point.checkers.length
        : 0
    )
    .reduce((a, b) => a + b, 0)

  const offCheckerCount = board.off[player.color].checkers.length
  const checkerCount = homeBoardCheckerCount + offCheckerCount + 1 // +1 to include checker in play
  return checkerCount === CHECKERS_PER_PLAYER ? true : false
}

const gameStateKey = 'nodots-game-state'
const getGameStateKey = (gameId: string) => `${gameStateKey}-${gameId}`

const resetGameState = (gameId: string): void =>
  localStorage.removeItem(getGameStateKey(gameId))

// export const getGameHistory = (
//   gameId: string
// ): NodotsGameStateHistoryEvent[] => {
//   console.log(gameId)
//   const gameStateKey = getGameStateKey(gameId)
//   console.log(gameStateKey)
//   return []
// }

// export type ActiveMoveState = GameMoving | GameConfirmingPlay
// export const getCurrentPlay = (state: ActiveMoveState): NodotsMove[] => {
//   console.log('[Move Helpers] getCurrentPlay state:', state)
//   return []
// }

// export const getLastMove = (
//   state: GameMoving | GameConfirmingPlay
// ): NodotsMove | undefined => {
//   console.log('[Move Helpers] getLastMove state:', state)
//   return undefined
// }

// export const getPlaysForRoll = (
//   board: NodotsBoard,
//   roll: Roll,
//   activeColor: NodotsColor
// ) => {}

// export const buildMove = (
//   gameState: NodotsGameState,
//   player: NodotsPlayer,
//   dieValue: DieValue
// ): MoveInitializing => {
//   return {
//     ...state,
//
//     kind: 'move-initializing',
//     isAuto: player.automation.move,
//     isForced: false,
//     player,
//     direction: player.direction,
//     dieValue,
//   }
// }

// export const buildMoves = (
//   gameState: NodotsGameState,
//   player: NodotsPlayer,
//   roll: Roll
// ): MoveInitializing[] => {
//   const moveCount = roll[0] === roll[1] ? 4 : 2
//   const moves: MoveInitializing[] = []
//   for (let i = 0; i < moveCount; i++) {
//     const move = buildMove(state, player, roll[i % 2])
//     moves.push(move)
//   }
//   return moves
// }
