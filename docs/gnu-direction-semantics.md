# GNU ↔ Nodots Direction Semantics

This package represents each board point with two labels:

- `position.clockwise`: 1..24 increasing in the clockwise direction
- `position.counterclockwise`: 24..1 decreasing in the clockwise direction

Each player has a `direction` (`clockwise` or `counterclockwise`). When mapping to or from GNU Backgammon:

- Always interpret GNU point indices in the active player's own `direction`.
- Do not flip, invert (25 - n), or reuse the opponent's perspective when resolving a GNU move.
- Bars and offs are also direction-specific and should be read from the player's own containers.

## Exporting Position to GNU

`exportToGnuPositionId(game)` emits the bitstream as follows:

1. Player on roll: points ordered by that player's `direction` (clockwise = 0..23; counterclockwise = 23..0), then that player's bar.
2. Opponent: points ordered by opponent's own `direction`, then opponent's bar.

No cross-perspective conversions are applied. See `src/Board/gnuPositionId.ts` for implementation.

## Mapping GNU Hints to Nodots Moves

In the simulator (`src/scripts/simulate.ts`):

- GNU `from` and `to` fields are matched using the active player's own `direction` only.
- The simulator picks a die whose `possibleMoves` contains the GNU-origin; it prefers origin+destination matches, then origin-only matches.
- If GNU suggests an unplayable step for the remaining dice, the simulator falls back to the first legal ready move to keep the game advancing.

Enable mapping debug logs with:

```
npm run simulate -- --mapping-debug
```

You'll see `[MAPDBG]` traces showing the chosen GNU move, resolved origin/destination IDs, and fallback behavior if triggered.

## Tests

- `src/Board/__tests__/gnuMapping.playerDirectionOnly.test.ts` asserts that the first GNU move origin resolves via the active player's direction and is playable with at least one ready die.

## Known Notes

- A canonical GNU position ID test (`gnuPositionIdCanonical.test.ts`) expects a specific starting PID. The default board import may not match that canonical value depending on orientation; this is unrelated to the direction mapping described here.

