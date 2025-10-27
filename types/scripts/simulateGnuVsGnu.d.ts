declare function simulateGnuVsGnu(maxTurns?: number, quiet?: boolean, opts?: {
    swapDirections?: boolean;
}): Promise<{
    winner: 'white' | 'black' | null;
    firstMover: 'white' | 'black';
}>;
export { simulateGnuVsGnu };
//# sourceMappingURL=simulateGnuVsGnu.d.ts.map