# nodots-backgammon-core

[![codecov](https://codecov.io/gh/nodots/nodots-backgammon-core/graph/badge.svg?token=cda6ea64-c598-4b15-a76d-1b8763968fe7)](https://codecov.io/gh/nodots/nodots-backgammon-core)
[![Statements](https://img.shields.io/codecov/c/github/nodots/nodots-backgammon-core/main.svg?style=flat-square&label=Statements)](https://codecov.io/gh/nodots/nodots-backgammon-core)
[![Branches](https://img.shields.io/codecov/c/github/nodots/nodots-backgammon-core/main.svg?style=flat-square&label=Branches)](https://codecov.io/gh/nodots/nodots-backgammon-core)
[![Functions](https://img.shields.io/codecov/c/github/nodots/nodots-backgammon-core/main.svg?style=flat-square&label=Functions)](https://codecov.io/gh/nodots/nodots-backgammon-core)
[![Lines](https://img.shields.io/codecov/c/github/nodots/nodots-backgammon-core/main.svg?style=flat-square&label=Lines)](https://codecov.io/gh/nodots/nodots-backgammon-core)

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

## Testing

The project uses Jest for testing. Tests are located in `__tests__` directories next to the code they test.

### Coverage

The test coverage report provides the following metrics:

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
