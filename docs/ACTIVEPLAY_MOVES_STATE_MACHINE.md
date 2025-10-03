# ActivePlay.moves State Machine - CRUCIAL MEMORY

## Core Understanding

**CRITICAL**: The game state is determined by `activePlay.moves`, NOT by counting "dice used". Each move in activePlay.moves represents a specific die value and has its own state machine.

## Move States

Each move in `activePlay.moves` can be in one of these states:
- `ready`: Move is available to be executed
- `in-progress`: Move is being processed
- `completed`: Move has been successfully executed
- `confirmed`: Move has been confirmed (final state)

## Play Setup Process

When a player rolls dice, an elaborate move setup routine creates `activePlay.moves`:

1. **Die Values**: Each move is associated with a specific die value
2. **Move Creation**: For each die value, a move object is created
3. **Possible Moves Calculation**: Each move calculates its possible destinations
4. **State Management**: Moves progress through states as they are executed

## State Assessment Rules

### Game Can Accept Moves When:
- `activePlay.moves` contains moves in `ready` state
- At least one move has `possibleMoves` available for the clicked checker

### Turn is Complete When:
- ALL moves in `activePlay.moves` are in `completed` or `confirmed` state
- OR all remaining `ready` moves have no possible moves available

### Invalid State Conditions:
- No `activePlay` exists
- `activePlay.moves` is empty
- No moves in `ready` state AND no moves can be made

## Move Execution Flow

1. Player clicks checker
2. System finds moves in `ready` state
3. System filters by checker's container ID
4. If exactly 1 move available → execute it
5. Move transitions: `ready` → `in-progress` → `completed`
6. Process repeats until all moves are completed

## Key Insight

**The "dice used up" concept is WRONG**. The correct approach is:
- Check if any moves in `activePlay.moves` are in `ready` state
- Check if those ready moves have possible destinations
- Only when NO ready moves exist OR no possible moves available should the turn be considered complete

This is fundamental to proper game state management.