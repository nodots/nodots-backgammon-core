import { BackgammonGame, BackgammonGameMoving, BackgammonMoveCompletedNoMove } from '@nodots-llc/backgammon-types/dist'
import { Game } from '../index'

describe('Game.undoLastMove', () => {
  let testGame: BackgammonGameMoving

  beforeEach(() => {
    // Create a basic game and advance to moving state
    let game = Game.createNewGame(
      'test-user-1',
      'test-user-2',
      true, // auto roll for start
      false, // player1 is not robot
      false, // player2 is not robot
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )

    // Roll dice and advance to moving state
    if (game.stateKind === 'rolled-for-start') {
      const rolledGame = Game.roll(game as any)
      const preparingGame = Game.prepareMove(rolledGame)
      testGame = Game.toMoving(preparingGame)
    } else {
      // If not in expected state, force create a moving game
      testGame = {
        ...game,
        stateKind: 'moving'
      } as BackgammonGameMoving
    }
  })

  it('should return error when game is not in moving state', () => {
    const rollingGame = Game.createNewGame(
      'test-user-1',
      'test-user-2',
      false, // don't auto roll
      false,
      false
    )

    const result = Game.undoLastMove(rollingGame)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Cannot undo move from')
    expect(result.error).toContain('Must be in \'moving\' state')
  })

  it('should return error when no active play exists', () => {
    const gameWithoutActivePlay = {
      ...testGame,
      activePlay: null
    } as any

    const result = Game.undoLastMove(gameWithoutActivePlay)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No active play found')
  })

  it('should return error when no confirmed moves exist', () => {
    // Create a game with only ready moves (no confirmed moves)
    const gameWithNoConfirmedMoves = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'ready-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'ready',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'point-1', kind: 'point' }
        }])
      }
    } as any

    const result = Game.undoLastMove(gameWithNoConfirmedMoves)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No confirmed moves available to undo')
  })

  it('should return error when trying to undo a no-move', () => {
    // Create a confirmed no-move in the active play
    if (testGame.activePlay?.moves) {
      const noMove: BackgammonMoveCompletedNoMove = {
        id: 'test-move-id',
        player: testGame.activePlayer,
        dieValue: 1,
        stateKind: 'completed',
        moveKind: 'no-move',
        possibleMoves: [],
        origin: undefined,
        destination: undefined,
        isHit: false
      }
      testGame.activePlay.moves = new Set([noMove as any])
    }

    const result = Game.undoLastMove(testGame)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot undo a no-move or invalid move')
  })

  it('should successfully undo a regular point-to-point move', () => {
    // For this test, we'll mock a game state with a confirmed move
    const mockGameWithConfirmedMove = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'test-confirmed-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'completed',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'point-1', kind: 'point' },
          destination: { id: 'point-2', kind: 'point' },
          isHit: false
        }])
      }
    } as any

    // Mock the board to have checkers in expected positions
    if (mockGameWithConfirmedMove.board) {
      // Ensure destination has the player's checker
      const destinationPoint = mockGameWithConfirmedMove.board.points.find((p: any) => p.id === 'point-2')
      if (destinationPoint) {
        destinationPoint.checkers = [{
          id: 'test-checker',
          color: testGame.activePlayer.color,
          checkercontainerId: 'point-2'
        }]
      }
      
      // Ensure origin exists and is empty (after the move)
      const originPoint = mockGameWithConfirmedMove.board.points.find((p: any) => p.id === 'point-1')
      if (originPoint) {
        originPoint.checkers = []
      }
    }

    const result = Game.undoLastMove(mockGameWithConfirmedMove)
    
    expect(result.success).toBe(true)
    expect(result.game).toBeDefined()
    expect(result.undoneMove).toBeDefined()
    expect(result.remainingMoveHistory).toBeDefined()
  })

  it('should handle board state validation errors gracefully', () => {
    // Create a mock game with invalid board state
    const invalidGame = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'invalid-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'completed',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'non-existent-origin', kind: 'point' },
          destination: { id: 'non-existent-destination', kind: 'point' },
          isHit: false
        }])
      }
    } as any

    const result = Game.undoLastMove(invalidGame)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to undo move')
  })

  it('should preserve game integrity after undo', () => {
    // Create a mock game with a valid confirmed move and proper board state
    const mockGameForIntegrityTest = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'integrity-test-move',
          player: testGame.activePlayer,
          dieValue: 2,
          stateKind: 'completed',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'point-3', kind: 'point' },
          destination: { id: 'point-4', kind: 'point' },
          isHit: false
        }])
      }
    } as any

    // Mock board state with proper checker placement
    if (mockGameForIntegrityTest.board) {
      const destinationPoint = mockGameForIntegrityTest.board.points.find((p: any) => p.id === 'point-4')
      if (destinationPoint) {
        destinationPoint.checkers = [{
          id: 'integrity-checker',
          color: testGame.activePlayer.color,
          checkercontainerId: 'point-4'
        }]
      }
      
      const originPoint = mockGameForIntegrityTest.board.points.find((p: any) => p.id === 'point-3')
      if (originPoint) {
        originPoint.checkers = []
      }
    }

    const result = Game.undoLastMove(mockGameForIntegrityTest)
    
    expect(result.success).toBe(true)
    
    if (result.game) {
      // Verify pip counts are numbers and positive
      result.game.players.forEach(player => {
        expect(typeof player.pipCount).toBe('number')
        expect(player.pipCount).toBeGreaterThan(0)
      })
      
      // Verify game is still in moving state
      expect(result.game.stateKind).toBe('moving')
      
      // Verify active play still exists
      expect(result.game.activePlay).toBeDefined()
    }
  })
})