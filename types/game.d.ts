import { NodotsBoard } from './board'
import { NodotsChecker } from './checker'
import { NodotsCube } from './cube'
import { NodotsRoll, NodotsDice } from './dice'
import { NodotsPlay } from './play'
import { NodotsPlayersPlaying } from './players'

export type NodotsColor = 'black' | 'white'
export type NodotsMoveDirection = 'clockwise' | 'counterclockwise'

export const CHECKERS_PER_PLAYER = 15
export type PointPosition =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24

export type PlayerCheckers = [
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker,
  NodotsChecker
]

export type CheckercontainerPosition = PointPosition | 'bar' | 'off'
export type OriginPosition = PointPosition | 'bar'
export type DestinationPosition = PointPosition | 'off'

export interface NodotsGamePlayer {
  playerId: string
  color: NodotsColor
  direction: NodotsMoveDirection
  pipCount: number
}

export type NodotsPlayers = [NodotsGamePlayer, NodotsGamePlayer]

// GameInitializing should never hit the db. Check the db.ts file for the actual db schema
type _Game = {
  kind: 'initializing' | 'proposed' | 'rolling-for-start' | 'rolling' | 'moving'
  players: NodotsPlayersPlaying
}

export interface NodotsGameInitializing {
  kind: 'initializing'
  players: NodotsPlayers
  board: NodotsBoard
  dice: NodotsDice
  cube: NodotsCube
}

export interface NodotsGameRollingForStart {
  id: string
  kind: 'rolling-for-start'
  players: NodotsPlayers
  board: NodotsBoard
  dice: NodotsDice
  cube: NodotsCube
}

export interface NodotsGameRolling {
  id: string
  kind: 'rolling'
  players: NodotsPlayers
  dice: NodotsDice
  board: NodotsBoard
  cube: NodotsCube
  activeColor: NodotsColor
  activePlay?: NodotsPlay
}

export interface NodotsGameDoubleProposed {
  id: string
  kind: 'double-proposed'
  players: NodotsPlayers
  dice: NodotsDice
  board: NodotsBoard
  cube: NodotsCube
  activeColor: NodotsColor
  activePlay?: NodotsPlay
}

export interface NodotsGameResignationProposed {
  id: string
  kind: 'rolling'
  players: NodotsPlayers
  dice: NodotsDice
  board: NodotsBoard
  cube: NodotsCube
  activeColor: NodotsColor
  activePlay?: NodotsPlay
}
export interface NodotsGameMoving {
  id: string
  kind: 'moving'
  players: NodotsPlayers
  dice: NodotsDice
  board: NodotsBoard
  cube: NodotsCube
  activeColor: NodotsColor
  activeRoll: NodotsRoll
  activePlay?: NodotsPlay
}

export interface NodotsGameOver {
  id: string
  kind: 'over'
  players: NodotsPlayers
  board: NodotsBoard
  cube: NodotsCube
  winningPlayerId: string
}

export type NodotsGame =
  | NodotsGameInitializing
  | NodotsGameRollingForStart
  | NodotsGameRolling
  | NodotsGameMoving
  | NodotsGameDoubleProposed
  | NodotsGameResignationProposed
  | NodotsGameOver

export type NodotsGameActive =
  | NodotsGameRollingForStart
  | NodotsGameRolling
  | NodotsGameMoving
  | NodotsGameDoubleProposed
  | NodotsGameResignationProposed
