<!-- COVERAGE-START -->
![Statements](https://img.shields.io/badge/Statements-82%25-green?style=flat-square)
![Branches](https://img.shields.io/badge/Branches-69%25-orange?style=flat-square)
![Functions](https://img.shields.io/badge/Functions-84%25-green?style=flat-square)
![Lines](https://img.shields.io/badge/Lines-82%25-green?style=flat-square)
<!-- COVERAGE-END -->

# nodots-backgammon-core

Core game logic implementation for the nodots-backgammon project. This library handles all the game mechanics, move validation, and state management for a backgammon game.

## Overview

The library implements the standard rules of backgammon, including:

- Board initialization and state management
- Move validation and execution
- Support for doubles
- Bar entry and re-entry
- Bearing off
- Pip count tracking

## Installation

```bash
npm i @nodots-llc/backgammon-core
```

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/nodots/nodots-backgammon-core.git
cd nodots-backgammon-core
```

2. Install dependencies:

```bash
npm install
```

3. Run tests:

```bash
npm test
```

## Project Structure

- `src/`
  - `Board/` - Board state management and move validation
  - `Checker/` - Checker (piece) logic and state
  - `Cube/` - Doubling cube implementation
  - `Dice/` - Dice rolling and validation
  - `Game/` - Core game state and flow management
  - `Move/` - Move types and validation
    - `MoveKinds/` - Different types of moves (PointToPoint, BearOff, Reenter)
  - `Play/` - Play state and turn management
  - `Player/` - Player state and management

## Key Concepts

### Board Representation

The board is represented with points numbered 1-24, with two different counting directions:

- Clockwise: Points 1-24 counting clockwise from black's home board
- Counterclockwise: Points 1-24 counting counterclockwise from white's home board

### Move Types

1. **Point to Point**: Regular moves between points
2. **Bear Off**: Moving checkers off the board from the home board
3. **Reenter**: Moving checkers from the bar back onto the board

### Doubles Handling

When a player rolls doubles:

- They get 4 moves of the same value
- Moves can be used by different checkers or the same checker multiple times
- All valid moves must be used if possible

### Improved Move Generation (vNEXT)

- The core library now always generates valid moves for all dice rolls, including doubles.
- Move generation fully analyzes the board state and dice, ensuring all possible moves are found for the player, including when rolling doubles (4 moves).
- If no valid moves are possible for a die, a 'no-move' entry is generated for that die slot.
- This ensures compliance with backgammon rules and prevents the game from getting stuck on doubles or blocked positions.

## API Examples

```typescript
// Initialize a new board
const board = Board.initialize()

// Get possible moves for a player
const possibleMoves = Board.getPossibleMoves(board, player, dieValue)

// Execute a move
const newBoard = Board.moveChecker(board, origin, destination, direction)

// Initialize a play with dice roll
const play = Play.initialize(board, player)
```

## Logging

The backgammon-core package includes comprehensive logging capabilities for debugging game logic and monitoring game state changes. All logs are prefixed with `[Core]` for easy identification.

### Logger Configuration

```typescript
import {
  logger,
  setLogLevel,
  setConsoleEnabled,
  setIncludeCallerInfo,
  type LogLevel,
} from '@nodots-llc/backgammon-core'

// Set log level (debug, info, warn, error)
setLogLevel('debug')

// Disable console output (useful when using external logging)
setConsoleEnabled(false)

// Enable/disable caller information in logs
setIncludeCallerInfo(true)
```

### Log Levels

- **debug**: Detailed debugging information
- **info**: General information about game state changes
- **warn**: Warning messages for potential issues
- **error**: Error messages for game logic failures

### Usage Examples

```typescript
import { logger, debug, info, warn, error } from '@nodots-llc/backgammon-core'

// Log game state changes
logger.info('[Game] Game state changed:', {
  fromState: previousState,
  toState: newState,
  gameId: game.id,
})

// Log move validation
logger.info('[Move] Validating move:', {
  fromPoint: move.from,
  toPoint: move.to,
  checkerId: move.checkerId,
})

// Log warnings
logger.warn('[Move] Invalid move attempted:', {
  reason: validationError,
  move: move,
})

// Log errors
logger.error('[Core] Game logic error:', {
  error: error.message,
  gameId: game.id,
  context: 'move validation',
})
```

### Log Output Format

Logs follow this format:

```
[Core] [2024-01-15T10:30:45.123Z] [INFO] Game state changed | Called from: updateGameState (gameEngine.ts:45)
[Core] [2024-01-15T10:30:46.456Z] [WARN] Invalid move attempted | Called from: validateMove (moveValidator.ts:123)
[Core] [2024-01-15T10:30:47.789Z] [ERROR] Game logic error | Called from: processMove (gameEngine.ts:67)
```

### Environment Configuration

For production environments, you may want to configure logging based on the environment:

```typescript
import { setLogLevel, setConsoleEnabled } from '@nodots-llc/backgammon-core'

// Configure based on environment
if (process.env.NODE_ENV === 'production') {
  setLogLevel('warn') // Only show warnings and errors in production
} else {
  setLogLevel('debug') // Show all logs in development
}

// Optionally disable console if using external logging
if (process.env.DISABLE_CORE_LOGGING === 'true') {
  setConsoleEnabled(false)
}
```

### Logged Events

The logger tracks various game events:

- **Game State Changes**: State transitions, turn changes, game completion
- **Move Operations**: Move validation, execution, and completion
- **Dice Rolling**: Roll results and available moves
- **Rule Validation**: Move legality checks and rule violations
- **Error Handling**: Game logic errors and exception handling
- **Board Operations**: Checker movements and board state changes

## Testing

The project uses Jest for testing. Tests are located in `__tests__` directories next to the code they test.

### Coverage

The test coverage report provides the following metrics:

- **Statements**: Percentage of statements in the code that have been executed.
- **Branches**: Percentage of branches (e.g., if/else statements) that have been taken.
- **Functions**: Percentage of functions that have been called.
- **Lines**: Percentage of lines of code that have been executed.

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Create a pull request

## License

MIT License

Copyright (c) 2025 Ken Riley <kenr@nodots.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
