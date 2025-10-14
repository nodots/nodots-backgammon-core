# Robot Turn Automation Update — 2025-10-10

This document summarizes the backend changes to robot turn execution in the core package. The goal was to consolidate all robot turn logic into a single function, improve reliability around dice auto-switching, and use GNU Backgammon (gnubg) hints for move selection with strict error handling.

## Summary

- Consolidated robot automation into `Game.executeRobotTurn` (no scattered handlers).
- Added strict GNU-based move selection via `@nodots-llc/gnubg-hints`.
- Removed non-GNU fallbacks; failures during hint generation or mapping now throw.
- Functional-style refactor for clarity and testability.
- Strengthened Play mechanics to preserve completed moves and re-evaluate remaining moves deterministically.
- Added support for being called from `'rolling'` or `'moving'` states.

## Changes

### 1) `Game.executeRobotTurn`

- Single entry point for a robot turn (now exported from `src/Game/executeRobotTurn.ts`).
- Accepts a `BackgammonGame` and supports two entry states:
  - `'rolling'`: rolls dice inline, initializes Play, then executes moves
  - `'moving'`: executes moves directly
- Uses `exportToGnuPositionId` + `GnuBgHints.getHintsFromPositionId()` to obtain the move sequence.
- For each suggested move:
  - Maps a valid origin (bar or point) from the current board using the active player’s direction.
  - Applies the move via `Play.move`.
- After all moves complete, auto-confirms the turn to the next player’s `'rolling'` state.
- Strict errors (no fallback):
  - Missing dice (when required)
  - No valid hints/moves from gnubg
  - Invalid origin mapping (e.g., no checker of active color at origin)

Notes:
- We currently do not force the exact gnubg destination in order to play well with core’s auto-switch logic. The Play layer can accept a destination ID (see below), but executeRobotTurn uses origin-based execution for stability. This keeps gnubg as the selector and core as the enforcer of legal dice ordering.

### 2) `Play` improvements

- `Play.move(board, play, origin, desiredDestinationId?)`
  - New optional parameter `desiredDestinationId` threads through planning to allow exact origin+destination matching when desired.
  - By default, the planner selects a legal move for the chosen origin using intelligent dice auto-switching.
- `executePlannedMove` simplified to:
  - Preserve already completed-with-move entries from prior steps in the same turn (fixes die value accounting across multi-move turns).
  - Re-evaluate non-executed moves (ready and previously completed no-moves) on the updated board to derive a deterministic next state.
  - Update dice order consistently when auto-switching occurs.

### 3) FP-style helpers in `executeRobotTurn`

- `isAllCompleted`, `hasAnyReady`, `getCurrentRollOrThrow`, `getGnuMovesOrThrow`, `findOriginOrThrow`, `applyGnuMove`, `confirmToNextRolling`.
- Small, pure functions to keep branching minimal and behavior explicit.

## Behavior

- After a human confirms their turn, if the next active player is a robot:
  - If the game is in `'rolling'`, `executeRobotTurn` rolls dice and executes all legal moves.
  - If the game is in `'moving'`, `executeRobotTurn` executes all legal moves.
  - On completion, the game transitions to the next player’s `'rolling'` state (auto-confirmed), with board `isMovable` flags reset.

## Integration Guidance

- Server/API should call `Game.executeRobotTurn(game)` immediately after any transition that yields a robot active player in `'rolling'` or `'moving'`.
- No need to call `Game.roll()` beforehand — `'rolling'` is handled directly.
- Watch logs for: `🤖 [executeRobotTurn] Starting robot turn`.

## Testing

- Targeted tests:
  - `src/Game/__tests__/executeRobotTurn.test.ts`
  - `src/Game/__tests__/robot-turn-integration.test.ts`
- Full test suite passes after these changes.
- Auto-switch comprehensive scenarios remain stable (preserves prior completed moves; re-evaluates remaining moves).

## Trade-offs and Next Steps

- Destination fidelity: gnubg provides `[from, to]`. To reduce friction with core’s dice auto-switching, we currently select by origin and let Play enforce legal ordering. If product requires exact destination adherence, we can opt-in via `desiredDestinationId` and extend tests accordingly.
- Doubling cube: unchanged by this PR; still a future integration with AI/gnubg signals.
- Logs: added concise info logs around gnubg suggestions and turn completion to aid diagnosis.

---

Last updated: 2025-10-10

