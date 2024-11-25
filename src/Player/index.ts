import {
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayers,
} from '../../types'

export const getActivePlayer = (
  activeColor: BackgammonColor,
  players: BackgammonPlayers
): BackgammonPlayer => {
  const player = players.find((player) => player.color === activeColor)
  if (!player) throw new Error('Player not found')
  return player
}

export const getPlayerForMoveDirection = (
  players: BackgammonPlayers,
  direction: BackgammonMoveDirection
): BackgammonPlayer => getPlayerForMoveDirection(players, direction)

export const getClockwisePlayer = (players: BackgammonPlayers) =>
  players.find((p) => p.direction === 'clockwise')

export const getCounterclockwisePlayer = (players: BackgammonPlayers) =>
  players.find((p) => p.direction === 'counterclockwise')
