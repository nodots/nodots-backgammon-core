import { Game } from '../index'

describe('isMovable attribute', () => {
  it('should set isMovable to true for checkers that can be moved after rolling dice', () => {
    // Create a new game without auto-rolling for start
    const game = Game.createNewGame(
      { userId: 'player1', isRobot: false },
      { userId: 'player2', isRobot: false }
    )

    // Game should be in rolling-for-start state
    if (game.stateKind !== 'rolling-for-start') {
      throw new Error(
        'Game should be in rolling-for-start state, got: ' + game.stateKind
      )
    }

    // Roll for start
    const rolledForStart = Game.rollForStart(game)

    // Roll the dice
    const movingGame = Game.roll(rolledForStart)

    // Get all movable container IDs from activePlay.moves
    const movableContainerIds: string[] = []
    const movesArray = Array.from(movingGame.activePlay.moves)
    for (const move of movesArray) {
      if (move.stateKind === 'ready' && move.possibleMoves) {
        for (const possibleMove of move.possibleMoves) {
          if (
            possibleMove.origin &&
            !movableContainerIds.includes(possibleMove.origin.id)
          ) {
            movableContainerIds.push(possibleMove.origin.id)
          }
        }
      }
    }

    // Check that checkers in movable containers have isMovable set to true
    let foundMovableChecker = false
    let foundNonMovableChecker = false

    for (const point of movingGame.board.points) {
      for (const checker of point.checkers) {
        if (
          movableContainerIds.includes(point.id) &&
          checker.color === movingGame.activePlayer.color
        ) {
          expect(checker.isMovable).toBe(true)
          foundMovableChecker = true
        } else if (
          !movableContainerIds.includes(point.id) ||
          checker.color !== movingGame.activePlayer.color
        ) {
          expect(checker.isMovable).toBe(false)
          foundNonMovableChecker = true
        }
      }
    }

    // Check bar checkers
    for (const checker of movingGame.board.bar.clockwise.checkers) {
      if (
        movableContainerIds.includes(movingGame.board.bar.clockwise.id) &&
        checker.color === movingGame.activePlayer.color
      ) {
        expect(checker.isMovable).toBe(true)
        foundMovableChecker = true
      } else {
        expect(checker.isMovable).toBe(false)
        foundNonMovableChecker = true
      }
    }

    for (const checker of movingGame.board.bar.counterclockwise.checkers) {
      if (
        movableContainerIds.includes(
          movingGame.board.bar.counterclockwise.id
        ) &&
        checker.color === movingGame.activePlayer.color
      ) {
        expect(checker.isMovable).toBe(true)
        foundMovableChecker = true
      } else {
        expect(checker.isMovable).toBe(false)
        foundNonMovableChecker = true
      }
    }

    // Ensure we found at least some movable checkers (should always be true after rolling)
    expect(foundMovableChecker).toBe(true)
    expect(foundNonMovableChecker).toBe(true)
  })

  it('should have isMovable attribute defined on all checkers', () => {
    // Create a new game that starts in rolling-for-start state
    const game = Game.createNewGame(
      { userId: 'player1', isRobot: true },
      { userId: 'player2', isRobot: false }
    )

    // Check that all checkers have the isMovable attribute defined
    for (const point of game.board.points) {
      for (const checker of point.checkers) {
        expect(typeof checker.isMovable).toBe('boolean')
        expect(checker.isMovable).toBe(false) // Should start as false
      }
    }

    // Check bar checkers
    for (const checker of game.board.bar.clockwise.checkers) {
      expect(typeof checker.isMovable).toBe('boolean')
      expect(checker.isMovable).toBe(false)
    }

    for (const checker of game.board.bar.counterclockwise.checkers) {
      expect(typeof checker.isMovable).toBe('boolean')
      expect(checker.isMovable).toBe(false)
    }
  })
})
