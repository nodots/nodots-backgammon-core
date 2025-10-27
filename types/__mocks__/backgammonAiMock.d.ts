import type { HintRequest, MoveHint } from '@nodots-llc/gnubg-hints';
export declare const gnubgHints: {
    initialize: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    configure: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    isAvailable: import("jest-mock").Mock<() => Promise<boolean>>;
    getBuildInstructions: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getMoveHints: import("jest-mock").Mock<(_request?: HintRequest, _maxHints?: number) => Promise<MoveHint[]>>;
    getBestMove: import("jest-mock").Mock<() => Promise<MoveHint | null>>;
    getDoubleHint: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getTakeHint: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    shutdown: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare class GnubgHintsIntegration {
}
export declare const buildHintContextFromGame: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
export declare const buildHintContextFromPlay: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
export declare const getContainerKind: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
export declare const getNormalizedPosition: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
//# sourceMappingURL=backgammonAiMock.d.ts.map