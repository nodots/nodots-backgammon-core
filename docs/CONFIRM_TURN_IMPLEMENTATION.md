# Confirm Turn Implementation

## Overview

The confirm turn functionality allows users to manually confirm their completed moves by clicking on the dice, transferring control to the next player. This implementation differentiates between human and robot players:

- **Human players**: Must manually confirm their turns after making moves
- **Robot players**: Turns are automatically completed when no legal moves remain

## Key Methods Added

### `Game.canConfirmTurn(game: BackgammonGame): boolean`

Checks if the current turn can be confirmed. A turn can be confirmed when:

1. Game is in 'moving' state
2. Player has used all available dice OR chooses to end turn early
3. No more legal moves are available for remaining dice

**Returns:** `true` if turn can be confirmed, `false` otherwise

### `Game.confirmTurn(game: BackgammonGameMoving): BackgammonGame`

Manually confirms the current turn and passes control to the next player. This method:

1. Validates the game state (must be 'moving')
2. Checks if the turn can be confirmed
3. Marks any remaining ready moves as 'no-move'
4. Transitions to the next player's turn

**Returns:** Updated game state with the next player's turn

## Modified Behavior

### Automatic Turn Completion

The existing automatic turn completion logic has been modified to only apply to robot players:

- **Before**: All players had turns automatically completed when no legal moves remained
- **After**: Only robot players have turns automatically completed; human players must use `confirmTurn()`

### `Game.getPossibleMoves()`

Modified to only auto-complete turns for robot players when no legal moves remain.

### `Game.executeAndRecalculate()`

Modified to only auto-complete turns for robot players after moves are executed.

## Usage Flow

### For Human Players

1. Player makes moves during their turn (game state: 'moving')
2. Player clicks on dice to confirm turn
3. UI calls `Game.canConfirmTurn(game)` to check if confirmation is allowed
4. If allowed, UI calls `Game.confirmTurn(game)` to complete the turn
5. Game transitions to next player's turn (state: 'rolling')

### For Robot Players

1. Robot makes moves during their turn (game state: 'moving')
2. When no legal moves remain, turn is automatically completed
3. Game transitions to next player's turn (state: 'rolling')

## Example Implementation

```typescript
// Check if turn can be confirmed
if (Game.canConfirmTurn(currentGame)) {
  // Player can confirm turn - show visual indication
  showConfirmTurnIndicator()

  // On dice click event
  const onDiceClick = () => {
    if (Game.canConfirmTurn(currentGame)) {
      // Confirm the turn
      const updatedGame = Game.confirmTurn(currentGame)
      setCurrentGame(updatedGame)

      // Handle robot turn if next player is robot
      if (updatedGame.activePlayer.isRobot) {
        handleRobotTurn(updatedGame)
      }
    }
  }
}
```

## Benefits

1. **Manual Control**: Human players have full control over when to end their turn
2. **Strategic Flexibility**: Players can choose to end their turn early if desired
3. **Clear Intent**: Explicit confirmation prevents accidental turn endings
4. **Consistent UX**: Dice clicking serves dual purpose (roll dice + confirm turn)
5. **Robot Efficiency**: Automated turn completion for robot players maintains game flow

## State Management

The implementation maintains the existing state flow while adding the manual confirmation step:

```
rolled-for-start → rolling → rolled → preparing-move → moving → (confirm turn) → rolling (next player)
```

For human players, the turn remains in 'moving' state until manually confirmed.
For robot players, the turn automatically transitions when no legal moves remain.
