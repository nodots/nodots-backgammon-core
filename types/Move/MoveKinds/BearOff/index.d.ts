import { BackgammonBoard, BackgammonMoveOrigin, BackgammonMoveReady, BackgammonMoveResult, BackgammonPlayerMoving } from '@nodots-llc/backgammon-types';
export declare class BearOff {
    private static hasCheckersOutsideHomeBoard;
    static isA: (board: BackgammonBoard, player: BackgammonPlayerMoving) => boolean;
    static move: (board: BackgammonBoard, move: BackgammonMoveReady, origin: BackgammonMoveOrigin) => BackgammonMoveResult;
}
//# sourceMappingURL=index.d.ts.map