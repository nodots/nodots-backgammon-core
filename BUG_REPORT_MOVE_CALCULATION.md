# 🐛 BUG REPORT: Incomplete Move Calculation Logic

**Priority**: HIGH - Breaks core game functionality  
**Component**: `nodots-backgammon-core`  
**Issue**: Move calculation logic only finds moves from 1 position instead of all valid positions  
**Game ID for Testing**: `8d91a665-605d-4672-be4a-6bdcc3093624`

---

## 🎯 **Problem Summary**

The core library's move calculation logic is **missing legal moves** from multiple board positions. When a player has dice [4,4], the system should calculate 16 possible moves (4 dice × 4 positions), but only finds 4 moves from 1 position.

---

## 📋 **Evidence**

### **Expected Behavior**

With white player having dice [4,4] and direction "counterclockwise":

- ✅ Position 6 → 2: 5 white checkers, destination OPEN _(should work)_
- ❌ Position 8 → 4: 3 white checkers, destination OPEN _(should work)_
- ❌ Position 13 → 9: 5 white checkers, destination OPEN _(should work)_
- ❌ Position 24 → 20: 2 white checkers, destination OPEN _(should work)_

### **Actual Behavior**

- ✅ API returns 4 moves from position 6 only
- ❌ No moves calculated from positions 8, 13, or 24
- ❌ `Move.moveChecker()` returns "No legal moves available" for valid checkers

### **Validation Confirms**

All destination positions are **completely open** (0 black checkers), so blocking is not the issue.

---

## 🔧 **Root Cause Analysis**

The bug is in the **move calculation logic**, specifically in how the system:

1. Populates `game.activePlay.moves[].possibleMoves` arrays
2. Determines which checkers can participate in moves for each die value
3. Matches checker positions to available moves

---

## 🎯 **Suspect Code Locations**

### **Primary Suspects**

1. **`Move.moveChecker()` function** (`src/Move/index.ts:59-214`)

   - Lines 135-175: Move matching logic
   - Problem: Only finding moves from 1 position per die value

2. **`Play.initialize()` function** (`src/Play/`)

   - Move generation during play initialization
   - May not be calculating all possible moves

3. **Move calculation in `Game.getPossibleMoves()`**
   - May be filtering out valid moves incorrectly

### **Key Logic Areas**

```typescript
// Around line 150 in Move/index.ts - This filtering may be too restrictive
const matchingPossibleMoves = move.possibleMoves.filter((possibleMove) => {
  const matches = possibleMove.origin.id === container.id
  return matches
})
```

---

## 🧪 **Test Case for Reproduction**

### **Game Setup**

- Game ID: `8d91a665-605d-4672-be4a-6bdcc3093624`
- Player: White (counterclockwise direction)
- Dice: [4,4]
- State: "rolled"

### **Test Commands**

```bash
# This works (✅ expected)
ndbg move 8d91a665-605d-4672-be4a-6bdcc3093624 6

# These fail but should work (❌ bugs)
ndbg move 8d91a665-605d-4672-be4a-6bdcc3093624 8
ndbg move 8d91a665-605d-4672-be4a-6bdcc3093624 13
ndbg move 8d91a665-605d-4672-be4a-6bdcc3093624 24
```

### **API Validation**

```bash
# Check possible moves - only shows 4 moves from position 6
GET /api/v3.2/games/8d91a665-605d-4672-be4a-6bdcc3093624/possible-moves

# Try moving from position 24 - fails with 400 error
POST /api/v3.2/games/8d91a665-605d-4672-be4a-6bdcc3093624/move
{ "checkerId": "197139d7-588e-4db9-8945-7611ff571a25" }
```

---

## 🔍 **Debugging Evidence**

### **Position Analysis**

- **Position 6**: `clockwise: 19, counterclockwise: 6` - 5 white checkers → WORKS ✅
- **Position 8**: `clockwise: 17, counterclockwise: 8` - 3 white checkers → FAILS ❌
- **Position 13**: `clockwise: 12, counterclockwise: 13` - 5 white checkers → FAILS ❌
- **Position 24**: `clockwise: 1, counterclockwise: 24` - 2 white checkers → FAILS ❌

### **Destination Analysis**

- **Position 2**: `clockwise: 23, counterclockwise: 2` - 0 checkers → OPEN ✅
- **Position 4**: `clockwise: 21, counterclockwise: 4` - 0 checkers → OPEN ✅
- **Position 9**: `clockwise: 16, counterclockwise: 9` - 0 checkers → OPEN ✅
- **Position 20**: `clockwise: 5, counterclockwise: 20` - 0 checkers → OPEN ✅

All destinations are completely open - no blocking issues.

---

## 🎯 **Fix Requirements**

### **Expected Fix Outcome**

After fix, `GET /possible-moves` should return **16 moves** for dice [4,4]:

- 4 moves from position 6 → position 2
- 4 moves from position 8 → position 4
- 4 moves from position 13 → position 9
- 4 moves from position 24 → position 20

### **Validation Steps**

1. **Unit Tests**: All 4 starting positions should calculate moves
2. **Integration Tests**: `Move.moveChecker()` should work for all positions
3. **API Tests**: All 16 moves should appear in possible moves
4. **CLI Tests**: All positions should accept move commands

---

## 📝 **Investigation Steps**

1. **Debug `activePlay.moves` structure**

   - Check if moves are being created for all 4 dice values
   - Verify `possibleMoves` arrays are populated correctly

2. **Trace move calculation logic**

   - Follow how moves are generated in `Play.initialize()`
   - Check filtering logic in `Move.moveChecker()`

3. **Validate position matching**

   - Ensure container ID matching works for all positions
   - Check directional position calculations

4. **Test with different dice values**
   - Verify issue exists with other rolls (not just [4,4])
   - Test with single dice vs doubles

---

## 🚨 **Critical Notes**

- **CLI and API are working correctly** - this is purely a core library calculation bug
- **Position lookup logic is correct** - the issue is in move generation, not position finding
- **Game state validation passes** - all preconditions for moves are met
- **No blocking issues** - all destinations are completely open

---

## 📞 **Contact for Questions**

- **Issue Reporter**: Previous agent (debugging session completed)
- **Test Game**: Available at game ID `8d91a665-605d-4672-be4a-6bdcc3093624`
- **Environment**: Development with API v3.2, Core v3.1.5

---

**Status**: Ready for Core Team Investigation  
**Assigned To**: [Next Agent]  
**Created**: 2025-01-27
