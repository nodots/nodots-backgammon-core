import { describe, it, expect, beforeAll, test } from '@jest/globals'
import { Board, Dice, Player, generateId } from '../..'
import {
  BackgammonCheckercontainerImport,
  BackgammonDiceInactive,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayRolled,
  BackgammonPoint,
  BackgammonBar,
  BackgammonMoveReady,
  BackgammonMoveCompletedWithMove,
  BackgammonMoveCompletedNoMove,
} from 'nodots-backgammon-types'
import { Play } from '..'

describe('Play', () => {
  describe('initialization', () => {
    test('should initialize with basic board setup', () => {
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 1, color: 'black' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer)

      expect(play).toBeDefined()
      expect(play.stateKind).toBe('rolled')
      expect(play.moves).toBeDefined()
      expect(play.moves.size).toBeGreaterThan(0)

      // Check that each move has the required moveKind
      for (const move of play.moves) {
        if (move.stateKind === 'ready') {
          expect(move.moveKind).toBe('point-to-point')
        } else if (move.stateKind === 'completed' && 'moveKind' in move) {
          expect(
            ['point-to-point', 'reenter', 'bear-off', 'no-move'].includes(
              move.moveKind
            )
          ).toBeTruthy()
        }
      }
    })

    test('should handle doubles correctly', () => {
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 2, color: 'white' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive

      // Mock the dice roll to always return doubles
      jest.spyOn(Math, 'random').mockReturnValue(0) // This will make both dice roll 1

      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer)

      expect(play.moves.size).toBe(4) // Should have 4 moves for doubles

      // Verify all moves are point-to-point
      for (const move of play.moves) {
        if (move.stateKind === 'ready') {
          expect(move.moveKind).toBe('point-to-point')
        }
      }

      // Cleanup
      jest.spyOn(Math, 'random').mockRestore()
    })

    test('should handle no possible moves', () => {
      // Create a board setup where no moves are possible
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
        // Block all possible destinations
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 2, color: 'black' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer)

      expect(play.moves.size).toBe(1)
      const move = Array.from(play.moves)[0]
      expect(move.stateKind).toBe('ready')
      expect(move.moveKind).toBe('no-move')
    })
  })

  describe('move functionality', () => {
    test('should execute a valid move', () => {
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer) as BackgammonPlayRolled

      const origin = board.BackgammonPoints.find(
        (p) => p.position.clockwise === 1 && p.position.counterclockwise === 24
      ) as BackgammonPoint

      const result = Play.move(board, play, origin)

      expect(result.play).toBeDefined()
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      expect((result.move as BackgammonMoveCompletedWithMove).moveKind).toBe(
        'point-to-point'
      )
    })

    test('should throw error for invalid move', () => {
      const boardImport: BackgammonCheckercontainerImport[] = [
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer) as BackgammonPlayRolled

      const invalidOrigin = board.BackgammonPoints.find(
        (p) => p.position.clockwise === 24 && p.position.counterclockwise === 1
      ) as BackgammonPoint

      expect(() => {
        Play.move(board, play, invalidOrigin)
      }).toThrow('Invalid move')
    })

    describe('reenter moves', () => {
      test('should execute a valid reenter move from bar', () => {
        const boardImport: BackgammonCheckercontainerImport[] = [
          {
            position: 'bar',
            direction: 'clockwise',
            checkers: {
              qty: 1,
              color: 'white',
            },
          },
          {
            position: { clockwise: 19, counterclockwise: 6 },
            checkers: { qty: 0, color: 'white' },
          },
          {
            position: { clockwise: 20, counterclockwise: 5 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 21, counterclockwise: 4 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 22, counterclockwise: 3 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 23, counterclockwise: 2 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 24, counterclockwise: 1 },
            checkers: { qty: 2, color: 'black' },
          },
        ]

        const board = Board.buildBoard(boardImport)
        const inactiveDice = Dice.initialize(
          'white',
          'inactive',
          generateId(),
          [6, 1]
        ) as BackgammonDiceInactive

        const player = Player.initialize(
          'white',
          'clockwise',
          inactiveDice,
          undefined,
          'rolling'
        ) as BackgammonPlayerRolling

        const rolledPlayer = {
          ...player,
          stateKind: 'rolled',
          dice: {
            ...inactiveDice,
            stateKind: 'rolled',
            currentRoll: [6, 1],
            total: 7,
          },
        } as BackgammonPlayerRolled

        const play = Play.initialize(
          board,
          rolledPlayer
        ) as BackgammonPlayRolled
        const origin = board.bar.clockwise as BackgammonBar

        const result = Play.move(board, play, origin)

        expect(result.play).toBeDefined()
        expect(result.board).toBeDefined()
        expect(result.move.stateKind).toBe('completed')
        expect((result.move as BackgammonMoveCompletedWithMove).moveKind).toBe(
          'reenter'
        )
        const destination = (result.move as BackgammonMoveCompletedWithMove)
          .destination as BackgammonPoint
        expect(destination.position.clockwise).toBe(19)
      })

      test('should prioritize bar moves when checker is on bar', () => {
        const boardImport: BackgammonCheckercontainerImport[] = [
          {
            position: { clockwise: 1, counterclockwise: 24 },
            checkers: { qty: 1, color: 'white' },
          },
          {
            position: 'bar',
            direction: 'clockwise',
            checkers: {
              qty: 1,
              color: 'white',
            },
          },
        ]

        const board = Board.buildBoard(boardImport)
        const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
        const player = Player.initialize(
          'white',
          'clockwise',
          inactiveDice,
          undefined,
          'rolling'
        ) as BackgammonPlayerRolling

        const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
        const play = Play.initialize(board, rolledPlayer)

        // All moves should be reenter moves when there's a checker on the bar
        for (const move of play.moves) {
          if (move.stateKind === 'ready') {
            expect(move.moveKind).toBe('reenter')
          }
        }
      })
    })
  })
})
