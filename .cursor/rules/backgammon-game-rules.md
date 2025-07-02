# Backgammon Game Rules

## Rules of Backgammon

https://www.bkgm.com/rules.html

## Backgammon Board Position System

**CRITICAL**: Each point on the backgammon board has TWO position numbers - one for each player direction:

- **Clockwise positions**: 1, 2, 3... 24 (clockwise player's perspective)
- **Counterclockwise positions**: 1, 2, 3... 24 (counterclockwise player's perspective)

### Starting Positions

- **Clockwise player** starts with checkers on clockwise positions: 24, 13, 8, 6
- **Counterclockwise player** starts with checkers on counterclockwise positions: 24, 13, 8, 6

### Key Points

- Both players start on their respective "24, 13, 8, 6" but from their own directional perspective
- This is NOT a bug - it's the correct dual numbering system
- Each point object contains: `{ clockwise: X, counterclockwise: Y }`
- Move validation must use the correct positional perspective for each player

### Example

```
Point at top-right of ASCII board:
- Clockwise position: 24 (WHITE's starting position)
- Counterclockwise position: 1 (BLACK's goal position)
```

This dual numbering system is essential for proper move validation and game logic.

## Unified Presentation Layer

**KEY FEATURE**: Every player sees the board as if they are "white moving clockwise" regardless of the actual backend configuration.

### Backend Flexibility

The game can have any combination of:

- White moving clockwise vs counterclockwise
- Black moving clockwise vs counterclockwise
- Any player being human or robot
- Any starting positions

### Frontend Consistency

Every player always sees:

- Their checkers as "white" moving clockwise
- Their home board as positions 1-6 (bottom right)
- Their outer board as positions 7-12 (bottom left)
- Opponent's outer board as positions 13-18 (top left)
- Opponent's home board as positions 19-24 (top right)

### Benefits

- Eliminates cognitive load of "which direction am I moving?"
- No need to mentally flip the board
- Consistent, intuitive view for all players
- Backend can handle any game configuration while frontend presents unified experience

This presentation abstraction is a key differentiator of Nodots Backgammon.

## Play/Move Game Flow

Understanding the critical game flow is essential for debugging move-related issues:

1. **Game.roll()** creates new Play instance → becomes activePlay in Game
2. **Play.initialize()** creates moves (2 for regular roll, 4 for doubles) with possibleMoves populated
3. **Empty possibleMoves** = 'no-move', completed automatically
4. **Non-empty possibleMoves** = player selects from options (humans click checkers, robots auto-select first)
5. **Move execution** updates activePlay.moves to track consumed dice

When debugging move issues, always check: activePlay state, moves array, possibleMoves population, and dice consumption tracking.

## Game Creation Requirements

Backgammon games MUST be created with exactly 2 players and ONLY 2 players are permitted:

1. The POST /games endpoint requires `{ player1: { userId: "id1" }, player2: { userId: "id2" } }` in the request body
2. Both `player1.userId` and `player2.userId` are required and must be different
3. There is NO addPlayer endpoint - players cannot be added after game creation
4. Use `api.games.start(player1Id, player2Id)` not `api.games.create()` for creating games with players
5. The `api.games.create()` method (no parameters) is invalid and will result in 400 errors

This ensures all games have the required two players from creation and prevents incomplete game states.
