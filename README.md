<!-- COVERAGE-START -->
![Statements](https://img.shields.io/badge/Statements-81%25-green?style=flat-square)
![Branches](https://img.shields.io/badge/Branches-71%25-yellow?style=flat-square)
![Functions](https://img.shields.io/badge/Functions-80%25-green?style=flat-square)
![Lines](https://img.shields.io/badge/Lines-82%25-green?style=flat-square)
<!-- COVERAGE-END -->

# @nodots-llc/backgammon-core

A comprehensive TypeScript library implementing the complete game logic for backgammon. This package provides all the core mechanics needed to build backgammon applications, including board management, move validation, state machine management, robot player support, and full compliance with official backgammon rules.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
  - [Game State Machine](#game-state-machine)
  - [Board Representation](#board-representation)
  - [Move Types](#move-types)
  - [Doubles Handling](#doubles-handling)
  - [AI Provider System](#ai-provider-system)
- [API Reference](#api-reference)
  - [Game API](#game-api)
  - [Board API](#board-api)
  - [Player API](#player-api)
  - [Logging API](#logging-api)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Simulation Tools](#simulation-tools)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Complete Backgammon Rules** - Full implementation of standard backgammon rules including:
  - Board initialization and state management
  - Move validation and execution
  - Support for doubles (4 moves)
  - Bar entry and re-entry
  - Bearing off with "higher die" rule
  - Pip count tracking
  - Doubling cube support
  - Win condition detection

- **State Machine Architecture** - Robust game state transitions:
  - `rolling-for-start` → `rolled-for-start` → `rolling` → `moving` → `moved` → `completed`
  - Doubling cube states (`doubled`)
  - Automatic state validation

- **Robot Player Support** - Built-in infrastructure for AI players:
  - Pluggable AI provider interface
  - Automatic robot turn execution
  - Integration with GNU Backgammon hints via `@nodots-llc/gnubg-hints`

- **Comprehensive Logging** - Debug and monitor game state with configurable logging

- **TypeScript First** - Full type safety with exported types from `@nodots-llc/backgammon-types`

---

## Installation

```bash
npm install @nodots-llc/backgammon-core
```

### Requirements

- **Node.js** 18 or higher
- **TypeScript** 5.x (for development)
- For robot players using GNU Backgammon hints: a working `node-gyp` toolchain (Python 3, C/C++ build tools)

---

## Quick Start

```typescript
import { Game } from '@nodots-llc/backgammon-core'

// Create a new game (robot vs human)
let game = Game.createNewGame(
  { userId: 'robot-1', isRobot: true },
  { userId: 'human-1', isRobot: false }
)

// Determine starting player with roll-for-start
game = Game.rollForStart(game)

// Active player rolls dice to begin their turn
game = Game.roll(game)

// Execute a complete robot turn (moves + auto confirm)
// Note: Requires an AI provider to be registered
game = await Game.executeRobotTurn(game)

// For human players, use Game.move() with a checker ID
// game = Game.move(game, checkerId)

// After all moves, confirm the turn to pass to next player
// game = Game.confirmTurn(game)
```

---

## Development Setup

1. **Clone the repository:**

```bash
git clone https://github.com/nodots/nodots-backgammon-core.git
cd nodots-backgammon-core
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

4. **Run tests:**

```bash
npm test
```

5. **Run linting:**

```bash
npm run lint
```

---

## Project Structure

```
src/
├── AI/                  # AI provider interfaces for robot players
│   ├── RobotAIProvider.ts    # Interface for implementing AI strategies
│   └── RobotAIRegistry.ts    # Registry for AI provider instances
├── Board/               # Board state management and move validation
│   ├── index.ts              # Board class with move logic
│   ├── ascii.ts              # ASCII board rendering
│   └── gnuPositionId.ts      # GNU Position ID export
├── Checker/             # Checker (piece) logic and state
├── Cube/                # Doubling cube implementation
├── Dice/                # Dice rolling and state management
├── Game/                # Core game state and flow management
│   ├── index.ts              # Game class with all state transitions
│   └── executeRobotTurn.ts   # Robot turn automation
├── History/             # Game history tracking
├── Move/                # Move types and validation
│   └── MoveKinds/            # Move implementations (PointToPoint, BearOff, Reenter)
├── Play/                # Play (turn) state and management
├── Player/              # Player state and pip count calculations
├── Services/            # Utility services
│   ├── PerformanceRatingCalculator.ts
│   └── PositionReconstructor.ts
├── Sim/                 # Game simulation engine
├── events/              # Event emitter for game events
├── utils/               # Utility functions (logger, etc.)
├── constants/           # Game constants
└── index.ts             # Main exports
```

---

## Key Concepts

### Game State Machine

The game progresses through a well-defined state machine:

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
┌─────────────────────┐    ┌─────────────────────┐            │
│  rolling-for-start  │───▶│   rolled-for-start  │            │
└─────────────────────┘    └─────────────────────┘            │
                                     │                         │
                                     ▼                         │
                           ┌─────────────────────┐            │
                     ┌────▶│      rolling        │◀───────────┤
                     │     └─────────────────────┘            │
                     │               │                         │
                     │               ▼                         │
                     │     ┌─────────────────────┐            │
                     │     │       moving        │─────┐      │
                     │     └─────────────────────┘     │      │
                     │               │                 │      │
                     │               ▼                 │      │
                     │     ┌─────────────────────┐     │      │
                     │     │       moved         │─────┤      │
                     │     └─────────────────────┘     │      │
                     │               │                 │      │
                     └───────────────┘                 │      │
                                                       ▼      │
                                             ┌─────────────────────┐
                                             │     completed       │
                                             └─────────────────────┘
```

**State Descriptions:**

| State | Description |
|-------|-------------|
| `rolling-for-start` | Both players rolling to determine who goes first |
| `rolled-for-start` | Starting rolls complete, winner determined |
| `rolling` | Active player's turn to roll dice |
| `doubled` | Double offered, awaiting opponent response |
| `moving` | Active player executing moves |
| `moved` | All moves executed, awaiting turn confirmation |
| `completed` | Game over, winner determined |

### Board Representation

The board uses points numbered 1-24 with two counting directions based on player color:

- **Clockwise**: Points 1-24 counting clockwise
- **Counterclockwise**: Points 1-24 counting counterclockwise

Each player has a home board (points 1-6 from their perspective), a bar for hit checkers, and an off area for borne-off checkers.

### Move Types

| Move Type | Description |
|-----------|-------------|
| **Point to Point** | Regular moves between points on the board |
| **Bear Off** | Moving checkers off the board from the home board |
| **Reenter** | Moving checkers from the bar back onto the board |
| **No Move** | Generated when no valid move exists for a die |

### Doubles Handling

When a player rolls doubles:

- They receive **4 moves** of the same die value
- Moves can be used by different checkers or the same checker multiple times
- All valid moves must be used if possible
- If no valid moves exist for a die, a `no-move` entry is generated

### AI Provider System

The core library supports pluggable AI providers through the `RobotAIProvider` interface:

```typescript
import { RobotAIProvider, RobotAIRegistry } from '@nodots-llc/backgammon-core'

// Implement your AI provider
class MyAIProvider implements RobotAIProvider {
  async executeRobotTurn(game) {
    // Analyze position and execute optimal moves
    // Return game in 'rolling' state for next player
  }

  async selectBestMove(play) {
    // Select best single move from available options
  }
}

// Register the provider
RobotAIRegistry.registerProvider(new MyAIProvider())
```

---

## API Reference

### Game API

```typescript
import { Game } from '@nodots-llc/backgammon-core'

// Create a new game
const game = Game.createNewGame(
  { userId: 'player1', isRobot: false },
  { userId: 'player2', isRobot: true }
)

// Roll for start - determines who goes first
const rolledGame = Game.rollForStart(game)

// Roll dice to begin turn (from rolled-for-start, rolling, or doubled states)
const movingGame = Game.roll(rolledGame)

// Execute a move using a checker ID
const afterMove = Game.move(movingGame, checkerId)

// Move and auto-finalize turn if complete
const afterMoveAndFinalize = Game.moveAndFinalize(movingGame, checkerId)

// Switch dice order (allowed only when all moves are undone)
const switchedGame = Game.switchDice(movingGame)

// Transition from moving to moved state
const movedGame = Game.toMoved(movingGame)

// Confirm turn and pass to next player
const nextPlayerGame = Game.confirmTurn(movedGame)

// Check if turn can be completed
const canComplete = Game.checkAndCompleteTurn(movingGame)

// Robot automation
const afterRobotTurn = await Game.executeRobotTurn(movingGame)

// Doubling cube
const canDouble = Game.canOfferDouble(game, player)
const doubledGame = Game.double(rollingGame)
const accepted = Game.acceptDouble(game, player)
const refused = Game.refuseDouble(game, player)

// Undo within current turn
const canUndo = Game.canUndoActivePlay(game)
const previousState = Game.undoLastInActivePlay(game)

// State restoration
const restoredGame = Game.restoreState(savedState)

// Validation helpers
Game.canRoll(game)           // Check if rolling is allowed
Game.canRollForStart(game)   // Check if roll-for-start is allowed
Game.canPlayerRoll(game, playerId)  // Check if specific player can roll
Game.canGetPossibleMoves(game)      // Check if move calculation is valid
```

### Board API

```typescript
import { Board } from '@nodots-llc/backgammon-core'

// Initialize a new board with standard setup
const board = Board.initialize()

// Create board for specific players
const board = Board.createBoardForPlayers(clockwiseColor, counterclockwiseColor)

// Get possible moves for a player with a specific die value
const possibleMoves = Board.getPossibleMoves(board, player, dieValue)

// Move a checker from origin to destination
const newBoard = Board.moveChecker(board, origin, destination, direction)

// Get all checkers on the board
const checkers = Board.getCheckers(board)

// ASCII representation for debugging
import { ascii } from '@nodots-llc/backgammon-core'
console.log(ascii(board))
```

### Player API

```typescript
import { Player } from '@nodots-llc/backgammon-core'

// Initialize a player
const player = Player.initialize(
  'white',           // color
  'clockwise',       // direction
  'rolling-for-start', // initial state
  false,             // isRobot
  'user-123'         // userId
)

// Roll for start
const rolledPlayer = Player.rollForStart(player)

// Roll dice
const rolledDice = Player.roll(player)

// Move a checker
const { board, move } = Player.move(board, play, checkerContainerId)

// Recalculate pip counts
const updatedPlayers = Player.recalculatePipCounts(game)
```

### Logging API

All logs are prefixed with `[Core]` for easy filtering:

```typescript
import {
  logger,
  setLogLevel,
  setConsoleEnabled,
  setIncludeCallerInfo,
  debug,
  info,
  warn,
  error,
  type LogLevel,
} from '@nodots-llc/backgammon-core'

// Set log level: 'debug' | 'info' | 'warn' | 'error'
setLogLevel('debug')

// Disable console output (useful with external logging)
setConsoleEnabled(false)

// Enable/disable caller information in logs
setIncludeCallerInfo(true)

// Use the logger
logger.info('Game state changed:', { gameId, newState })
logger.warn('Invalid move attempted:', { move, reason })
logger.error('Game logic error:', { error, context })

// Or use convenience functions
debug('Detailed debug info')
info('General information')
warn('Warning message')
error('Error message')
```

**Log Output Format:**

```
[Core] [2024-01-15T10:30:45.123Z] [INFO] Game state changed | Called from: updateGameState (Game/index.ts:45)
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODOTS_LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`) | `info` |
| `NODOTS_LOG_SILENT` | Set to `1` to disable all console logging | - |
| `NODOTS_LOG_CALLER` | Set to `1` to include caller info, `0` to disable | `1` |
| `NODE_ENV` | Environment (`production`, `development`) | - |

**Production Configuration Example:**

```typescript
// Recommended production settings
if (process.env.NODE_ENV === 'production') {
  setLogLevel('warn')  // Only warnings and errors
} else {
  setLogLevel('debug') // Full debugging in development
}
```

---

## Testing

The project uses **Jest** for testing. Tests are colocated with source code in `__tests__` directories.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test by name
npm run test:single "test name pattern"
```

### Coverage Metrics

| Metric | Description |
|--------|-------------|
| **Statements** | Percentage of statements executed |
| **Branches** | Percentage of if/else branches taken |
| **Functions** | Percentage of functions called |
| **Lines** | Percentage of lines executed |

---

## Simulation Tools

The package includes scripts for simulating games, useful for testing and AI development:

```bash
# Simulate a single game
npm run simulate:game

# Simulate multiple games
npm run simulate:multiple

# Debug a single game with detailed output
npm run simulate:debug

# Batch simulation (fast, quiet mode)
npm run simulate:batch

# GNU vs GNU AI simulation
npm run simulate:gnu-vs-gnu
npm run simulate:gnu-vs-gnu-batch
```

### Alternative Runners (npm bypass)

If you encounter npm environment issues:

```bash
# Build without npm
node scripts/run-build.js

# Run simulators without npm
node scripts/run-simulate.js [maxTurns]
node scripts/run-simulate-multiple.js [numGames]
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Branch Workflow:**
   - Create feature branches from `development`
   - Open PRs to merge into `development`
   - Releases merge `development` into `main`

2. **Pull Request Process:**
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/my-feature`)
   - Make changes with tests
   - Run the test suite (`npm test`)
   - Run linting (`npm run lint`)
   - Create a pull request

3. **Code Standards:**
   - Use TypeScript strict mode
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

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
