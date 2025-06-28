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
    const player1: BackgammonPlayer = Player.initialize('white', 'clockwise')
    const player2: BackgammonPlayer = Player.initialize(
      'black',
      'counterclockwise'
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
    const player1: BackgammonPlayer = Player.initialize('white', 'clockwise')
    const player2: BackgammonPlayer = Player.initialize(
      'black',
      'counterclockwise'
    )

    const board = Board.initialize()
    // Find a black checker on the board
    const blackChecker = board.BackgammonPoints.flatMap(
      (point) => point.checkers
    ).find((checker) => checker.color === 'black')

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
  it('should move one checker from 8→4 and one from 6→4 for black', async () => {
    // Setup: standard board, black moves counterclockwise
    const player1 = Player.initialize('white', 'clockwise')
    const player2 = Player.initialize('black', 'counterclockwise')
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

    // Create game state
    const game: any = {
      id: 'test-game',
      stateKind: 'rolled',
      players: [player1, blackPlayer],
      board,
      activeColor: 'black',
      activePlayer: blackPlayer,
      activePlay: {
        id: 'play-1',
        moves: new Map(),
      },
    }

    // Find points and checkers
    const point8 = board.BackgammonPoints.find(
      (p) => p.position.counterclockwise === 8
    )!
    const point6 = board.BackgammonPoints.find(
      (p) => p.position.counterclockwise === 6
    )!
    const point4 = board.BackgammonPoints.find(
      (p) => p.position.counterclockwise === 4
    )!
    const checker8 = point8.checkers[0]
    const checker6 = point6.checkers[0]

    // Create proper move objects using Move.initialize
    const move4: any = Move.initialize({
      move: {
        id: 'move-4',
        player: blackPlayer,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: point8,
        dieValue: 4,
        possibleMoves: [],
      },
      origin: point8,
    })

    const move2: any = Move.initialize({
      move: {
        id: 'move-2',
        player: blackPlayer,
        stateKind: 'ready',
        moveKind: 'point-to-point',
        origin: point6,
        dieValue: 2,
        possibleMoves: [],
      },
      origin: point6,
    })

    // Add possible moves to each move object
    move4.possibleMoves = [{ origin: point8, destination: point4 }]
    move2.possibleMoves = [{ origin: point6, destination: point4 }]

    game.activePlay.moves.set('move-4', move4)
    game.activePlay.moves.set('move-2', move2)

    // Debug: print activePlay.moves and possibleMoves
    const movesArr = Array.from(game.activePlay.moves.entries()) as [
      string,
      any
    ][]
    console.log(
      'activePlay.moves:',
      movesArr.map(([k, v]) => ({
        id: v.id,
        dieValue: v.dieValue,
        stateKind: v.stateKind,
        moveKind: v.moveKind,
        origin:
          v.origin && v.origin.position
            ? v.origin.position.counterclockwise
            : undefined,
        possibleMoves:
          v.possibleMoves &&
          v.possibleMoves.map((pm: any) => ({
            origin:
              pm.origin && pm.origin.position
                ? pm.origin.position.counterclockwise
                : undefined,
            destination:
              pm.destination && pm.destination.position
                ? pm.destination.position.counterclockwise
                : undefined,
          })),
      }))
    )

    // Game lookup
    const gameLookup: GameLookupFunction = async () => game

    // Move from 8→4
    const result1 = await Move.moveChecker(game.id, checker8.id, gameLookup)
    if (result1.success && result1.game) {
      game.board = result1.game.board
    }
    // Debug output
    const afterMove1_8 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 8
    )!.checkers.length
    const afterMove1_6 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 6
    )!.checkers.length
    const afterMove1_4 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 4
    )!.checkers.length
    console.log('After move 1: 8→4:', {
      on8: afterMove1_8,
      on6: afterMove1_6,
      on4: afterMove1_4,
    })
    expect(result1.success).toBe(true)

    // Move from 6→4
    const result2 = await Move.moveChecker(game.id, checker6.id, gameLookup)
    if (result2.success && result2.game) {
      game.board = result2.game.board
    }
    // Debug output
    const afterMove2_8 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 8
    )!.checkers.length
    const afterMove2_6 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 6
    )!.checkers.length
    const afterMove2_4 = game.board.BackgammonPoints.find(
      (p: any) => p.position.counterclockwise === 4
    )!.checkers.length
    console.log('After move 2: 6→4:', {
      on8: afterMove2_8,
      on6: afterMove2_6,
      on4: afterMove2_4,
    })
    expect(result2.success).toBe(true)

    // Final assertions
    expect(afterMove2_8).toBe(2)
    expect(afterMove2_6).toBe(4)
    expect(afterMove2_4).toBe(2)

    // Show ASCII board after both moves
    Board.displayAsciiBoard(game.board)
  })
})
