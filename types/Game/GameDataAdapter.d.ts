import { BackgammonGame, BackgammonGameStateKind } from '@nodots-llc/backgammon-types';
import { Game } from '..';
/**
 * Default game rules following standard backgammon conventions
 */
export declare const DEFAULT_GAME_RULES: {
    readonly useCrawfordRule: false;
    readonly useJacobyRule: false;
    readonly useBeaverRule: false;
    readonly useRaccoonRule: false;
    readonly useMurphyRule: false;
    readonly useHollandRule: false;
};
/**
 * Default game settings for typical gameplay
 */
export declare const DEFAULT_GAME_SETTINGS: {
    readonly allowUndo: true;
    readonly allowResign: true;
    readonly autoPlay: false;
    readonly showHints: false;
    readonly showProbabilities: false;
};
/**
 * Current game version for compatibility tracking
 */
export declare const CURRENT_GAME_VERSION = "3.7.0";
/**
 * Convert Game class instance to complete BackgammonGame data structure
 * This bridges the gap between runtime game logic and persistence/API requirements
 */
export declare function gameToGameData(game: BackgammonGame | Game, overrides?: {
    createdAt?: Date;
    version?: string;
    rules?: Partial<typeof DEFAULT_GAME_RULES>;
    settings?: Partial<typeof DEFAULT_GAME_SETTINGS>;
    startTime?: Date;
    lastUpdate?: Date;
    endTime?: Date;
    gnuPositionId?: string;
}): BackgammonGame;
/**
 * Extract core Game class compatible data from BackgammonGame
 * Useful when reconstructing Game instances from persisted data
 */
export declare function gameDataToGameCore(gameData: BackgammonGame): Pick<BackgammonGame, 'id' | 'stateKind' | 'players' | 'board' | 'cube' | 'activeColor' | 'activePlay' | 'activePlayer' | 'inactivePlayer'>;
/**
 * Create a minimal BackgammonGame for testing or development
 */
export declare function createMinimalGameData(options?: {
    id?: string;
    stateKind?: BackgammonGameStateKind;
}): BackgammonGame;
//# sourceMappingURL=GameDataAdapter.d.ts.map