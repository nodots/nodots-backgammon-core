# GNU Position ID Fix - Summary

**Date:** 2025-10-16
**Branch:** `kr-fix-gnu-position-id`
**Status:** CORE fix complete, CLIENT issue identified

---

## Problem Statement

Human vs Robot games were broken in the CLIENT package. The root cause was incorrect GNU Position ID encoding in the CORE package, which prevented GNU Backgammon from providing valid move hints.

---

## Key Discoveries

### 1. Board Initialization Was Wrong
**File:** `/packages/core/src/Board/imports/BOARD_IMPORT_DEFAULT.ts`

- **Old positions:** White at clockwise {1, 6, 8, 13}
- **Correct positions:** White at clockwise {6, 8, 13, 24}
- **Reason:** Standard backgammon has 2 checkers at the 24-point (furthest from home), not at the 1-point (ace point)

**Commit:** `ea06270` - "fix: correct BOARD_IMPORT_DEFAULT to use GNU standard positions {6,8,13,24}"

### 2. GNU Position ID Encoding Was Wrong
**File:** `/packages/core/src/Board/gnuPositionId.ts`

#### Issues Found:
1. **Wrong position lookup:** Used array indices instead of `board.points.find(p => p.position[player.direction] === position)`
2. **Wrong encoding method:** Had two encoding functions but was using the wrong one by default
3. **Environment variable confusion:** `NODOTS_GNU_PID_ENCODER` defaulted to 'strict' which used `encodeBase64Six`, but the correct method is `encodeBase64ViaBytesLSB`

#### The Fix:
```typescript
// OLD (wrong):
function getCheckersOnPoint(board, color, index) {
  const point = board.points[index]  // Uses array index
  return point.checkers.filter(c => c.color === color).length
}

// NEW (correct):
function getCheckersOnPoint(board, color, position, direction) {
  const point = board.points.find(p => p.position[direction] === position)
  if (!point) return 0
  return point.checkers.filter(c => c.color === color).length
}
```

```typescript
// Encoding iteration - NEW (correct):
for (let gnuPosition = 0; gnuPosition < 24; gnuPosition++) {
  const nodotsPosition = gnuPosition + 1  // GNU uses 0-23, Nodots uses 1-24
  const checkers = getCheckersOnPoint(board, playerOnRoll.color, nodotsPosition, playerOnRoll.direction)
  bitString += '1'.repeat(checkers) + '0'
}
```

**Commit:** `4f4b6b8` - "fix: correct GNU Position ID encoding to match canonical format"

---

## Critical Understanding

### GNU Backgammon Conventions:
- **White always moves clockwise**
- **Black always moves counterclockwise**
- Position numbering: 0-23 (internally), but displayed as 1-24
- Canonical starting position ID: `4HPwATDgc/ABMA`

### Nodots Board Structure:
- Each point has TWO position numbers: `{ clockwise: X, counterclockwise: Y }`
- Players move from higher numbers to lower numbers
- Position 1 = ace point (bear off position)
- Position 24 = furthest from home (starting position for 2 checkers)
- Formula: `clockwise N = counterclockwise (25 - N)`

### The Golden Rule:
**Always use `point.position[player.direction]` to get the correct position number for that player's perspective.**

---

## What Works Now

1. ✅ **BOARD_IMPORT_DEFAULT** has correct starting positions {6, 8, 13, 24}
2. ✅ **exportToGnuPositionId** produces canonical `4HPwATDgc/ABMA` for starting position
3. ✅ **simulate.ts** continues to work perfectly (thousands of successful robot vs robot games)
4. ✅ **gnuPositionIdCanonical.test.ts** passes
5. ✅ **Robot moves work in API** - GNU Backgammon provides valid hints

---

## Current Issue: CLIENT Board State Not Updating

### Symptoms:
- API logs show robot successfully executes moves
- GNU Backgammon hints are being received and processed correctly
- Moves are applied to game state in the API
- **BUT** CLIENT board display does not update

### API Logs Confirm Success:
```
[AI] gbg-bot Received 10 hints from GNU Backgammon
[AI] gbg-bot Move selected via: GNU Backgammon Engine (hint rank 1)
[Core] Robot executed move 1 with checker [id]
[Core] Robot executed move 2 with checker [id]
[Core] Robot turn complete, automatically confirming turn
```

### What to Investigate (CLIENT Package):
1. **WebSocket events:** Are game state updates being emitted from API?
2. **Event subscription:** Is CLIENT subscribed to the correct WebSocket events?
3. **State management:** Is CLIENT updating its local game state when events arrive?
4. **React context:** Is the game context being properly updated and triggering re-renders?

### Likely Culprits:
- WebSocket event not emitted after robot turn
- CLIENT not listening for the right event
- Game state update not propagating through React context
- Redis/cache synchronization issue between API and CLIENT

---

## Files Changed

### CORE Package:
1. `/packages/core/src/Board/imports/BOARD_IMPORT_DEFAULT.ts`
   - Updated starting positions from {1,6,8,13} to {6,8,13,24}

2. `/packages/core/src/Board/gnuPositionId.ts`
   - Fixed `getCheckersOnPoint` to use `player.direction`
   - Fixed position iteration to use each player's perspective
   - Removed `encodeBase64Six` (unused)
   - Removed `NODOTS_GNU_PID_ENCODER` environment variable
   - Now always uses `encodeBase64ViaBytesLSB` (GNU BG algorithm)

---

## Test Results

### Passing:
- ✅ `gnuPositionIdCanonical.test.ts` - produces correct canonical ID
- ✅ `gnuPositionId.test.ts` - all position ID tests pass
- ✅ `simulate:until-win` - robot vs robot games complete successfully

### Pre-existing Failures (unrelated):
- ❌ Some Player tests (AI package issues)
- ❌ 12 tests total failing (not related to gnuPositionId changes)

---

## Next Steps

1. **Verify WebSocket emissions** in API after robot turn completion
2. **Check CLIENT WebSocket subscriptions** for game state updates
3. **Debug CLIENT game context** to see if state updates are received
4. **Test with browser DevTools** to inspect WebSocket messages
5. **Check Redis cache** to ensure game state is persisted correctly

---

## Reference Documentation

- GNU BG Position ID spec: https://www.gnu.org/software/gnubg/manual/html_node/A-technical-description-of-the-Position-ID.html
- GNU BG source code: `/Users/kenr/Code/gnubg-1.08.003/positionid.c`
- CLAUDE.md rules: `/Users/kenr/Code/nodots-backgammon/CLAUDE.md`

---

## Important Notes

- **DO NOT** change BOARD_IMPORT_DEFAULT back - the current positions {6,8,13,24} are correct
- **DO NOT** revert gnuPositionId.ts changes - the encoding is now correct
- **simulate.ts is the gold standard** - it must always work
- The CLIENT issue is a separate problem from the gnuPositionId fix
- The gnuPositionId fix has successfully enabled robot AI to work with GNU Backgammon
