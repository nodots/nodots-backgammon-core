Title: Make AI/mapping direction-agnostic and validate color/direction bias

Context
Recent work fixed seeding and added a --swap-directions diagnostic. Large runs show a persistent BLACK advantage under default directions. Swapping directions produces pathological outcomes, suggesting implicit assumptions in export/mapping/flow.

Scope
- Stabilize direction swap so WHITE=CCW, BLACK=CW runs behave equivalently to default orientation.
- Re-run large-batch GNU-vs-GNU and GNU-vs-NODOTS with swap to isolate color vs direction effects.

Tasks
- Export/mapping
  - Audit exportToGnuPositionId and hint normalization use-sites to ensure all indices/containers are resolved strictly in the active player’s direction regardless of color.
  - Add tests that simulate both orientations for the same position+roll and assert identical legality + outcomes for move mapping.
- Simulation pipeline
  - Ensure opening-roll/turn-passing are direction-agnostic.
  - Add opening-roll logging and early-position metrics per side (blot hits, builder placements) to investigate bias.
- Instrumentation
  - Expand mapping samples to include die usage ordering and fallback conditions for both frames.
- Experiments
  - After fixes, run 10k games per configuration: GNU-vs-GNU, GNU-vs-NODOTS with GNU as WHITE and as BLACK, both default and swapped directions.
  - Report win rates with confidence intervals and first-mover impact.

Acceptance Criteria
- Swap-direction runs complete without pathological early termination.
- GNU hint-match rates are comparable across orientations.
- Win-rate deltas between default vs swapped orientations are statistically insignificant for the same “side” (controlling for color vs direction).

