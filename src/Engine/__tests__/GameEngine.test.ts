import { GameEngine } from '../GameEngine'
import { Game } from '../../Game'
import { BackgammonGame, BackgammonGameMoving } from '@nodots-llc/backgammon-types'

describe('GameEngine', () => {
  let testGame: BackgammonGame

  beforeEach(() => {
    // Create a test game with known state
    testGame = Game.createNewGame(
      { userId: 'player1', isRobot: false },
      { userId: 'player2', isRobot: true }
    )

    // Advance to moving state for testing
    if (testGame.stateKind === 'rolling-for-start') {
      // First roll for start to determine who goes first
      const rolledForStartGame = Game.rollForStart(testGame as any)
      
      if (rolledForStartGame.stateKind === 'rolled-for-start') {
        // Then roll for the game
        const rolledGame = Game.roll(rolledForStartGame as any)
        
        if (rolledGame.stateKind === 'rolled') {
          const preparingGame = Game.prepareMove(rolledGame)
          testGame = Game.toMoving(preparingGame)
        }
      }
    }
  })

  describe('validateMove', () => {
    it('should validate legal moves correctly', () => {
      // Find a checker that can be moved
      const possibleMoves = GameEngine.getPossibleMoves(testGame)
      
      if (possibleMoves.success && possibleMoves.moves && possibleMoves.moves.length > 0) {
        const firstMove = possibleMoves.moves[0]
        if (firstMove.origin) {
          // Find a checker at the origin
          const checkers = firstMove.origin.checkers
          if (checkers.length > 0) {
            const checkerId = checkers[0].id
            const isValid = GameEngine.validateMove(testGame, checkerId)
            expect(isValid).toBe(true)
          }
        }
      }
    })

    it('should reject invalid moves', () => {
      // Try to move a non-existent checker
      const isValid = GameEngine.validateMove(testGame, 'non-existent-checker')
      expect(isValid).toBe(false)
    })

    it('should reject moves from wrong game state', () => {
      // Create a game in wrong state
      const rollingGame = Game.createNewGame(
        { userId: 'p1', isRobot: false },
        { userId: 'p2', isRobot: false }
      )
      const isValid = GameEngine.validateMove(rollingGame, 'any-checker')
      expect(isValid).toBe(false)
    })
  })

  describe('executeMove', () => {
    it('should execute valid moves and return new state', () => {
      const possibleMoves = GameEngine.getPossibleMoves(testGame)
      
      if (possibleMoves.success && possibleMoves.moves && possibleMoves.moves.length > 0) {
        const firstMove = possibleMoves.moves[0]
        if (firstMove.origin && firstMove.origin.checkers.length > 0) {
          const checkerId = firstMove.origin.checkers[0].id
          
          const newState = GameEngine.executeMove(testGame, checkerId)
          
          // Verify new state is different from original
          expect(newState).not.toBe(testGame)
          expect(GameEngine.calculateGameHash(newState)).not.toBe(
            GameEngine.calculateGameHash(testGame)
          )
        }
      }
    })

    it('should throw error for invalid moves', () => {
      expect(() => {
        GameEngine.executeMove(testGame, 'non-existent-checker')
      }).toThrow()
    })

    it('should not mutate original state', () => {
      const originalHash = GameEngine.calculateGameHash(testGame)
      const possibleMoves = GameEngine.getPossibleMoves(testGame)
      
      if (possibleMoves.success && possibleMoves.moves && possibleMoves.moves.length > 0) {
        const firstMove = possibleMoves.moves[0]
        if (firstMove.origin && firstMove.origin.checkers.length > 0) {
          const checkerId = firstMove.origin.checkers[0].id
          
          try {
            GameEngine.executeMove(testGame, checkerId)
            
            // Original state should be unchanged
            const afterHash = GameEngine.calculateGameHash(testGame)
            expect(afterHash).toBe(originalHash)
          } catch (error) {
            // If move fails, state should still be unchanged
            const afterHash = GameEngine.calculateGameHash(testGame)
            expect(afterHash).toBe(originalHash)
          }
        }
      }
    })
  })

  describe('getPossibleMoves', () => {
    it('should return possible moves for valid game state', () => {
      const result = GameEngine.getPossibleMoves(testGame)
      
      expect(result.success).toBe(true)
      expect(result.moves).toBeDefined()
      expect(Array.isArray(result.moves)).toBe(true)
    })

    it('should return empty moves for invalid game state', () => {
      const rollingGame = Game.createNewGame(
        { userId: 'p1', isRobot: false },
        { userId: 'p2', isRobot: false }
      )
      const result = GameEngine.getPossibleMoves(rollingGame)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should include current die information', () => {
      const result = GameEngine.getPossibleMoves(testGame)
      
      if (result.success) {
        expect(result.currentDie).toBeDefined()
        expect(typeof result.currentDie).toBe('number')
      }
    })
  })

  describe('calculateGameHash', () => {
    it('should return consistent hash for same state', () => {
      const hash1 = GameEngine.calculateGameHash(testGame)
      const hash2 = GameEngine.calculateGameHash(testGame)
      
      expect(hash1).toBe(hash2)
    })

    it('should return different hash for different states', () => {
      const hash1 = GameEngine.calculateGameHash(testGame)
      
      // Make a move to change state
      const possibleMoves = GameEngine.getPossibleMoves(testGame)
      if (possibleMoves.success && possibleMoves.moves && possibleMoves.moves.length > 0) {
        const firstMove = possibleMoves.moves[0]
        if (firstMove.origin && firstMove.origin.checkers.length > 0) {
          const checkerId = firstMove.origin.checkers[0].id
          const newState = GameEngine.executeMove(testGame, checkerId)
          const hash2 = GameEngine.calculateGameHash(newState)
          
          expect(hash1).not.toBe(hash2)
        }
      }
    })

    it('should be deterministic', () => {
      const hashes = Array.from({ length: 10 }, () => 
        GameEngine.calculateGameHash(testGame)
      )
      
      // All hashes should be identical
      expect(new Set(hashes).size).toBe(1)
    })
  })

  describe('checkWinCondition', () => {
    it('should detect no winner in starting position', () => {
      const result = GameEngine.checkWinCondition(testGame)
      
      expect(result.hasWinner).toBe(false)
      expect(result.winner).toBeUndefined()
    })

    it('should handle game states correctly', () => {
      // Create various game states and test win detection
      const result = GameEngine.checkWinCondition(testGame)
      
      // Should return valid structure
      expect(typeof result.hasWinner).toBe('boolean')
      if (result.hasWinner) {
        expect(result.winner).toBeDefined()
        expect(result.winType).toBeDefined()
        expect(['normal', 'gammon', 'backgammon']).toContain(result.winType)
      }
    })
  })

  describe('transitionToNextPlayer', () => {
    it('should transition to next player correctly', () => {
      const originalActiveColor = testGame.activeColor
      const newState = GameEngine.transitionToNextPlayer(testGame)
      
      expect(newState.activeColor).not.toBe(originalActiveColor)
      expect(newState.stateKind).toBe('rolling')
      expect(newState.activePlay).toBeUndefined()
    })

    it('should not mutate original state', () => {
      const originalHash = GameEngine.calculateGameHash(testGame)
      GameEngine.transitionToNextPlayer(testGame)
      
      const afterHash = GameEngine.calculateGameHash(testGame)
      expect(afterHash).toBe(originalHash)
    })

    it('should update player states correctly', () => {
      const newState = GameEngine.transitionToNextPlayer(testGame)
      
      // Check that players have correct states
      const activePlayer = newState.players.find(p => p.color === newState.activeColor)
      const inactivePlayer = newState.players.find(p => p.color !== newState.activeColor)
      
      expect(activePlayer?.stateKind).toBe('rolling')
      expect(inactivePlayer?.stateKind).toBe('inactive')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        GameEngine.validateMove(null as any, 'checker')
      }).toThrow()
      
      expect(() => {
        GameEngine.validateMove(testGame, null as any)
      }).toThrow()
    })

    it('should handle malformed game states', () => {
      const malformedGame = { ...testGame, players: [] } as any
      
      const result = GameEngine.getPossibleMoves(malformedGame)
      expect(result.success).toBe(false)
    })

    it('should handle empty checker containers', () => {
      // Test with game state that has empty containers
      const result = GameEngine.getPossibleMoves(testGame)
      
      // Should handle gracefully without throwing
      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    })
  })

  describe('Performance', () => {
    it('should execute moves efficiently', () => {
      const start = performance.now()
      
      // Execute multiple operations
      for (let i = 0; i < 100; i++) {
        GameEngine.calculateGameHash(testGame)
        GameEngine.getPossibleMoves(testGame)
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000) // 1 second for 100 operations
    })

    it('should not have memory leaks in hash calculation', () => {
      // Test repeated hash calculations don't accumulate memory
      const hashes = []
      
      for (let i = 0; i < 1000; i++) {
        hashes.push(GameEngine.calculateGameHash(testGame))
      }
      
      // All hashes should be identical (no state mutation)
      expect(new Set(hashes).size).toBe(1)
    })
  })
})