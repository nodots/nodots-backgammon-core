import { BackgammonBoard, BackgammonMoveOrigin, BackgammonMoveReady, BackgammonMoveResult, BackgammonPoint } from '@nodots-llc/backgammon-types';
export declare class PointToPoint {
    static isA: (move: any, origin: BackgammonMoveOrigin) => boolean;
    static getDestination: (board: BackgammonBoard, move: BackgammonMoveReady, origin: BackgammonMoveOrigin) => BackgammonPoint;
    static move: (board: BackgammonBoard, move: BackgammonMoveReady, origin: BackgammonMoveOrigin) => BackgammonMoveResult;
}
//# sourceMappingURL=index.d.ts.map