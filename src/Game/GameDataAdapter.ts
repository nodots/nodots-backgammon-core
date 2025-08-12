import { BackgammonGame } from '@nodots-llc/backgammon-types/dist'
import { Game } from './index'

/**
 * Default game rules following standard backgammon conventions
 */
export const DEFAULT_GAME_RULES = {
  useCrawfordRule: false,
  useJacobyRule: false,
  useBeaverRule: false,
  useRaccoonRule: false,
  useMurphyRule: false,
  useHollandRule: false,
} as const

/**
 * Default game settings for typical gameplay
 */
export const DEFAULT_GAME_SETTINGS = {
  allowUndo: true,
  allowResign: true,
  autoPlay: false,
  showHints: false,
  showProbabilities: false,
} as const

/**
 * Current game version for compatibility tracking
 */
export const CURRENT_GAME_VERSION = '3.7.0'

/**
 * Convert Game class instance to complete BackgammonGame data structure
 * This bridges the gap between runtime game logic and persistence/API requirements
 */
export function gameToGameData(
  game: Game,
  overrides?: {
    createdAt?: Date
    version?: string
    rules?: Partial<typeof DEFAULT_GAME_RULES>
    settings?: Partial<typeof DEFAULT_GAME_SETTINGS>
    startTime?: Date
    lastUpdate?: Date
    endTime?: Date
    gnuPositionId?: string
  }
): BackgammonGame {
  const now = new Date()

  const gameData: BackgammonGame = {
    // Core game properties (from Game class)
    id: game.id,
    stateKind: game.stateKind,
    players: game.players,
    board: game.board,
    cube: game.cube,
    activeColor: game.activeColor,
    activePlay: game.activePlay,
    activePlayer: game.activePlayer,
    inactivePlayer: game.inactivePlayer,

    // Additional required properties
    createdAt: overrides?.createdAt || now,
    version: overrides?.version || CURRENT_GAME_VERSION,
    rules: {
      ...DEFAULT_GAME_RULES,
      ...overrides?.rules,
    },
    settings: {
      ...DEFAULT_GAME_SETTINGS,
      ...overrides?.settings,
    },

    // Optional timing properties
    startTime: overrides?.startTime,
    lastUpdate: overrides?.lastUpdate || now,
    endTime: overrides?.endTime,

    // Dynamic properties (computed lazily to avoid circular dependency)
    gnuPositionId: overrides?.gnuPositionId || '',
  } as BackgammonGame

  return gameData
}

/**
 * Extract core Game class compatible data from BackgammonGame
 * Useful when reconstructing Game instances from persisted data
 */
export function gameDataToGameCore(
  gameData: BackgammonGame
): Pick<
  BackgammonGame,
  | 'id'
  | 'stateKind'
  | 'players'
  | 'board'
  | 'cube'
  | 'activeColor'
  | 'activePlay'
  | 'activePlayer'
  | 'inactivePlayer'
> {
  return {
    id: gameData.id,
    stateKind: gameData.stateKind,
    players: gameData.players,
    board: gameData.board,
    cube: gameData.cube,
    activeColor: gameData.activeColor,
    activePlay: gameData.activePlay,
    activePlayer: gameData.activePlayer,
    inactivePlayer: gameData.inactivePlayer,
  }
}

/**
 * Create a minimal BackgammonGame for testing or development
 */
export function createMinimalGameData(
  coreGame: Partial<
    Pick<BackgammonGame, 'id' | 'stateKind' | 'players' | 'board' | 'cube'>
  >
): BackgammonGame {
  const now = new Date()

  return {
    id: coreGame.id || 'test-game',
    stateKind: coreGame.stateKind || 'rolling-for-start',
    players: coreGame.players || [],
    board: coreGame.board || ({} as any),
    cube: coreGame.cube || ({} as any),
    createdAt: now,
    version: CURRENT_GAME_VERSION,
    rules: DEFAULT_GAME_RULES,
    settings: DEFAULT_GAME_SETTINGS,
    lastUpdate: now,
    gnuPositionId: '',
  } as BackgammonGame
}
