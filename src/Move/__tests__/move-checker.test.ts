import { describe, expect, it } from '@jest/globals'
import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { Board, Player } from '../../index'
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
    const mockGame: BackgammonGame = {
      id: 'game-123',
      stateKind: 'rolling', // Wrong state for moving
      players: [] as any,
      board: Board.initialize(),
      activeColor: 'white',
    } as any

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
    const player1: BackgammonPlayer = Player.initialize(
      'white',
      'clockwise',
      undefined,
      false
    )
    const player2: BackgammonPlayer = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      false
    )

    const mockGame: BackgammonGame = {
      id: 'game-123',
      stateKind: 'rolled',
      players: [player1, player2],
      board: Board.initialize(),
      activeColor: 'white',
      activePlayer: player1,
    } as any

    const mockGameLookup: GameLookupFunction = async () => mockGame

    const result = await Move.moveChecker(
      'game-123',
      'non-existent-checker',
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Checker not found on board')
  })

  it('should return error when trying to move opponent checker', async () => {
    const player1: BackgammonPlayer = Player.initialize(
      'white',
      'clockwise',
      undefined,
      false
    )
    const player2: BackgammonPlayer = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      false
    )

    const board = Board.initialize()
    // Find a black checker on the board
    const blackChecker = board.points
      .flatMap((point) => point.checkers)
      .find((checker) => checker.color === 'black')

    expect(blackChecker).toBeDefined() // Ensure we found a black checker

    const mockGame: BackgammonGame = {
      id: 'game-123',
      stateKind: 'rolled',
      players: [player1, player2],
      board,
      activeColor: 'white', // White player's turn
      activePlayer: player1,
    } as any

    const mockGameLookup: GameLookupFunction = async () => mockGame

    const result = await Move.moveChecker(
      'game-123',
      blackChecker!.id,
      mockGameLookup
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe("Cannot move opponent's checker")
  })

  // TODO: Add more comprehensive tests once the full implementation is complete
  // - Test successful single move execution
  // - Test multiple possible moves scenario
  // - Test different move types (point-to-point, bear-off, reenter)
})

describe('Minimal black move sequence with debug', () => {
  it('should handle dice [4,2] where both dice have legal moves available', async () => {
    // Setup: standard board, black moves counterclockwise
    const player1 = Player.initialize(
      'white',
      'clockwise',
      undefined,
      false
    )
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      false
    )
    const board = Board.initialize()

    // Create proper player with dice
    const blackPlayer: any = {
      ...player2,
      id: 'black-player',
      userId: 'black-user',
      stateKind: 'rolled',
      dice: {
        id: 'dice-1',
        stateKind: 'rolled',
        currentRoll: [4, 2],
        total: 6,
        color: 'black',
      },
    }

    // 🔧 BUG FIX: Create proper activePlay using Play.initialize
    const { Play } = await import('../../Play')
    const activePlay = Play.initialize(board, blackPlayer)

    // Create game state with proper activePlay
    const game: any = {
      id: 'test-game',
      stateKind: 'rolled',
      players: [player1, blackPlayer],
      board,
      activeColor: 'black',
      activePlayer: blackPlayer,
      activePlay,
    }

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
