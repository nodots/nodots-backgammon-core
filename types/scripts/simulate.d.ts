export declare function runSimulation(maxTurns?: number): Promise<void | {
    winner: 'white' | 'black' | null;
    turnCount: number;
    executedMoves: number;
    totalMoves: number;
    noMoves: number;
    gnuColor: 'white' | 'black';
    gnuHintsAttempted: number;
    gnuHintsMatched: number;
    nodotsOpeningChosen: number;
    nodotsStrategicChosen: number;
    firstMoverColor: 'white' | 'black';
}>;
//# sourceMappingURL=simulate.d.ts.map