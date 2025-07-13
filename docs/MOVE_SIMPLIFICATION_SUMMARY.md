# Move System Simplification - Breaking Change

## Problem

The previous move system was overly complex and required the client (API) to construct detailed move objects. The flow was:

1. **Client**: Send `{ checkerId: "abc123" }`
2. **API**: Expected `{ moves: "24-23" }` (string format)
3. **Core Game.move**: Expected `originId` (string)
4. **Core Move.move**: Expected fully constructed `BackgammonMoveReady` object with `player`, `origin`, `dieValue`, `moveKind`, etc.

This created unnecessary complexity where the client had to understand backgammon rules and construct move objects when the core already had all the game state.

## Solution

We've introduced a new simplified method `Move.moveChecker()` that takes minimal input and handles all the logic internally:

### New API

```typescript
Move.moveChecker(gameId: string, checkerId: string, gameLookup: GameLookupFunction)
```

### Benefits

1. **Simplified Client**: Client only needs to send `checkerId`
2. **Encapsulated Logic**: All move validation and construction happens in the core
3. **Better Error Handling**: Clear error messages for invalid moves
4. **Automatic Move Detection**: System determines possible moves automatically
5. **Smart Execution**: If only one move possible, executes it; if multiple, returns options

## Implementation Changes

### Core (`core`)

- **New method**: `Move.moveChecker()` with dependency injection for game lookup
- **New types**: `SimpleMoveResult`, `GameLookupFunction`
- **Helper methods**: `findCheckerInBoard()`, `getPossibleMovesForChecker()`, etc.

### API (`api`)

- **Updated endpoint**: `/games/:id/move` now expects `{ checkerId: string }`
- **Simplified logic**: No more complex move string parsing
- **Better responses**: Returns either executed move or possible moves

### Client (`client`)

- **Simplified event handler**: Just sends checker ID
- **Updated API client**: New parameter structure
- **Better UX**: Handles multiple move scenarios

## Breaking Changes

This is a **complete breaking change**:

- ❌ Old: `{ moves: "24-23" }`
- ✅ New: `{ checkerId: "checker-id-123" }`

## Example Usage

### Before (Complex)

```typescript
// Client had to construct complex move strings
const moveData = { moves: '24-23' }
await api.games.move(gameId, moveData)

// Core required fully constructed move objects
const move: BackgammonMoveReady = {
  id: generateId(),
  player: activePlayer,
  stateKind: 'ready',
  moveKind: 'point-to-point',
  origin: originPoint,
  dieValue: 1,
  possibleMoves: [],
}
```

### After (Simple)

```typescript
// Client just sends checker ID
const moveData = { checkerId: 'checker-123' }
const result = await api.games.move(gameId, moveData)

// Core handles everything internally
const result = await Move.moveChecker(gameId, checkerId, gameLookup)
```

## Response Types

### Single Move Executed

```typescript
{
  success: true,
  game: BackgammonGame // Updated game state
}
```

### Multiple Moves Possible

```typescript
{
  success: true,
  possibleMoves: BackgammonMoveReady[],
  error: "Multiple moves possible. Please specify which move to make."
}
```

### Error

```typescript
{
  success: false,
  error: "Checker not found on board"
}
```

## Testing

- ✅ Error cases: Game not found, wrong state, checker not found, opponent's checker
- ✅ Basic validation logic
- 🚧 TODO: Complete move execution scenarios

## Next Steps

1. Implement multi-move selection UI in client
2. Add comprehensive tests for successful move scenarios
3. Update documentation and examples
4. Consider adding move preview functionality

This change significantly simplifies the developer experience while maintaining all backgammon rule validation and logic within the core system where it belongs.
