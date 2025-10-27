import { BackgammonGame, BackgammonGameMoving, BackgammonGameRolledForStart, BackgammonGameRollingForStart } from '@nodots-llc/backgammon-types';
export interface EngineOptions {
    seed?: number;
    fast?: boolean;
}
export declare class EngineRunner {
    private opts;
    private rng;
    constructor(opts?: EngineOptions);
    init(): BackgammonGameRollingForStart;
    rollForStart(state: BackgammonGameRollingForStart): BackgammonGameRolledForStart;
    rollToMoving(state: BackgammonGameRolledForStart): BackgammonGameMoving;
    step(game: BackgammonGameMoving): BackgammonGame;
    runUntilWin(maxTurns?: number): {
        game: BackgammonGame;
        turns: number;
    };
}
//# sourceMappingURL=engine.d.ts.map