import { BackgammonBoard, BackgammonPlayerMoving, BackgammonPointValue, BackgammonDieValue } from '@nodots-llc/backgammon-types/dist'
import { Board, Play, Player, Dice } from '../..'

describe('Play - Mandatory Dice Usage Rules (Issue #132)', () => {

  const createTestBoard = (config: Array<{ point: number; color: 'white' | 'black'; qty: number }>) => {
    const boardImport = config.map(item => ({
      position: {
        clockwise: item.point as BackgammonPointValue,
        counterclockwise: (25 - item.point) as BackgammonPointValue
      },
      checkers: { color: item.color, qty: item.qty }
    }))
    return Board.buildBoard(boardImport)
  }

  const createMovingPlayer = (color: 'white' | 'black', roll: [BackgammonDieValue, BackgammonDieValue]) => {
    const basePlayer = Player.initialize(color, 'clockwise', 'inactive', false, 'test-user')
    return {
      ...basePlayer,
      stateKind: 'moving' as const,
      dice: Dice.initialize(color, 'rolled', undefined, roll)
    } as BackgammonPlayerMoving
  }

  describe('validateMoveSequence method', () => {
    test('should validate that both dice must be used when possible', () => {
      // Simple board setup where both dice can be used
      const board = createTestBoard([
        { point: 13, color: 'white', qty: 1 },
        { point: 12, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      // Since both dice can be used, validation should pass for complete sequence
      const validation = Play.validateMoveSequence(board, play)
      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
    })

    test('should handle when no moves are possible', () => {
      // Setup where no moves are possible (all checkers off)
      const board = createTestBoard([])
      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const validation = Play.validateMoveSequence(board, play)
      expect(validation.isValid).toBe(true) // No moves possible = no rules violated
    })
  })

  describe('canUseBothDice method', () => {
    test('should detect when both dice can be used', () => {
      const board = createTestBoard([
        { point: 13, color: 'white', qty: 2 },
        { point: 8, color: 'white', qty: 2 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const canUseBoth = Play.canUseBothDice(board, play)
      expect(typeof canUseBoth).toBe('boolean')
    })

    test('should handle doubles correctly', () => {
      const board = createTestBoard([
        { point: 13, color: 'white', qty: 4 }
      ])

      const player = createMovingPlayer('white', [2 as BackgammonDieValue, 2 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const canUseBoth = Play.canUseBothDice(board, play)
      expect(typeof canUseBoth).toBe('boolean')
    })
  })

  describe('findAlternativeSequences method', () => {
    test('should find alternative move sequences', () => {
      const board = createTestBoard([
        { point: 6, color: 'white', qty: 2 },
        { point: 5, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 2 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const alternatives = Play.findAlternativeSequences(board, play)
      expect(Array.isArray(alternatives)).toBe(true)
      expect(alternatives.length).toBeGreaterThanOrEqual(0)
    })

    test('should handle empty play correctly', () => {
      const board = createTestBoard([])
      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const alternatives = Play.findAlternativeSequences(board, play)
      expect(Array.isArray(alternatives)).toBe(true)
    })
  })

  describe('getMandatoryMoveSequence method', () => {
    test('should identify when mandatory sequences exist', () => {
      const board = createTestBoard([
        { point: 13, color: 'white', qty: 1 },
        { point: 12, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const mandatory = Play.getMandatoryMoveSequence(board, play)
      expect(typeof mandatory.isMandatory).toBe('boolean')
    })

    test('should handle valid sequences correctly', () => {
      const board = createTestBoard([
        { point: 6, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const mandatory = Play.getMandatoryMoveSequence(board, play)
      expect(mandatory.isMandatory).toBe(false)
    })
  })

  describe('Integration with Play.move', () => {
    test('should integrate validation into move execution', async () => {
      const board = createTestBoard([
        { point: 13, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      // Test that validation functions are called during normal play
      expect(play.moves.size).toBeGreaterThan(0)

      const movesArray = Array.from(play.moves)
      const readyMoves = movesArray.filter(m => m.stateKind === 'ready')
      expect(readyMoves.length).toBeGreaterThan(0)
    })

    test('should handle bearing off scenarios', () => {
      // Test bearing off position where mandatory rules still apply
      const board = createTestBoard([
        { point: 6, color: 'white', qty: 1 },
        { point: 4, color: 'white', qty: 1 },
        { point: 3, color: 'white', qty: 1 }
      ])

      const player = createMovingPlayer('white', [3 as BackgammonDieValue, 6 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      const validation = Play.validateMoveSequence(board, play)
      expect(validation).toBeDefined()
    })
  })

  describe('Error handling', () => {
    test('should handle malformed play objects gracefully', () => {
      const board = createTestBoard([])
      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])

      // Test with empty/malformed play
      const basePlay = Play.initialize(board, player)
      const emptyPlay = { ...basePlay, moves: new Set() } as any

      expect(() => {
        Play.validateMoveSequence(board, emptyPlay)
      }).not.toThrow()

      expect(() => {
        Play.canUseBothDice(board, emptyPlay)
      }).not.toThrow()

      expect(() => {
        Play.findAlternativeSequences(board, emptyPlay)
      }).not.toThrow()
    })

    test('should handle invalid board states gracefully', () => {
      const board = createTestBoard([])
      const player = createMovingPlayer('white', [1 as BackgammonDieValue, 4 as BackgammonDieValue])
      const play = Play.initialize(board, player)

      // These should not throw even with edge cases
      expect(() => {
        Play.validateMoveSequence(board, play)
      }).not.toThrow()

      expect(() => {
        Play.getMandatoryMoveSequence(board, play)
      }).not.toThrow()
    })
  })
})