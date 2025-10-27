import { BackgammonBoard, BackgammonChecker, BackgammonColor } from '@nodots-llc/backgammon-types';
export declare class Checker {
    static getCheckers: (board: BackgammonBoard) => BackgammonChecker[];
    static initialize: (color: BackgammonColor, checkercontainerId: string) => BackgammonChecker;
    static buildCheckersForCheckerContainerId: (checkercontainerId: string, color: BackgammonColor, count: number) => BackgammonChecker[];
    static getChecker: (board: BackgammonBoard, id: string) => BackgammonChecker;
    static updateMovableCheckers: (board: BackgammonBoard, movableContainerIds: string[]) => BackgammonBoard;
}
//# sourceMappingURL=index.d.ts.map