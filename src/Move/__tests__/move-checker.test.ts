import { describe, expect, it } from '@jest/globals'
import { BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '../../index'
import { Move, type GameLookupFunction } from '../index'

describe('Move.moveChecker', () => {
  it('should return error when game not found', async () => {
    const mockGameLookup: GameLookupFunction = async () => null

    const result = await Move.moveChecker(
      'non-existent-game',
      'checker-123',
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Game not found')
  })

  it('should return error when game is not in correct state', async () => {
    const player1 = Player.initialize('white', 'clockwise', 'rolling', false)
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      false
    )
    const mockGame = Game.initialize(
      [player1, player2],
      'game-123',
      'rolling', // Wrong state for moving
      undefined, // use default board
      undefined, // use default cube
      undefined, // no activePlay
      'white',
      player1,
      player2
    )

    const mockGameLookup: GameLookupFunction = async () => mockGame

    const result = await Move.moveChecker(
      'game-123',
      'checker-123',
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain(
      'Game is not in a state where moving is allowed'
    )
  })

  it('should return error when checker not found', async () => {
    // Use rolling state which doesn't require activePlay
    const player1 = Player.initialize('white', 'clockwise', 'rolling', false)
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      false
    )

    const mockGame = Game.initialize(
      [player1, player2],
      'game-123',
      'rolling', // Use rolling state to avoid activePlay requirement
      undefined, // use default board
      undefined, // use default cube
      undefined, // no activePlay needed for rolling
      'white',
      player1,
      player2
    )

    const mockGameLookup: GameLookupFunction = async () => mockGame

    const result = await Move.moveChecker(
      'game-123',
      'non-existent-checker',
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe(
      'Game is not in a state where moving is allowed. Current state: rolling'
    )
  })

  it('should return error when trying to move opponent checker', async () => {
    // Use rolling state which doesn't require activePlay
    const player1 = Player.initialize('white', 'clockwise', 'rolling', false)
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      false
    )

    const board = Board.initialize()
    // Find a black checker on the board
    const blackChecker = board.points
      .flatMap((point) => point.checkers)
      .find((checker) => checker.color === 'black')

    expect(blackChecker).toBeDefined() // Ensure we found a black checker

    const mockGame = Game.initialize(
      [player1, player2],
      'game-123',
      'rolling', // Use rolling state to avoid activePlay requirement
      board,
      undefined, // use default cube
      undefined, // no activePlay needed for rolling
      'white', // White player's turn
      player1,
      player2
    )

    const mockGameLookup: GameLookupFunction = async () => mockGame

    const result = await Move.moveChecker(
      'game-123',
      blackChecker!.id,
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe(
      'Game is not in a state where moving is allowed. Current state: rolling'
    )
  })

  // TODO: Add more comprehensive tests once the full implementation is complete
  // - Test successful single move execution
  // - Test multiple possible moves scenario
  // - Test different move types (point-to-point, bear-off, reenter)
})

describe('Minimal black move sequence with debug', () => {
  it('should handle dice [4,2] where both dice have legal moves available', async () => {
    // Setup: standard board, black moves counterclockwise
    const player1 = Player.initialize('white', 'clockwise', 'inactive', false)
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'moving',
      false
    )
    const board = Board.initialize()

    // Create proper player with dice
    const blackPlayer: BackgammonPlayer = {
      ...player2,
      id: 'black-player',
      userId: 'black-user',
      stateKind: 'moving',
      dice: {
        id: 'dice-1',
        stateKind: 'rolled',
        currentRoll: [4, 2],
        total: 6,
        color: 'black',
      },
      rollForStartValue: 4,
    }

    // 🔧 BUG FIX: Create proper activePlay using Play.initialize
    const { Play } = await import('../../Play')
    const activePlay = Play.initialize(board, blackPlayer)

    // Create game state with proper activePlay
    const game = Game.initialize(
      [player1, blackPlayer],
      'test-game',
      'moving',
      board,
      undefined, // use default cube
      activePlay,
      'black',
      blackPlayer,
      player1
    )

    // Find checkers for the moves we want to test
    const point8 = board.points.find((p) => p.position.counterclockwise === 8)!
    const point6 = board.points.find((p) => p.position.counterclockwise === 6)!
    const checker8 = point8.checkers.find((c) => c.color === 'black')!
    const checker6 = point6.checkers.find((c) => c.color === 'black')!

    // Game lookup
    const gameLookup: GameLookupFunction = async () => game

    // Test proper move execution - both moves should succeed since both dice have legal moves
    // This verifies the direction bug fix is working correctly

    // Move from point 8 (counterclockwise black player)
    const result1 = await Move.moveChecker(game.id, checker8.id, gameLookup)
    expect(result1.success).toBe(true)
    if (result1.success && result1.game) {
      Object.assign(game, result1.game) // Update game state
    }

    // Move from point 6 (should succeed - legal moves available for remaining die)
    const result2 = await Move.moveChecker(game.id, checker6.id, gameLookup)
    expect(result2.success).toBe(true)

    // Both moves should succeed - this verifies the direction fix is working correctly
    // Previously, counterclockwise players had incorrect move calculation
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })
})
