import { BackgammonGame, BackgammonGameStateKind } from '@nodots-llc/backgammon-types/dist'
import { Board, Cube, Game, Player } from '..'
// Note: Adapter operates on the data shape, not class instances.

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
  game: BackgammonGame | Game,
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

  return {
    ...game,
    createdAt: overrides?.createdAt ?? (game as any).createdAt ?? now,
    // Prefer adapter version unless explicitly overridden
    version: overrides?.version ?? CURRENT_GAME_VERSION,
    // Start from defaults, then merge game-provided and explicit overrides
    rules: { ...DEFAULT_GAME_RULES, ...(game as any).rules, ...overrides?.rules },
    settings: { ...(game as any).settings, ...DEFAULT_GAME_SETTINGS, ...overrides?.settings },
    startTime: overrides?.startTime ?? (game as any).startTime,
    lastUpdate: overrides?.lastUpdate ?? (game as any).lastUpdate ?? now,
    endTime: overrides?.endTime ?? (game as any).endTime,
    gnuPositionId: overrides?.gnuPositionId ?? (game as any).gnuPositionId ?? '',
  } as BackgammonGame
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
export function createMinimalGameData(options?: {
  id?: string
  stateKind?: BackgammonGameStateKind
}): BackgammonGame {
  const id = options?.id ?? 'game-' + Math.random().toString(36).slice(2)
  const stateKind: BackgammonGameStateKind = 'rolling-for-start'

  // Domain factories to ensure valid structures
  const players = [
    Player.initialize('white', 'clockwise', 'inactive', false, 'user-white'),
    Player.initialize('black', 'counterclockwise', 'inactive', false, 'user-black'),
  ] as any
  const board = Board.initialize()
  const cube = Cube.initialize()

  const baseGame = Game.initialize(players, id, 'rolling-for-start', board, cube)
  return gameToGameData(baseGame)
}
