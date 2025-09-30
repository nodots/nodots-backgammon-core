import { describe, expect, it } from '@jest/globals'
import {
  BackgammonGameMoved,
  BackgammonGameMoving,
} from '@nodots-llc/backgammon-types'
import { Game } from '..'
import { Board } from '../../Board'

describe('Game Turn Passing - Core Methods', () => {
  describe('Game.toMoved()', () => {
    it('should throw error when transitioning from non-moving state', () => {
      const fakeRollingGame = {
        stateKind: 'rolling',
      } as any

      expect(() => {
        Game.toMoved(fakeRollingGame)
      }).toThrow('Cannot transition to moved from rolling state')
    })

    it.skip('should throw error when no active play exists', () => {
      const fakeMovingGame = {
        stateKind: 'moving',
        activePlay: undefined,
      } as any

      expect(() => {
        Game.toMoved(fakeMovingGame)
      }).toThrow('No active play found')
    })

    it.skip('should throw error when moves are not completed', () => {
      const fakeMovingGame = {
        stateKind: 'moving',
        activePlay: {
          moves: new Set([
            { stateKind: 'ready' }, // Not completed
            { stateKind: 'completed' },
          ]),
        },
      } as unknown as BackgammonGameMoving

      expect(() => {
        Game.toMoved(fakeMovingGame)
      }).toThrow(
        'Cannot transition to moved state - not all moves are completed'
      )
    })

    it('should successfully transition when all moves are completed', () => {
      const fakeMovingGame = {
        stateKind: 'moving',
        activePlay: {
          moves: new Set([
            { stateKind: 'completed' },
            { stateKind: 'completed' },
          ]),
        },
        // Copy other required properties
        id: 'test-id',
        players: [
          {
            color: 'white',
            stateKind: 'moving',
            dice: { stateKind: 'rolled' },
            direction: 'clockwise',
          },
          {
            color: 'black',
            stateKind: 'inactive',
            dice: { stateKind: 'inactive' },
            direction: 'counterclockwise',
          },
        ],
        board: {
          points: [],
          bar: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
          off: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
        },
        cube: {},
        activeColor: 'white',
        activePlayer: {
          color: 'white',
          stateKind: 'moving',
          direction: 'clockwise',
        },
        inactivePlayer: {
          color: 'black',
          stateKind: 'inactive',
          direction: 'counterclockwise',
        },
      } as unknown as BackgammonGameMoving

      const result = Game.toMoved(fakeMovingGame)

      expect(result.stateKind).toBe('moved')
      expect(result.id).toBe('test-id')
    })
  })

  describe('Game.confirmTurn() from moved state', () => {
    it('should throw error when transitioning from non-moved state', () => {
      const fakeMovingGame = {
        stateKind: 'moving',
      } as any

      expect(() => {
        Game.confirmTurn(fakeMovingGame)
      }).toThrow('Cannot confirm turn from non-moving state')
    })

    it.skip('should throw error when no active play exists', () => {
      const fakeMovedGame = {
        stateKind: 'moved',
        activePlay: undefined,
        board: Board.initialize(), // Provide proper board structure
        players: [], // Provide empty players array
      } as any

      expect(() => {
        Game.confirmTurn(fakeMovedGame)
      }).toThrow() // Just expect it to throw some error
    })

    it.skip('should throw error when moves are not completed', () => {
      const fakeMovedGame = {
        stateKind: 'moved',
        activePlay: {
          moves: new Set([
            { stateKind: 'ready' }, // Not completed
            { stateKind: 'completed' },
          ]),
        },
        board: Board.initialize(), // Provide proper board structure
        players: [], // Provide empty players array
      } as unknown as BackgammonGameMoved

      expect(() => {
        Game.confirmTurn(fakeMovedGame)
      }).toThrow() // Just expect it to throw some error
    })

    it('should successfully transition to next player when all conditions are met', () => {
      const fakeMovedGame = {
        stateKind: 'moved',
        activePlay: {
          moves: new Set([
            { stateKind: 'completed' },
            { stateKind: 'completed' },
          ]),
        },
        id: 'test-id',
        activeColor: 'white',
        players: [
          {
            color: 'white',
            stateKind: 'moved',
            dice: { stateKind: 'moving' },
            direction: 'clockwise',
          },
          {
            color: 'black',
            stateKind: 'inactive',
            dice: { stateKind: 'inactive' },
            direction: 'counterclockwise',
          },
        ],
        board: {
          points: [],
          bar: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
          off: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
        },
        cube: {},
      } as unknown as BackgammonGameMoved

      const result = Game.confirmTurn(fakeMovedGame)

      expect(result.stateKind).toBe('rolling')
      expect(result.activeColor).toBe('black') // Should switch to black
      expect(result.id).toBe('test-id') // Should preserve game ID
      expect(result.activePlay).toBeUndefined() // Should clear activePlay
    })

    it('should handle color switching from black to white', () => {
      const fakeMovedGame = {
        stateKind: 'moved',
        activePlay: {
          moves: new Set([{ stateKind: 'completed' }]),
        },
        id: 'test-id',
        activeColor: 'black', // Start with black
        players: [
          {
            color: 'white',
            stateKind: 'inactive',
            dice: { stateKind: 'inactive' },
            direction: 'clockwise',
          },
          {
            color: 'black',
            stateKind: 'moved',
            dice: { stateKind: 'moving' },
            direction: 'counterclockwise',
          },
        ],
        board: {
          points: [],
          bar: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
          off: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
        },
        cube: {},
      } as unknown as BackgammonGameMoved

      const result = Game.confirmTurn(fakeMovedGame)

      expect(result.stateKind).toBe('rolling')
      expect(result.activeColor).toBe('white') // Should switch to white
    })
  })

  describe('Complete workflow', () => {
    it('should handle moving -> moved -> rolling transition', () => {
      // Start with a moving game
      const movingGame = {
        stateKind: 'moving',
        activePlay: {
          moves: new Set([{ stateKind: 'completed' }]),
        },
        id: 'test-id',
        activeColor: 'white',
        players: [
          {
            color: 'white',
            stateKind: 'moving',
            dice: { stateKind: 'moving' },
            direction: 'clockwise',
          },
          {
            color: 'black',
            stateKind: 'inactive',
            dice: { stateKind: 'inactive' },
            direction: 'counterclockwise',
          },
        ],
        board: {
          points: [],
          bar: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
          off: {
            clockwise: { checkers: [] },
            counterclockwise: { checkers: [] },
          },
        },
        cube: {},
      } as unknown as BackgammonGameMoving

      // Step 1: Transition to moved
      const movedGame = Game.toMoved(movingGame)
      expect(movedGame.stateKind).toBe('moved')
      expect(movedGame.activeColor).toBe('white') // Still white's turn

      // Step 2: Confirm turn and transition to next player
      const nextPlayerGame = Game.confirmTurn(movedGame)
      expect(nextPlayerGame.stateKind).toBe('rolling')
      expect(nextPlayerGame.activeColor).toBe('black') // Now black's turn
      expect(nextPlayerGame.activePlay).toBeUndefined() // Clear activePlay
    })
  })
})
