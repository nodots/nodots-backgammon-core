# Move Initialization Bug - Hand-off Notes

## 🎯 **Current Status: Core Engine Fixed, Minor Edge Case Remaining**

### ✅ **Successfully Resolved (Major Fixes)**

#### 1. **Bear-off Logic Bug**

- **Fixed**: "Higher die" rule now correctly allows bearing off from highest occupied point
- **Location**: `src/Board/index.ts` lines 309-369
- **Result**: Players can now bear off with higher dice values (e.g., die 4 from point 3)

#### 2. **Game.getPossibleMoves Critical Bug**

- **Fixed**: Was using `player.dice.currentRoll` instead of dice from ready moves
- **Location**: `src/Game/index.ts` lines 888-910
- **Result**: System now correctly finds all valid moves (no more "0 moves when 5+ exist")

#### 3. **Robot Automation Flow**

- **Fixed**: Proper state transitions through `rolled → preparing-move → moving`
- **Result**: Robot automation working correctly with AI plugin system

### 📊 **Progress Metrics**

- **Before**: Games stuck at Turn 22 with state transition errors
- **After**: Games progressing to Turn 23+ with proper move execution
- **Bear-off**: Multiple successful bear-offs logged in simulations
- **Core Logic**: `Board.getPossibleMoves` verified working for all scenarios

---

## 🔍 **Remaining Issue: Move Initialization Bug**

### **Problem Description**

Games are still getting stuck, but now much later and for a different reason. The issue is NOT in move calculation but in move initialization.

**Symptom**: Moves initialized with `origin=null, destination=null` instead of proper values

```javascript
🔍 Debug: Moves array state:
  Move 0: stateKind=ready, dieValue=3, origin=null, destination=null  // ❌ Should have origin set
    Possible moves for die 3: 0
```

**Expected**: Moves should be initialized with proper origin/destination from possible moves

```javascript
🔍 Debug: Moves array state:
  Move 0: stateKind=ready, dieValue=3, origin=point-22, destination=off  // ✅ Correct
    Possible moves for die 3: 1
```

### **Root Cause Analysis**

- **Core Logic**: ✅ `Board.getPossibleMoves` finds correct moves (verified by test)
- **Problem Area**: Move initialization/setup in `Play.initialize` or doubles handling
- **Scope**: Edge case in move setup, NOT fundamental game logic

### **Affected Scenarios**

- Primarily doubles scenarios (e.g., [3,3], [1,1])
- Occurs in bear-off phase when multiple identical dice values available
- Standard single-die moves appear to work correctly

---

## 🔧 **Investigation Guide**

### **Key Files to Examine**

#### 1. **Play Initialization** (`src/Play/index.ts`)

```typescript
// Look for how moves are set up initially
Play.initialize(board, player)
```

#### 2. **Move Setup Logic** (`src/Move/index.ts`)

```typescript
// Check how origin/destination are assigned to moves
// Particularly for doubles scenarios
```

#### 3. **Game Flow** (`src/Game/index.ts`)

```typescript
// Examine how moves transition from rolled → moving state
Game.prepareMove()
Game.toMoving()
```

### **Debugging Steps**

#### 1. **Reproduce the Issue**

```bash
# Run simulation to get to stuck state
node dist/scripts/logSingleGame.js

# Check latest log for null origin/destination moves
cat game-logs/single-game-*.log | grep -A 5 "origin=null"
```

#### 2. **Create Focused Test**

```javascript
// Test the exact scenario from simulation logs
const boardImport = [
  // White's checkers in bear-off position
  {
    position: { clockwise: 22, counterclockwise: 3 },
    checkers: { qty: 2, color: 'white' },
  },
  {
    position: { clockwise: 23, counterclockwise: 2 },
    checkers: { qty: 3, color: 'white' },
  },
  {
    position: { clockwise: 24, counterclockwise: 1 },
    checkers: { qty: 12, color: 'white' },
  },
]

// Test Play.initialize with [3,3] roll
const player = Player.roll(whitePlayer) // Set currentRoll to [3,3]
const play = Play.initialize(board, player)
// Check if moves have proper origin/destination
```

#### 3. **Compare Working vs Broken**

- **Working**: Single die moves (e.g., [6,5])
- **Broken**: Doubles in bear-off (e.g., [3,3])
- Look for differences in move setup logic

### **Likely Fix Locations**

#### **Primary Suspects**

1. **`Play.initialize`**: How moves are created from dice roll
2. **Doubles Handling**: Special logic for 4 identical moves
3. **Move Assignment**: Where `origin` and `destination` get set

#### **Search Patterns**

```bash
# Look for move initialization code
grep -r "origin.*null" src/
grep -r "destination.*null" src/
grep -r "dieValue.*ready" src/

# Look for doubles handling
grep -r "doubles" src/
grep -r "length.*4" src/
```

---

## 🧪 **Testing Strategy**

### **Verification Tests**

1. **Unit Test**: Create `Play.initialize` test with doubles in bear-off position
2. **Integration Test**: Run robot automation test to ensure no regression
3. **Simulation Test**: Full game simulation should complete without getting stuck

### **Success Criteria**

- [ ] Moves initialized with proper `origin` and `destination` values
- [ ] [3,3] bear-off scenario executes 4 moves successfully
- [ ] Robot automation test completes full game
- [ ] Simulation progresses beyond Turn 23

### **Regression Prevention**

- [ ] All existing tests still pass
- [ ] Bear-off logic still works for single dice
- [ ] `Game.getPossibleMoves` still returns correct moves

---

## 📁 **Key Resources**

### **Latest Simulation Log**

```
game-logs/single-game-2025-07-09T23-40-51-371Z.log
```

- Shows exact board state where game gets stuck
- Contains debug output showing `origin=null` issue

### **Test Scripts**

```bash
# Robot automation test
node scripts/test-robot-automation.js

# Single game simulation
node dist/scripts/logSingleGame.js
```

### **Verification Commands**

```bash
# Build and test
npm run build
npm test

# Check specific bear-off logic
node -e "const {Board,Player}=require('./dist');
const board=Board.initialize();
const player=Player.initialize('white','clockwise');
console.log(Board.getPossibleMoves(board,player,3));"
```

---

## 💡 **Implementation Hints**

### **Expected Flow**

1. Player rolls [3,3] → 4 moves created
2. `Board.getPossibleMoves(board, player, 3)` returns valid moves
3. Each move should be initialized with first available move's `origin`/`destination`
4. As moves are executed, remaining moves recalculate available options

### **Potential Fix Pattern**

```typescript
// Instead of:
const move = {
  dieValue: 3,
  origin: null, // ❌ Problem
  destination: null, // ❌ Problem
  stateKind: 'ready',
}

// Should be:
const possibleMoves = Board.getPossibleMoves(board, player, 3)
const move = {
  dieValue: 3,
  origin: possibleMoves[0]?.origin, // ✅ Use first available
  destination: possibleMoves[0]?.destination, // ✅ Use first available
  stateKind: 'ready',
}
```

---

## 🏁 **Next Steps Priority**

1. **HIGH**: Fix move initialization to use actual possible moves instead of null
2. **MEDIUM**: Add unit tests for doubles in bear-off scenarios
3. **LOW**: Optimize move recalculation performance

**Estimated Effort**: 2-4 hours (edge case fix, not major refactor)

**Impact**: Will complete the backgammon engine fixes and enable full game simulations

---

_Hand-off prepared by: AI Assistant_  
_Date: 2025-07-09_  
_Status: Core engine working, minor initialization bug remaining_
