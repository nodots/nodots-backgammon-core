export { v4 as generateId } from 'uuid'

export type BackgammonColor = 'black' | 'white'
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'

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

export const isValidUuid = (uuid: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    uuid
  )

export * from './Board'
export * from './Checker'
export * from './Cube'
export * from './Dice'
export * from './Game'
export * from './Move'
export * from './Play'
export * from './Player'
export * from './Robot'

// Export AI plugin system
export * from './AI/AIPluginManager'
export * from './AI/interfaces/AIPlugin'
export * from './AI/plugins/BasicAIPlugin'
export * from './AI/utils/GamePhaseDetector'
export * from './AI/utils/PositionAnalyzer'

// Export logger utilities for consumers to configure
export {
  debug,
  error,
  info,
  logger,
  setConsoleEnabled,
  setIncludeCallerInfo,
  setLogLevel,
  warn,
  type LogLevel,
} from './utils/logger'

// Export serialization utilities for proper Set handling
export {
  deserializeGameState,
  ensureMovesAreArray,
  ensureMovesAreSet,
  serializeGameState,
} from './utils/serialization'

// Re-export all types from @nodots-llc/backgammon-types for convenience
export * from '@nodots-llc/backgammon-types'
export { GameEventEmitter } from './events/GameEventEmitter'
