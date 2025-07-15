# Coding Standards and Best Practices

## Architecture and Separation of Concerns

### Game Logic Separation

ALL game logic must reside in core. The API layer should ONLY:

1. Accept information about current state and proposed state changes
2. Pass these to core for validation and execution
3. Return results or errors from core
4. Handle persistence and API concerns

Never implement game rules, move validation, or game state logic in the API layer. This separation ensures consistency and testability.

### API Client Usage

ALWAYS use the configured apiClient (`api.*` methods) instead of raw fetch() calls in the frontend:

1. Use `api.games.*` for all game-related operations (create, start, roll, move, etc.)
2. Use `api.users.*` for all user-related operations
3. Never use raw `fetch()` calls to the backend API endpoints
4. The apiClient handles authentication, error handling, and consistent request formatting
5. This ensures type safety and consistent error handling across the application

Example: Use `api.games.rollForStart(gameId)` not `fetch('/games/${gameId}/roll-for-start')`

## Type Safety and Dependencies

### Official Types Package

ALWAYS use types from `@nodots-llc/backgammon-types` package - NEVER redefine local types:

1. Import all game-related types from `@nodots-llc/backgammon-types`
2. Use `BackgammonGame`, `BackgammonPlayer`, `BackgammonBoard`, etc. from the official package
3. NEVER create local interfaces that duplicate package types (e.g., don't create `GameState` when `BackgammonGame` exists)
4. Use package types for all API responses, state management, and type annotations
5. Only create local interfaces for UI-specific state that doesn't exist in the package
6. This ensures type consistency between frontend, backend, and prevents state transition bugs

Example: Use `BackgammonGame` not local `GameState` interface

## Programming Style

### Functional Programming Over Imperative

Avoid if/then statements when possible - they are code smell in functional programming:

1. Use early returns instead of nested if/else chains
2. Prefer switch statements with early returns for state machines
3. Use ternary operators for simple conditional assignments
4. Leverage array methods (.map, .filter, .find, .some, .every) over imperative loops
5. Use object/map lookups instead of long if/else chains
6. Extract complex conditions into well-named boolean variables or functions

Example: `const isValidMove = dice.includes(dieValue) && !isBlocked` instead of nested ifs
