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
    // Use actual point IDs from the board
    const firstPoint = testGame.board.points[0]
    const secondPoint = testGame.board.points[1]
    
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
          origin: { id: firstPoint.id, kind: 'point' },
          destination: { id: secondPoint.id, kind: 'point' },
          isHit: false
        }])
      }
    } as any

    // Set up board state: destination has the player's checker, origin is empty
    secondPoint.checkers = [{
      id: 'test-checker',
      color: testGame.activePlayer.color,
      checkercontainerId: secondPoint.id
    }]
    firstPoint.checkers = []

    const result = Game.undoLastMove(mockGameWithConfirmedMove)
    
    if (!result.success) {
      console.log('Undo failed with error:', result.error)
    }
    
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
    // Use actual point IDs from the board
    const thirdPoint = testGame.board.points[2]
    const fourthPoint = testGame.board.points[3]
    
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
          origin: { id: thirdPoint.id, kind: 'point' },
          destination: { id: fourthPoint.id, kind: 'point' },
          isHit: false
        }])
      }
    } as any

    // Set up board state: destination has the player's checker, origin is empty
    fourthPoint.checkers = [{
      id: 'integrity-checker',
      color: testGame.activePlayer.color,
      checkercontainerId: fourthPoint.id
    }]
    thirdPoint.checkers = []

    const result = Game.undoLastMove(mockGameForIntegrityTest)
    
    if (!result.success) {
      console.log('Integrity test undo failed with error:', result.error)
    }
    
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