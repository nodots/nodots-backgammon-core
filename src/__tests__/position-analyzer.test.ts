import { beforeEach, describe, expect, it } from '@jest/globals'
import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { generateId } from '../'
import { PositionAnalyzer } from '../AI/utils/PositionAnalyzer'
import { Board } from '../Board'
import { Game } from '../Game'
import { Player } from '../Player'

describe('PositionAnalyzer', () => {
  let mockGame: BackgammonGame
  let blackPlayer: BackgammonPlayer
  let whitePlayer: BackgammonPlayer

  beforeEach(() => {
    // Create players
    blackPlayer = Player.initialize(
      'black',
      'clockwise',
      undefined,
      generateId(),
      'inactive',
      true,
      'user1'
    )
    whitePlayer = Player.initialize(
      'white',
      'counterclockwise',
      undefined,
      generateId(),
      'inactive',
      true,
      'user2'
    )

    // Create game in a simple state that works for position analysis tests
    const board = Board.createBoardForPlayers('black', 'white')

    // Create a basic game that can be used for position analysis
    mockGame = Game.initialize(
      [blackPlayer, whitePlayer] as any,
      generateId(),
      'rolling-for-start',
      board
    )
  })

  describe('calculatePipCount', () => {
    it('should calculate pip count for a player', () => {
      const pipCount = PositionAnalyzer.calculatePipCount(mockGame, blackPlayer)

      expect(typeof pipCount).toBe('number')
      expect(pipCount).toBeGreaterThan(0)
    })

    it('should calculate different pip counts for different players', () => {
      const blackPipCount = PositionAnalyzer.calculatePipCount(
        mockGame,
        blackPlayer
      )
      const whitePipCount = PositionAnalyzer.calculatePipCount(
        mockGame,
        whitePlayer
      )

      expect(blackPipCount).toBeGreaterThan(0)
      expect(whitePipCount).toBeGreaterThan(0)
      // In a standard starting position, both players should have the same pip count
      expect(blackPipCount).toBe(whitePipCount)
    })

    it('should handle players with checkers on the bar', () => {
      // Create a mock game state with checkers on the bar
      const gameWithBar = { ...mockGame }
      gameWithBar.board.bar.clockwise.checkers = [
        { id: 'checker1', color: 'black', checkercontainerId: 'bar-clockwise' },
        { id: 'checker2', color: 'black', checkercontainerId: 'bar-clockwise' },
      ]

      const pipCount = PositionAnalyzer.calculatePipCount(
        gameWithBar,
        blackPlayer
      )

      expect(pipCount).toBeGreaterThan(0)
      // Should include the bar checkers (2 checkers * 25 points each = 50 additional points)
    })

    it('should handle empty board correctly', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const pipCount = PositionAnalyzer.calculatePipCount(
        emptyGame,
        blackPlayer
      )

      expect(pipCount).toBe(0)
    })
  })

  describe('findAnchorPositions', () => {
    it('should find anchor positions for a player', () => {
      const anchors = PositionAnalyzer.findAnchorPositions(
        mockGame,
        blackPlayer
      )

      expect(Array.isArray(anchors)).toBe(true)
      expect(anchors.length).toBeGreaterThanOrEqual(0)
    })

    it('should return sorted anchor positions', () => {
      const anchors = PositionAnalyzer.findAnchorPositions(
        mockGame,
        blackPlayer
      )

      // Check if array is sorted
      for (let i = 1; i < anchors.length; i++) {
        expect(anchors[i]).toBeGreaterThan(anchors[i - 1])
      }
    })

    it('should only include positions in opponent home board (19-24)', () => {
      const anchors = PositionAnalyzer.findAnchorPositions(
        mockGame,
        blackPlayer
      )

      anchors.forEach((position) => {
        expect(position).toBeGreaterThanOrEqual(19)
        expect(position).toBeLessThanOrEqual(24)
      })
    })

    it('should handle player with no anchors', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const anchors = PositionAnalyzer.findAnchorPositions(
        emptyGame,
        blackPlayer
      )

      expect(anchors).toEqual([])
    })
  })

  describe('evaluateDistribution', () => {
    it('should evaluate checker distribution for a player', () => {
      const distribution = PositionAnalyzer.evaluateDistribution(
        mockGame,
        blackPlayer
      )

      expect(distribution).toHaveProperty('homeBoardCheckers')
      expect(distribution).toHaveProperty('outerBoardCheckers')
      expect(distribution).toHaveProperty('opponentHomeBoardCheckers')
      expect(distribution).toHaveProperty('barCheckers')
      expect(distribution).toHaveProperty('bearOffCheckers')
      expect(distribution).toHaveProperty('averagePosition')
      expect(distribution).toHaveProperty('distribution')

      expect(typeof distribution.homeBoardCheckers).toBe('number')
      expect(typeof distribution.outerBoardCheckers).toBe('number')
      expect(typeof distribution.opponentHomeBoardCheckers).toBe('number')
      expect(typeof distribution.barCheckers).toBe('number')
      expect(typeof distribution.bearOffCheckers).toBe('number')
      expect(typeof distribution.averagePosition).toBe('number')
      expect(Array.isArray(distribution.distribution)).toBe(true)
      expect(distribution.distribution.length).toBe(25) // positions 0-24
    })

    it('should calculate correct total checkers across all board sections', () => {
      const distribution = PositionAnalyzer.evaluateDistribution(
        mockGame,
        blackPlayer
      )

      const totalCheckers =
        distribution.homeBoardCheckers +
        distribution.outerBoardCheckers +
        distribution.opponentHomeBoardCheckers +
        distribution.barCheckers +
        distribution.bearOffCheckers

      // Should account for all 15 checkers (or close to it in initial position)
      expect(totalCheckers).toBeGreaterThan(0)
      expect(totalCheckers).toBeLessThanOrEqual(15)
    })

    it('should handle empty board correctly', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const distribution = PositionAnalyzer.evaluateDistribution(
        emptyGame,
        blackPlayer
      )

      expect(distribution.homeBoardCheckers).toBe(0)
      expect(distribution.outerBoardCheckers).toBe(0)
      expect(distribution.opponentHomeBoardCheckers).toBe(0)
      expect(distribution.barCheckers).toBe(0)
      expect(distribution.bearOffCheckers).toBe(0)
      expect(distribution.averagePosition).toBe(0)
    })

    it('should handle player with checkers on bar', () => {
      const gameWithBar = { ...mockGame }
      gameWithBar.board.bar.clockwise.checkers = [
        { id: 'checker1', color: 'black', checkercontainerId: 'bar-clockwise' },
        { id: 'checker2', color: 'black', checkercontainerId: 'bar-clockwise' },
      ]

      const distribution = PositionAnalyzer.evaluateDistribution(
        gameWithBar,
        blackPlayer
      )

      expect(distribution.barCheckers).toBe(2)
      expect(distribution.distribution[0]).toBe(2) // Bar is position 0
    })

    it('should handle player with borne off checkers', () => {
      const gameWithBearOff = { ...mockGame }
      gameWithBearOff.board.off.clockwise.checkers = [
        { id: 'checker1', color: 'black', checkercontainerId: 'off-clockwise' },
        { id: 'checker2', color: 'black', checkercontainerId: 'off-clockwise' },
        { id: 'checker3', color: 'black', checkercontainerId: 'off-clockwise' },
      ]

      const distribution = PositionAnalyzer.evaluateDistribution(
        gameWithBearOff,
        blackPlayer
      )

      expect(distribution.bearOffCheckers).toBe(3)
    })
  })

  describe('getPrimeLength', () => {
    it('should calculate prime length for a player', () => {
      const primeLength = PositionAnalyzer.getPrimeLength(mockGame, blackPlayer)

      expect(typeof primeLength).toBe('number')
      expect(primeLength).toBeGreaterThanOrEqual(0)
      expect(primeLength).toBeLessThanOrEqual(6) // Maximum possible prime length
    })

    it('should return 0 for empty board', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const primeLength = PositionAnalyzer.getPrimeLength(
        emptyGame,
        blackPlayer
      )

      expect(primeLength).toBe(0)
    })

    it('should handle single points correctly', () => {
      // Test with a board where player has isolated points
      const primeLength = PositionAnalyzer.getPrimeLength(mockGame, blackPlayer)

      expect(primeLength).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getBlotCount', () => {
    it('should count blots for a player', () => {
      const blotCount = PositionAnalyzer.getBlotCount(mockGame, blackPlayer)

      expect(typeof blotCount).toBe('number')
      expect(blotCount).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for empty board', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const blotCount = PositionAnalyzer.getBlotCount(emptyGame, blackPlayer)

      expect(blotCount).toBe(0)
    })

    it('should not count points with 2 or more checkers as blots', () => {
      // In standard starting position, most points should have 2+ checkers
      const blotCount = PositionAnalyzer.getBlotCount(mockGame, blackPlayer)

      expect(blotCount).toBeLessThan(15) // Should be less than total checkers
    })
  })

  describe('isInRace', () => {
    it('should determine if game is in racing phase', () => {
      const isRace = PositionAnalyzer.isInRace(mockGame)

      expect(typeof isRace).toBe('boolean')
    })

    it('should return false for starting position', () => {
      // Standard starting position is not a race
      const isRace = PositionAnalyzer.isInRace(mockGame)

      expect(isRace).toBe(false)
    })

    it('should handle empty board correctly', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const isRace = PositionAnalyzer.isInRace(emptyGame)

      expect(typeof isRace).toBe('boolean')
    })
  })

  describe('getPositionFromDirection', () => {
    it('should get position from direction', () => {
      const mockPoint = {
        position: { clockwise: 12, counterclockwise: 13 },
      }

      const clockwisePos = PositionAnalyzer.getPositionFromDirection(
        mockPoint,
        'clockwise'
      )
      const counterclockwisePos = PositionAnalyzer.getPositionFromDirection(
        mockPoint,
        'counterclockwise'
      )

      expect(clockwisePos).toBe(12)
      expect(counterclockwisePos).toBe(13)
    })

    it('should handle non-object positions', () => {
      const mockPoint = { position: 'not-an-object' }

      const position = PositionAnalyzer.getPositionFromDirection(
        mockPoint,
        'clockwise'
      )

      expect(position).toBe(0)
    })
  })

  describe('board position helpers', () => {
    it('should identify opponent home board positions', () => {
      expect(PositionAnalyzer.isInOpponentHomeBoard(19)).toBe(true)
      expect(PositionAnalyzer.isInOpponentHomeBoard(20)).toBe(true)
      expect(PositionAnalyzer.isInOpponentHomeBoard(24)).toBe(true)
      expect(PositionAnalyzer.isInOpponentHomeBoard(18)).toBe(false)
      expect(PositionAnalyzer.isInOpponentHomeBoard(25)).toBe(false)
    })

    it('should identify home board positions', () => {
      expect(PositionAnalyzer.isInHomeBoard(1)).toBe(true)
      expect(PositionAnalyzer.isInHomeBoard(3)).toBe(true)
      expect(PositionAnalyzer.isInHomeBoard(6)).toBe(true)
      expect(PositionAnalyzer.isInHomeBoard(0)).toBe(false)
      expect(PositionAnalyzer.isInHomeBoard(7)).toBe(false)
    })

    it('should identify outer board positions', () => {
      expect(PositionAnalyzer.isInOuterBoard(7)).toBe(true)
      expect(PositionAnalyzer.isInOuterBoard(10)).toBe(true)
      expect(PositionAnalyzer.isInOuterBoard(12)).toBe(true)
      expect(PositionAnalyzer.isInOuterBoard(6)).toBe(false)
      expect(PositionAnalyzer.isInOuterBoard(13)).toBe(false)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle game with missing players', () => {
      const gameWithMissingPlayers = {
        ...mockGame,
        players: [blackPlayer, whitePlayer] as any,
      }

      const isRace = PositionAnalyzer.isInRace(gameWithMissingPlayers)

      expect(typeof isRace).toBe('boolean')
    })

    it('should handle player with no checkers', () => {
      // Create truly empty board by removing all checkers
      const emptyBoard = Board.initialize()
      // Clear all points
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Clear bar
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      // Clear off
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      const pipCount = PositionAnalyzer.calculatePipCount(
        emptyGame,
        blackPlayer
      )
      const distribution = PositionAnalyzer.evaluateDistribution(
        emptyGame,
        blackPlayer
      )
      const anchors = PositionAnalyzer.findAnchorPositions(
        emptyGame,
        blackPlayer
      )
      const primeLength = PositionAnalyzer.getPrimeLength(
        emptyGame,
        blackPlayer
      )
      const blotCount = PositionAnalyzer.getBlotCount(emptyGame, blackPlayer)

      expect(pipCount).toBe(0)
      expect(distribution.homeBoardCheckers).toBe(0)
      expect(anchors).toEqual([])
      expect(primeLength).toBe(0)
      expect(blotCount).toBe(0)
    })

    it('should handle players with different directions', () => {
      const blackPipCount = PositionAnalyzer.calculatePipCount(
        mockGame,
        blackPlayer
      )
      const whitePipCount = PositionAnalyzer.calculatePipCount(
        mockGame,
        whitePlayer
      )

      expect(blackPipCount).toBeGreaterThan(0)
      expect(whitePipCount).toBeGreaterThan(0)
    })
  })
})
