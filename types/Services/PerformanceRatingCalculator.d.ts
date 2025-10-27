import { BackgammonGame } from '@nodots-llc/backgammon-types';
export interface PRMoveAnalysis {
    player: string;
    moveNumber: number;
    positionId: string;
    moveExecuted: string;
    bestMove: string;
    equityLoss: number;
    errorType: 'none' | 'doubtful' | 'error' | 'blunder' | 'very_bad';
}
export interface PlayerPR {
    player: string;
    totalMoves: number;
    analyzedMoves: number;
    totalEquityLoss: number;
    errors: {
        doubtful: number;
        error: number;
        blunder: number;
        veryBad: number;
    };
    averageEquityLoss: number;
    performanceRating: number;
}
export interface PRCalculationResult {
    gameId: string;
    playerResults: Record<string, PlayerPR>;
    analysisComplete: boolean;
    error?: string;
}
export declare class PerformanceRatingCalculator {
    constructor();
    /**
     * Calculate Performance Rating for all players in a game
     */
    calculateGamePR(gameId: string, gameStates: BackgammonGame[], moveActions: Array<{
        player: string;
        move: any;
        dice?: number[];
    }>): Promise<PRCalculationResult>;
    private analyzeMoveWithGnuBG;
    private extractActualMoveStep;
    private findHintForStep;
    private stepsEqual;
    private formatHint;
    private formatMoveStep;
    /**
     * Classify error type based on equity loss
     */
    private classifyError;
    /**
     * Get skill level description from PR
     */
    static getSkillLevel(pr: number): string;
}
//# sourceMappingURL=PerformanceRatingCalculator.d.ts.map