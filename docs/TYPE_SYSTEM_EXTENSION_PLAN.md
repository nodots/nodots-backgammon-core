# Type System Extension Plan for Undo Functionality

## Executive Summary

This document outlines a comprehensive plan to extend the Nodots Backgammon type system to support preserving `activePlay` data across state transitions, enabling robust undo/redo functionality.

## Problem Statement

Currently, when a player completes their turn, the `activePlay` data is cleared (`undefined` or `null`), making it impossible to undo moves after the turn transitions to the next player. The type system enforces this limitation by not allowing completed play states to be passed through game state transitions.

## Proposed Solution Architecture

### 1. New Type Definitions

#### A. Extended Play State Types

```typescript
// In @nodots-llc/backgammon-types/src/play.ts

/**
 * Represents activePlay that has been preserved for undo functionality
 */
export interface BackgammonPlayPreserved {
  stateKind: 'preserved'
  id: string
  player: BackgammonPlayer
  board: BackgammonBoard
  moves: BackgammonMoves
  preservedAt: string // ISO timestamp
  preservedForPlayer: BackgammonColor // Which player can undo this
  undoDepth: number // How many turns back this is (0 = most recent)
}

/**
 * Extended union type that includes preserved state
 */
export type BackgammonPlayExtended = 
  | BackgammonPlayRolling
  | BackgammonPlayRolled
  | BackgammonPlayMoving
  | BackgammonPlayMoved
  | BackgammonPlayCompleted
  | BackgammonPlayPreserved
```

#### B. Enhanced Game State Types

```typescript
// In @nodots-llc/backgammon-types/src/game.ts

/**
 * Game state that supports undo functionality
 */
export interface BackgammonGameWithUndo extends BackgammonGame {
  activePlay?: BackgammonPlayExtended
  undoStack?: BackgammonPlayPreserved[] // Historical plays for undo
  redoStack?: BackgammonPlayPreserved[] // For redo functionality
}

/**
 * Specific game states with undo support
 */
export interface BackgammonGameRollingWithUndo extends BackgammonGameRolling {
  activePlay?: BackgammonPlayRolling | BackgammonPlayPreserved
  undoStack?: BackgammonPlayPreserved[]
}
```

#### C. Move State Extensions

```typescript
// In @nodots-llc/backgammon-types/src/move.ts

export interface BackgammonMoveWithHistory extends BackgammonMove {
  stateKind: 'ready' | 'in-progress' | 'completed' | 'preserved' | 'undone'
  moveHistory?: {
    previousBoardState: CompressedBoardState
    hitCheckers?: BackgammonChecker[]
    executionTimestamp: string
    undoMetadata?: {
      canUndo: boolean
      undoChainIndex: number
      originalMoveId: string
    }
  }
}
```

### 2. Core Package Updates

#### A. Update Game.initialize Signature

```typescript
// In @nodots-llc/backgammon-core/src/Game/index.ts

public static initialize = function initializeGame(
  players: BackgammonPlayers,
  id: string = generateId(),
  stateKind: BackgammonStateKind,
  board: BackgammonBoard,
  cube: BackgammonCube,
  activePlay?: BackgammonPlayExtended, // Changed from specific union
  activeColor: BackgammonColor = players[0].color,
  activePlayer?: BackgammonPlayerActive,
  inactivePlayer?: BackgammonPlayerInactive,
  undoStack?: BackgammonPlayPreserved[], // New parameter
  redoStack?: BackgammonPlayPreserved[] // New parameter
): BackgammonGameWithUndo
```

#### B. Preserve ActivePlay in Transitions

```typescript
// In confirmTurn, checkAndCompleteTurn, etc.

// Instead of:
const preservedActivePlay = undefined

// Use:
const preservedActivePlay: BackgammonPlayPreserved = {
  ...completedActivePlay,
  stateKind: 'preserved',
  preservedAt: new Date().toISOString(),
  preservedForPlayer: game.activeColor,
  undoDepth: 0
}

// Update undo stack
const updatedUndoStack = [
  preservedActivePlay,
  ...(game.undoStack || []).map(play => ({
    ...play,
    undoDepth: play.undoDepth + 1
  }))
].slice(0, MAX_UNDO_DEPTH) // Keep last N turns
```

#### C. Enhanced Undo Function

```typescript
public static undoLastMove = function undoLastMove(
  game: BackgammonGameWithUndo
): {
  success: boolean
  error?: string
  game?: BackgammonGameWithUndo
  undoneMove?: BackgammonMoveWithHistory
} {
  // Support undo from any state if undo stack exists
  if (game.undoStack && game.undoStack.length > 0) {
    const lastPlay = game.undoStack[0]
    
    // Verify the requesting player can undo this play
    if (lastPlay.preservedForPlayer !== game.activeColor) {
      return {
        success: false,
        error: 'Cannot undo opponent\'s moves'
      }
    }
    
    // Restore the game state
    const restoredGame = restoreFromPreservedPlay(game, lastPlay)
    
    return {
      success: true,
      game: restoredGame
    }
  }
  
  // Fallback to existing logic for backward compatibility
  if (game.stateKind === 'moving' || game.stateKind === 'moved') {
    // ... existing undo logic
  }
  
  return {
    success: false,
    error: 'No moves available to undo'
  }
}
```

### 3. API Package Updates

#### A. Enhanced Serialization

```typescript
// In @nodots-llc/backgammon-api/src/utils/serialization.ts

export function serializeGameWithUndo(game: BackgammonGameWithUndo): any {
  return {
    ...serializeGameState(game),
    activePlay: game.activePlay ? serializePlayExtended(game.activePlay) : null,
    undoStack: game.undoStack?.map(serializePlayPreserved) || [],
    redoStack: game.redoStack?.map(serializePlayPreserved) || []
  }
}

function serializePlayPreserved(play: BackgammonPlayPreserved): any {
  return {
    ...play,
    moves: Array.from(play.moves),
    // Compress board state for efficiency
    board: compressBoardState(play.board)
  }
}
```

#### B. Database Schema Updates

```sql
-- Add columns to games table
ALTER TABLE games 
ADD COLUMN undo_stack JSONB DEFAULT '[]',
ADD COLUMN redo_stack JSONB DEFAULT '[]',
ADD COLUMN max_undo_depth INTEGER DEFAULT 3;

-- Add index for performance
CREATE INDEX idx_games_undo_data ON games ((undo_stack IS NOT NULL));
```

#### C. WebSocket Protocol Updates

```typescript
// New WebSocket message types
interface UndoStateUpdateMessage {
  type: 'undo-state-update'
  gameId: string
  canUndo: boolean
  undoDepth: number
  canRedo: boolean
  redoDepth: number
}

interface UndoExecutedMessage {
  type: 'undo-executed'
  gameId: string
  restoredState: BackgammonGameWithUndo
  undoneMove: BackgammonMoveWithHistory
}
```

### 4. Client Package Updates

#### A. Enhanced Game State Handling

```typescript
// In @nodots-llc/backgammon-client/src/utils/transformGameData.ts

export function transformGameDataWithUndo(data: any): BackgammonGameWithUndo {
  const transformed = transformGameData(data) as BackgammonGameWithUndo
  
  // Handle undo/redo stacks
  if (data.undoStack) {
    transformed.undoStack = data.undoStack.map(deserializePlayPreserved)
  }
  
  if (data.redoStack) {
    transformed.redoStack = data.redoStack.map(deserializePlayPreserved)
  }
  
  return transformed
}
```

#### B. Updated Undo Button Logic

```typescript
// In UndoButton component
const canUndo = React.useMemo(() => {
  // Check undo stack first
  if (game.undoStack && game.undoStack.length > 0) {
    const lastPlay = game.undoStack[0]
    return lastPlay.preservedForPlayer === currentPlayer.color
  }
  
  // Fallback to existing logic
  if (game.stateKind === 'moving' || game.stateKind === 'moved') {
    const moves = Array.from(game.activePlay?.moves || [])
    return moves.some(m => m.stateKind === 'completed')
  }
  
  return false
}, [game, currentPlayer])
```

### 5. Migration Strategy

#### Phase 1: Type Definitions (Week 1)
1. Add new type definitions to @nodots-llc/backgammon-types
2. Ensure backward compatibility with existing types
3. Publish new version of types package

#### Phase 2: Core Implementation (Week 2)
1. Update Game.initialize to accept extended types
2. Implement preservation logic in state transitions
3. Enhance undo function to use preserved data
4. Add comprehensive unit tests

#### Phase 3: API Integration (Week 3)
1. Update serialization/deserialization
2. Add database migrations
3. Implement WebSocket protocol changes
4. Add integration tests

#### Phase 4: Client Updates (Week 4)
1. Update data transformation utilities
2. Enhance UI components for undo/redo
3. Add e2e tests for all edge cases
4. Performance optimization

### 6. Performance Considerations

#### Memory Management
- Limit undo stack depth (default: 3 turns)
- Compress board states using efficient encoding
- Clear undo stack on game completion

#### Network Optimization
- Only send undo stack changes, not full stack
- Use efficient binary encoding for board states
- Implement delta compression for sequential states

### 7. Configuration Options

```typescript
interface UndoConfiguration {
  enabled: boolean
  maxUndoDepth: number // Max turns to keep in history
  allowUndoAfterDoubling: boolean
  allowUndoInTournamentMode: boolean
  compressUndoData: boolean
}
```

### 8. Success Metrics

- ✅ Undo works after turn transitions
- ✅ Supports multiple undo levels
- ✅ Handles all edge cases (doubles, hits, bearing off)
- ✅ Performance impact < 5% on game operations
- ✅ Network payload increase < 10%
- ✅ Full backward compatibility maintained

## Conclusion

This type system extension provides a robust foundation for implementing comprehensive undo/redo functionality while maintaining type safety and backward compatibility. The phased approach ensures each component can be tested thoroughly before proceeding to the next phase.