# GNU ↔ Nodots Direction Semantics

This package represents each board point with two labels:

- `position.clockwise`: 1..24 in the clockwise coordinate system
- `position.counterclockwise`: 24..1 in the counterclockwise coordinate system

Both coordinate systems are oriented so that **forward movement always decreases the numeric position**.

## Canonical GNU Orientation

GNU Backgammon expects:

- Player **X** = player on roll
- Player **O** = opponent
- X moves in a fixed canonical direction (`GNUBG_X_DIRECTION`, currently `clockwise`)
- Point numbers follow the physical 1–24 layout (point 1 = SE)

When mapping Nodots → GNU:

1. Map the **player on roll** to X (swap colors if needed).
2. If the on-roll player's `direction` differs from `GNUBG_X_DIRECTION`, **mirror** points:
   - `p → 25 - p`

This yields a single canonical frame regardless of color or direction.

See `src/Board/gnuPositionId.ts` for the canonical encoding and `@nodots-llc/gnubg-hints` for hint normalization.

## Mapping GNU Hints to Nodots Moves

GNU hint steps are returned in the **active player's directional coordinate system**. Always match `from`/`to` using the active player's `direction` (no color-based remapping).

## Notes

- The canonical GNU starting Position ID is `4HPwATDgc/ABMA`.
