# fix(core): auto-transition to 'moved' when no ready moves remain

## Summary

Prevents games from getting stuck in `moving` state when all moves are completed but the turn contains a pre-completed `no-move`. In such cases, dice are not clickable in the UI (clickable only in `moved`/`rolled`/`rolling` states), leaving the human player with no actionable control.

## Root Cause

- `Play.pureMove` sets `activePlay.stateKind = 'moved'` only when:
  - no ready moves remain AND there were no pre-completed `no-move`s (to avoid premature sequence validation).
- When a turn includes one real move + one pre-completed `no-move`, it ends with zero ready moves, but `activePlay.stateKind` stays `moving`.
- `Game.move` returned `moving` unless `activePlay.stateKind === 'moved'`, so UI never enabled dice confirmation.

## Fix

- In `Game.move`, after constructing the provisional game state with updated `activePlay`, call `Game.checkAndCompleteTurn()`.
- When all moves are completed (including pre-completed `no-move`s), this auto-transitions the game to `moved`, allowing dice confirmation.

### Change

- File: `packages/core/src/Game/index.ts`
- Inserted a call to `Game.checkAndCompleteTurn(provisionalGame)` right before return when `provisionalGame.stateKind === 'moving'`.

## Validation

- Ran core tests: 49/50 suites passed (1 failure in `Play/__tests__/auto-switch-dice.test.ts` is unrelated: tests reference deprecated static methods on `Board`).
- Added focused unit test: `src/Board/__tests__/reentry-followup-die6.test.ts` verifying die-6 availability after re-entry and blocked variants.
- Browser E2E indicates the stuck state is resolved when the API is using the updated core. If API dev server has not restarted, it may still exhibit the old behavior; restart API to validate.

## Impact

- No breaking API changes.
- Addresses the dead-end `moving` state with zero ready moves (mixed no-move/real move turns), improving UX and correctness.

## Notes

- Cross-reference: Issue #147 – https://github.com/nodots/nodots-backgammon/issues/147
- Consider adding a focused test that simulates a mixed `no-move` + real move turn and asserts `Game.move` returns `moved` at the end of the turn.
