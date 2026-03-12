# Handoff: Eliminate `as any` casts in Game/index.ts

Date: 2026-03-11
Status: complete
Branch: feat/chore-eliminate-as-any-casts-in-game-index-ts-with-proper-type-definitions
Issue: https://github.com/nodots/nodots-backgammon-core/issues/100

## What Was Done

- Eliminated all 46 `as any` casts from `src/Game/index.ts` (0 remain)
- Replaced inline move mutations with immutable spread patterns
- Fixed undo stack access to use proper `BackgammonPlayMoving` type narrowing
- Removed unnecessary casts for `offeredThisTurnBy` (already on `BaseCube` type)
- Widened `Game.roll` return type to `BackgammonGameMoving | BackgammonGameMoved`
- Replaced error message casts in `never` contexts with `as unknown as { stateKind: string }`
- Corrected `Player.move` return type from `BackgammonMoveResult` to `BackgammonPlayResult`
- Constructed no-move objects with proper discriminated union types
- Replaced `acceptDouble` casts with `BackgammonGameCompleted` and `BackgammonGameRolling`
- Updated `Sim/engine.ts` to handle widened `Game.roll` return type

## Key Decisions

- Used `as unknown as T` (two-step cast) instead of `as any` where TypeScript's type system cannot narrow automatically (e.g., error messages in exhaustiveness checks, class-to-interface conversion). Each cast includes a comment explaining why.
- Widened `Game.roll` return type rather than keeping it narrow and casting internally. This is more honest about the actual behavior (returns moved state when no legal moves exist).
- Corrected `Player.move` return type to `BackgammonPlayResult` since it delegates to `Play.move` which returns that type. The `.play` field was always present at runtime.
- Used `as BackgammonDieValue` with `!` assertion for `rollForStartValue` in `acceptDouble` since the value is always set by game start but optional on the base type.

## Files Modified

- `src/Game/index.ts` - Eliminated all `as any` casts (46 removed)
- `src/Player/index.ts` - Changed `move` return type to `BackgammonPlayResult`, added import
- `src/Sim/engine.ts` - Updated `rollToMoving` return type to match widened `Game.roll`

## Test Status

- 399 tests pass, 3 fail, 7 skipped (identical to base branch)
- All pre-existing failures are gnubg-hints module not found or pre-existing test issues
- No regressions introduced by these changes

## Notes

- Phase 1 (updating `@nodots-llc/backgammon-types`) was not needed - the types package already had `undo`, `offeredThisTurnBy`, `winType`, and `pointsWon` fields
- Phase 3 (ESLint `no-explicit-any` rule) is in `eslint.config.js` which is in forbiddenPaths for this cell
- The `BackgammonPlayMoving.undo.frames` is typed as `any[]` in the types package to avoid circular dependency on `BackgammonGameMoving` - this is a known limitation documented in play.ts
