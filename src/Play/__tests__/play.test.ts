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
} from 'nodots-backgammon-types'
import { Play } from '..'

describe('Play', () => {
  describe('initialization', () => {
    test('should initialize with basic board setup', () => {
      // Create a simple board setup with only 1 checker per point
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

      // Roll the player to get a rolled state
      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled

      // Initialize the play with the rolled player
      const play = Play.initialize(board, rolledPlayer)

      expect(play).toBeDefined()
      expect(play.stateKind).toBe('rolled')
      expect(play.moves).toBeDefined()
      expect(Array.from(play.moves).length).toBeGreaterThan(0)
    })

    test('should handle doubles correctly', () => {
      // Create a board setup where doubles can be used
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

      expect(Array.from(play.moves).length).toBe(4) // Should have 4 moves for doubles

      // Cleanup
      jest.spyOn(Math, 'random').mockRestore()
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

      // Get the point from the board to use as origin
      const origin = board.BackgammonPoints.find(
        (p) => p.position.clockwise === 1 && p.position.counterclockwise === 24
      ) as BackgammonPoint

      const result = Play.move(board, play, origin)

      expect(result.play).toBeDefined()
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
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

      // Get an invalid point from the board to use as origin
      const invalidOrigin = board.BackgammonPoints.find(
        (p) => p.position.clockwise === 24 && p.position.counterclockwise === 1
      ) as BackgammonPoint

      expect(() => {
        Play.move(board, play, invalidOrigin)
      }).toThrow('Invalid move')
    })

    describe('reenter moves', () => {
      test('should execute a valid reenter move from bar', () => {
        // Create a board setup with an open point for reentry in opponent's home board
        const boardImport: BackgammonCheckercontainerImport[] = [
          // Add a checker to the bar
          {
            position: 'bar',
            direction: 'clockwise',
            checkers: {
              qty: 1,
              color: 'white',
            },
          },
          // Initialize all points in opponent's home board (19-24)
          {
            position: { clockwise: 19, counterclockwise: 6 },
            checkers: { qty: 0, color: 'white' }, // Empty point for reentry
          },
          {
            position: { clockwise: 20, counterclockwise: 5 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 21, counterclockwise: 4 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 22, counterclockwise: 3 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 23, counterclockwise: 2 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 24, counterclockwise: 1 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
        ]

        const board = Board.buildBoard(boardImport)

        // Initialize dice with a roll of 6 (maps to point 19 for reentry)
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

        // Use the bar as origin for reenter move
        const origin = board.bar.clockwise as BackgammonBar

        const result = Play.move(board, play, origin)

        expect(result.play).toBeDefined()
        expect(result.board).toBeDefined()
        expect(result.move.stateKind).toBe('completed')
        expect(result.move.moveKind).toBe('reenter')
        const destination = result.move.destination as BackgammonPoint
        expect(destination.position.clockwise).toBe(19) // Should reenter on point 19
      })

      test('should prioritize bar moves when checker is on bar', () => {
        // Create a board setup with both regular moves possible and a checker on bar
        const boardImport: BackgammonCheckercontainerImport[] = [
          {
            position: { clockwise: 1, counterclockwise: 24 },
            checkers: { qty: 1, color: 'white' }, // Regular checker that could move
          },
          // Add a checker to the bar
          {
            position: 'bar',
            direction: 'clockwise',
            checkers: {
              qty: 1,
              color: 'white',
            },
          },
          // Initialize all points in opponent's home board (19-24)
          {
            position: { clockwise: 19, counterclockwise: 6 },
            checkers: { qty: 0, color: 'white' }, // Empty point for reentry
          },
          {
            position: { clockwise: 20, counterclockwise: 5 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 21, counterclockwise: 4 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 22, counterclockwise: 3 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 23, counterclockwise: 2 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
          {
            position: { clockwise: 24, counterclockwise: 1 },
            checkers: { qty: 2, color: 'black' }, // Blocked point
          },
        ]

        const board = Board.buildBoard(boardImport)

        // Initialize dice with a roll of 6 (maps to point 19 for reentry)
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

        const play = Play.initialize(board, rolledPlayer)

        // Should only have moves from the bar available
        const moves = Array.from(play.moves)
        expect(moves.length).toBeGreaterThan(0)
        expect(
          moves.every((m) =>
            m.possibleMoves.every((pm) => pm.origin.kind === 'bar')
          )
        ).toBe(true)
      })
    })
  })

  test('should throw error when no possible moves available', () => {
    // Create a board setup where no moves are possible
    const boardImport: BackgammonCheckercontainerImport[] = [
      {
        position: { clockwise: 24, counterclockwise: 1 },
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

    expect(() => {
      Play.initialize(board, rolledPlayer)
    }).toThrow('No possible moves available')
  })
})
