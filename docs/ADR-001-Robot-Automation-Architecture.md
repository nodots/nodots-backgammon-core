# ADR-001: Robot Automation Architecture

**Status:** Accepted  
**Date:** 2025-08-03  
**Decision Makers:** Development Team  
**Technical Story:** Robot players never move in human vs robot games - Issue with robot automation triggering

## Context

In human vs robot games, when a human player completes their turn using `Game.confirmTurn()`, the game correctly transitions to the robot player in `'rolling'` state. However, the robot never automatically takes their turn, leaving the game stuck waiting for human input that will never come.

The robot automation was previously (incorrectly) implemented in the database layer (`packages/api/src/db/Games/index.ts`), which violated fundamental software architecture principles by mixing data persistence concerns with business logic.

## Problem Statement

Where should robot automation be triggered when a game transitions to a robot player's turn?

The core issue: `Game.confirmTurn()` transitions the game to the next player but doesn't trigger robot automation. We need to decide where this automation should be handled while maintaining clean architecture principles.

## Decision

**We will implement robot automation at the application layer (API), keeping the CORE domain layer pure.**

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLIENT        │    │       API        │    │      CORE       │
│                 │    │  (Application)   │    │   (Domain)      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ UI Components   │───▶│ REST Endpoints   │───▶│ Pure Functions  │
│ WebSocket       │    │ Robot Automation │    │ Game Logic      │
│ State Display   │    │ Effect Handler   │    │ State Machines  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Implementation Pattern

```typescript
// CORE: Pure domain functions
export class Game {
  public static confirmTurn(game: BackgammonGameMoving): BackgammonGame {
    // Pure state transition - no side effects
    // Returns game with next player in 'rolling' state
  }
}

// API: Application layer handles effects
async function handleTurnConfirmation(game: BackgammonGame): Promise<BackgammonGame> {
  // 1. Execute pure domain logic
  const gameAfterTurnConfirmation = Game.confirmTurn(game)
  
  // 2. Handle robot automation effect at application boundary
  if (gameAfterTurnConfirmation.stateKind === 'rolling' && 
      gameAfterTurnConfirmation.activePlayer?.isRobot) {
    const robotResult = await Robot.makeOptimalMove(gameAfterTurnConfirmation)
    return robotResult.success ? robotResult.game : gameAfterTurnConfirmation
  }
  
  return gameAfterTurnConfirmation
}
```

## Alternatives Considered

### Alternative 1: Robot Automation in CORE (Rejected)

**Approach**: Make `Game.confirmTurn()` async and automatically trigger robot moves within the domain layer.

```typescript
// REJECTED APPROACH
public static async confirmTurn(game: BackgammonGameMoving): Promise<BackgammonGame> {
  const nextGame = // ... pure transition logic
  
  // Robot automation directly in domain layer
  if (nextGame.activePlayer?.isRobot) {
    const robotResult = await Robot.makeOptimalMove(nextGame)
    return robotResult.game
  }
  
  return nextGame
}
```

**Why Rejected:**

1. **Violates Pure Function Principles**: Domain functions become impure with async side effects
2. **Mixing Concerns**: Game state transitions mixed with automation orchestration  
3. **Dependency Issues**: CORE would depend on Robot AI implementation details
4. **Testing Complexity**: Harder to test pure state transitions separately from automation
5. **Unpredictability**: Same input doesn't always produce same output (due to AI decisions)
6. **Performance**: Every turn confirmation becomes async, even for human-to-human games

### Alternative 2: Command Pattern with Effect Description (Considered)

**Approach**: Return effect descriptions instead of executing them.

```typescript
type GameTransitionResult = {
  game: BackgammonGame
  effect?: 'robot-turn-required' | 'human-turn' | 'game-complete'
}

public static confirmTurn(game: BackgammonGameMoving): GameTransitionResult {
  const nextGame = // ... pure transition logic
  return {
    game: nextGame,
    effect: nextGame.activePlayer?.isRobot ? 'robot-turn-required' : 'human-turn'
  }
}
```

**Why Not Chosen**: While architecturally sound, it adds complexity without significant benefits over the simpler "check after transition" approach. The application layer can easily determine if robot automation is needed by inspecting the returned game state.

### Alternative 3: Database Layer Automation (Previously Implemented - Rejected)

**Approach**: Trigger robot automation in database `updateGame()` function.

**Why Rejected:**
- **Massive Architecture Violation**: Database layer should only handle data persistence
- **Violates Single Responsibility**: Database operations shouldn't trigger business logic
- **Circular Dependencies**: Creates DB → CORE → DB dependency cycles
- **Violates Dependency Inversion**: Lower layer (DB) depending on higher layer (Domain)

## Benefits of Chosen Solution

### Functional Programming Alignment
- **Pure Functions**: CORE domain logic remains pure and predictable
- **Separation of Effects**: Side effects isolated to application boundary  
- **Testability**: Can test game logic independent of robot automation
- **Composability**: Pure functions are easier to compose and reason about

### Clean Architecture
- **Single Responsibility**: Each layer has one clear purpose
- **Dependency Direction**: Application depends on Domain, not vice versa
- **Effect Handling**: Side effects handled at appropriate architectural boundary

### Maintainability  
- **Clear Concerns**: Game logic vs automation orchestration are separate
- **Easy Testing**: Unit test pure functions, integration test automation
- **Flexibility**: Can change robot implementation without affecting game logic

## Implementation Plan

1. **Keep `Game.confirmTurn()` pure** - no robot automation in CORE
2. **Implement robot automation in API layer** - in WebSocket handlers and REST endpoints
3. **Pattern**: After any game state transition, check if robot automation is needed
4. **Add comprehensive tests** covering the automation orchestration

## Consequences

### Positive
- Clean separation of concerns
- Pure, testable domain logic  
- Flexible robot automation implementation
- Follows functional programming principles
- Easier to reason about and debug

### Negative  
- Robot automation logic distributed across multiple API endpoints
- Requires discipline to remember robot automation in all game transition points
- Slightly more complex than "do everything in one place" approach

## Compliance

This decision aligns with the project's functional programming guidelines specified in `CLAUDE.md`:
- Prefer pure functions when possible
- Avoid side effects in business logic  
- Use functional composition over inheritance
- Always use switch over if/else (functional programming paradigm)

## Related Decisions

- This decision reverses the previous implementation that placed robot automation in the database layer
- Future robot AI improvements can be made without affecting core game logic
- WebSocket and REST endpoint implementations must consistently apply robot automation pattern

## References

- [Functional Programming Guidelines](../../../CLAUDE.md#functional-programming)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)