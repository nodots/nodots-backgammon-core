import { describe, expect, test } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import {
  BackgammonPlayerRolling,
  BackgammonPlayerMoving,
  BackgammonDieValue,
  BackgammonPlayResult,
  BackgammonCheckerContainerImport
} from '@nodots-llc/backgammon-types'

// Helper to create a player with specific dice roll
function createPlayerWithDice(diceRoll: [BackgammonDieValue, BackgammonDieValue]): BackgammonPlayerMoving {
  const player = Player.initialize(
    'white',
    'clockwise',
    'rolling',
    false
  ) as BackgammonPlayerRolling
  const rolledPlayer = Player.roll(player)
  rolledPlayer.dice.currentRoll = diceRoll
  return rolledPlayer
}

describe('Auto-Switch Dice Functionality', () => {
  describe('Board.getPossibleMovesWithPositionSpecificAutoSwitch', () => {
    test('should return autoSwitched: false when clicked position can move with original die', () => {
      // Setup: Place a checker at position 24 where both dice can move
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 1, color: 'white' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 2])
      const origin = testBoard.points.find(p => p.position.clockwise === 24)!

      const result = Board.getPossibleMovesWithPositionSpecificAutoSwitch(
        testBoard,
        player,
        origin,
        6 as BackgammonDieValue,
        2 as BackgammonDieValue
      )

      expect(result.autoSwitched).toBe(false)
      expect(result.originalDieValue).toBe(6)
      expect(result.usedDieValue).toBe(6)
      expect(result.moves.length).toBeGreaterThan(0)
    })

    test('should return autoSwitched: true when clicked position cannot move with original die but can with alternative', () => {
      // Setup: Create Issue #133 scenario - position 18 can move with 5 but not 6
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 18, counterclockwise: 7 },
          checkers: { qty: 1, color: 'white' }
        },
        // Block position 12 (18-6) to prevent 6-die moves from position 18
        {
          position: { clockwise: 12, counterclockwise: 13 },
          checkers: { qty: 2, color: 'black' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 5])
      const origin = testBoard.points.find(p => p.position.clockwise === 18)!

      const result = Board.getPossibleMovesWithPositionSpecificAutoSwitch(
        testBoard,
        player,
        origin,
        6 as BackgammonDieValue, // User attempts with 6 (blocked)
        5 as BackgammonDieValue  // Auto-switches to 5 (available)
      )

      expect(result.autoSwitched).toBe(true)
      expect(result.originalDieValue).toBe(6)
      expect(result.usedDieValue).toBe(5)
      expect(result.moves.length).toBeGreaterThan(0)
    })

    test('should return autoSwitched: false when clicked position cannot move with either die', () => {
      // Setup: Position with checker but completely blocked
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 18, counterclockwise: 7 },
          checkers: { qty: 1, color: 'white' }
        },
        // Block both possible destinations
        {
          position: { clockwise: 12, counterclockwise: 13 },
          checkers: { qty: 2, color: 'black' }
        },
        {
          position: { clockwise: 13, counterclockwise: 12 },
          checkers: { qty: 2, color: 'black' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 5])
      const origin = testBoard.points.find(p => p.position.clockwise === 18)!

      const result = Board.getPossibleMovesWithPositionSpecificAutoSwitch(
        testBoard,
        player,
        origin,
        6 as BackgammonDieValue,
        5 as BackgammonDieValue
      )

      expect(result.autoSwitched).toBe(false)
      expect(result.originalDieValue).toBe(6)
      expect(result.usedDieValue).toBe(6)
      // Should return original moves (which may be empty if no moves possible)
    })
  })

  describe('Play.move with auto-switch', () => {
    test('should include auto-switch information in PlayResult', () => {
      // Setup: Simple board with one checker that can move
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 1, color: 'white' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 2])
      const testPlay = Play.initialize(testBoard, player)

      // Get a valid origin point
      const origin = testBoard.points.find(p => p.position.clockwise === 24)!

      const result: BackgammonPlayResult = Play.move(testBoard, testPlay, origin)

      // Check that auto-switch information is included in the result
      expect(result).toHaveProperty('autoSwitched')
      expect(result).toHaveProperty('originalDieValue')
      expect(result).toHaveProperty('usedDieValue')
      expect(typeof result.autoSwitched).toBe('boolean')
    })

    test('should handle dice reordering when auto-switch occurs', () => {
      // Setup: Board where auto-switch will happen (position 2 blocked for 6, open for 2)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 1, color: 'white' }
        },
        {
          position: { clockwise: 8, counterclockwise: 17 },
          checkers: { qty: 2, color: 'black' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 2])
      const testPlay = Play.initialize(testBoard, player)

      const origin = testBoard.points.find(p => p.position.clockwise === 2)!

      const result: BackgammonPlayResult = Play.move(testBoard, testPlay, origin)

      if (result.autoSwitched) {
        // When auto-switch occurs, dice should be reordered
        expect(result.play.player.dice?.currentRoll?.[0]).toBe(2)
        expect(result.play.player.dice?.currentRoll?.[1]).toBe(6)
      }
    })

    test('should not reorder dice when no auto-switch occurs', () => {
      // Setup: Board where original die can be used
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 1, color: 'white' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([6, 2])
      const testPlay = Play.initialize(testBoard, player)

      const origin = testBoard.points.find(p => p.position.clockwise === 24)!

      const result: BackgammonPlayResult = Play.move(testBoard, testPlay, origin)

      expect(result.autoSwitched).toBe(false)
      // Dice should remain in original order
      expect(result.play.player.dice?.currentRoll?.[0]).toBe(6)
      expect(result.play.player.dice?.currentRoll?.[1]).toBe(2)
    })
  })

  describe('Issue #133 scenarios', () => {
    test('should auto-switch when user attempts invalid die but valid alternative exists (Issue #133)', () => {
      // Reproduce exact Issue #133 scenario: User clicks position that can move with die 1 but not die 4
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 13, counterclockwise: 12 },
          checkers: { qty: 1, color: 'white' }
        },
        // Block position 9 (13-4) to prevent 4-die moves from position 13
        {
          position: { clockwise: 9, counterclockwise: 16 },
          checkers: { qty: 2, color: 'black' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([4, 1])
      const origin = testBoard.points.find(p => p.position.clockwise === 13)!

      const result = Board.getPossibleMovesWithPositionSpecificAutoSwitch(
        testBoard,
        player,
        origin,
        4 as BackgammonDieValue, // User attempts with 4 (blocked)
        1 as BackgammonDieValue  // Auto-switches to 1 (available)
      )

      expect(result.autoSwitched).toBe(true)
      expect(result.originalDieValue).toBe(4)
      expect(result.usedDieValue).toBe(1)
      expect(result.moves.length).toBeGreaterThan(0)

      // Verify the move goes to the correct destination (13-1 = 12)
      const move = result.moves.find(m => m.origin.id === origin.id)
      expect(move).toBeDefined()
      if (move?.destination.kind === 'point') {
        expect(move.destination.position.clockwise).toBe(12)
      }
    })

    test('should provide complete information for CLIENT visual feedback', () => {
      // Ensure all necessary data is available for UI dice reordering
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 1, color: 'white' }
        },
        {
          position: { clockwise: 8, counterclockwise: 17 },
          checkers: { qty: 2, color: 'black' }
        }
      ]
      const testBoard = Board.initialize(boardImport)
      const player = createPlayerWithDice([3, 2])

      const result = Board.getPossibleMovesWithIntelligentDiceSwitching(
        testBoard,
        player,
        3 as BackgammonDieValue,
        2 as BackgammonDieValue
      )

      // All required properties should be present for CLIENT feedback
      expect(result).toHaveProperty('autoSwitched')
      expect(result).toHaveProperty('originalDieValue')
      expect(result).toHaveProperty('usedDieValue')
      expect(result).toHaveProperty('moves')

      expect(typeof result.autoSwitched).toBe('boolean')
      expect(typeof result.originalDieValue).toBe('number')
      expect(typeof result.usedDieValue).toBe('number')
      expect(Array.isArray(result.moves)).toBe(true)
    })
  })
})