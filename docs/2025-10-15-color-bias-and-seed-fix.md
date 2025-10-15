Title: Fix seed handling, add direction-swap option, and run large GNU color-bias sims

Summary
- Fix: Seeding no longer accumulates stale --seed flags across games; simulations now read NODOTS_SEED or the last --seed.
- Feature: Add --swap-directions to flip WHITE/BLACK directions for diagnostics (dev-only; current pipeline assumes default orientation).
- Evidence: Large-batch sims confirm higher BLACK win rate in GNU-vs-GNU and higher GNU win rate as BLACK vs as WHITE.

Changes
- src/scripts/simulate.ts
  - Read seed from env or last --seed= occurrence.
  - Add --swap-directions support (WHITE=CCW, BLACK=CW when enabled).
- src/scripts/simulateBatch.ts
  - Set per-game seed via process.env.NODOTS_SEED instead of pushing to argv.
  - Parse/propagate --swap-directions to workers and simulate.ts.
- src/scripts/workerSim.ts
  - Set per-game seed via env; propagate NODOTS_SWAP_DIRECTIONS=1 when present.
- src/scripts/simulateGnuVsGnu.ts, src/scripts/simulateGnuVsGnuBatch.ts
  - Accept swapDirections and wire to CLI flag.

Key Results (default directions)
- GNU vs GNU (2,000): WHITE 42.9%, BLACK 57.1% (first mover white 47.0%, black 61.2%).
- GNU vs NODOTS (2,000): GNU as WHITE 55.5%; GNU as BLACK 57.3%.

Direction Swap (diagnostic)
- Swapped directions cause pathological runs (e.g., 0% GNU wins, truncated turns), indicating assumptions in mapping/export/flow rely on default WHITE=CW, BLACK=CCW. Treat as dev-only until made direction-agnostic.

Notes
- The earlier 100/0 skews were traced to seed accumulation; this fix stabilizes distributions.

