import { BackgammonColor, BackgammonMoveDirection } from '../types'

export { v4 as generateId } from 'uuid'
export type BackgammonEntity =
  | 'board'
  | 'checker'
  | 'cube'
  | 'player'
  | 'play'
  | 'move'
  | 'game'
  | 'offer'

export const randomBoolean = (): boolean => Math.random() > 0.5

export const randomBackgammonColor = (): BackgammonColor =>
  randomBoolean() ? 'black' : 'white'

export const randomBackgammonDirection = (): BackgammonMoveDirection =>
  randomBoolean() ? 'clockwise' : 'counterclockwise'

export interface BackgammonError extends Error {
  entity: BackgammonEntity
  message: string
}

export * from './Board'
export * from './Checker'
export * from './Cube'
export * from './Dice'
export * from './Game'
export * from './Player'
