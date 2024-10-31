import { NodotsColor, NodotsMoveDirection } from '../../backgammon-types/game'
import {
  NodotsPlayerPlaying,
  NodotsPlayersPlaying,
} from '../../backgammon-types'

export const getActivePlayer = (
  activeColor: NodotsColor,
  players: NodotsPlayersPlaying
): NodotsPlayerPlaying =>
  activeColor === 'black' ? players.black : players.white

export const getPlayerForMoveDirection = (
  players: NodotsPlayersPlaying,
  direction: NodotsMoveDirection
): NodotsPlayerPlaying => getPlayerForMoveDirection(players, direction)

export const getClockwisePlayer = (players: NodotsPlayersPlaying) =>
  players.black.direction === 'clockwise' ? players.black : players.white

export const getCounterclockwisePlayer = (players: NodotsPlayersPlaying) =>
  players.black.direction === 'clockwise' ? players.white : players.black
