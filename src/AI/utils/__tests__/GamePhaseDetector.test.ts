import { beforeEach, describe, expect, it } from '@jest/globals'
import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { generateId } from '../../../'
import { Board } from '../../../Board'
import { Game } from '../../../Game'
import { Player } from '../../../Player'
import { GamePhase, GamePhaseDetector } from '../GamePhaseDetector'

describe('GamePhaseDetector', () => {
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

    // Create game in a simple state
    const board = Board.createBoardForPlayers('black', 'white')
    mockGame = Game.initialize(
      [blackPlayer, whitePlayer] as any,
      generateId(),
      'rolling-for-start',
      board
    )
  })

  describe('identifyPhase', () => {
    it('should identify opening phase for new games', () => {
      // Standard starting position should be opening
      const phase = GamePhaseDetector.identifyPhase(mockGame)
      expect(phase).toBe(GamePhase.OPENING)
    })

    it('should identify bear-off phase when player has most checkers in home board', () => {
      // Create a game state with bear-off position
      const bearOffBoard = Board.initialize()

      // Clear all points first
      bearOffBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Add checkers to home board (positions 1-6 for black clockwise)
      for (let i = 1; i <= 6; i++) {
        const point = bearOffBoard.points.find(
          (p) => p.position.clockwise === i
        )
        if (point) {
          point.checkers = [
            { id: generateId(), color: 'black', checkercontainerId: point.id },
            { id: generateId(), color: 'black', checkercontainerId: point.id },
          ]
        }
      }

      // Add remaining checkers to position 1
      const point1 = bearOffBoard.points.find((p) => p.position.clockwise === 1)
      if (point1) {
        for (let i = 0; i < 3; i++) {
          point1.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point1.id,
          })
        }
      }

      const bearOffGame = { ...mockGame, board: bearOffBoard }
      const phase = GamePhaseDetector.identifyPhase(bearOffGame)
      expect(phase).toBe(GamePhase.BEAR_OFF)
    })

    it('should identify race phase when players have no contact', () => {
      // Create a race position where players have passed each other
      const raceBoard = Board.initialize()

      // Clear all points first
      raceBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Black checkers in home board area (positions 1-6)
      for (let i = 1; i <= 6; i++) {
        const point = raceBoard.points.find((p) => p.position.clockwise === i)
        if (point && i <= 3) {
          point.checkers = [
            { id: generateId(), color: 'black', checkercontainerId: point.id },
            { id: generateId(), color: 'black', checkercontainerId: point.id },
          ]
        }
      }

      // White checkers in their home board area (positions 19-24)
      for (let i = 19; i <= 24; i++) {
        const point = raceBoard.points.find((p) => p.position.clockwise === i)
        if (point && i >= 22) {
          point.checkers = [
            { id: generateId(), color: 'white', checkercontainerId: point.id },
            { id: generateId(), color: 'white', checkercontainerId: point.id },
          ]
        }
      }

      const raceGame = { ...mockGame, board: raceBoard }
      const phase = GamePhaseDetector.identifyPhase(raceGame)
      expect(phase).toBe(GamePhase.RACE)
    })

    it('should identify backgame phase when player has anchors in opponent home board', () => {
      // Create a backgame position
      const backgameBoard = Board.initialize()

      // Clear all points first
      backgameBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Add anchors in opponent's home board (positions 19-24 for black's perspective)
      const anchor1 = backgameBoard.points.find(
        (p) => p.position.clockwise === 20
      )
      const anchor2 = backgameBoard.points.find(
        (p) => p.position.clockwise === 22
      )

      if (anchor1) {
        anchor1.checkers = [
          { id: generateId(), color: 'black', checkercontainerId: anchor1.id },
          { id: generateId(), color: 'black', checkercontainerId: anchor1.id },
        ]
      }
      if (anchor2) {
        anchor2.checkers = [
          { id: generateId(), color: 'black', checkercontainerId: anchor2.id },
          { id: generateId(), color: 'black', checkercontainerId: anchor2.id },
        ]
      }

      const backgameGame = { ...mockGame, board: backgameBoard }
      const phase = GamePhaseDetector.identifyPhase(backgameGame)
      expect(phase).toBe(GamePhase.BACKGAME)
    })

    it('should identify blitz phase when player has many blots and checkers on bar', () => {
      // Create a blitz position
      const blitzBoard = Board.initialize()

      // Clear all points first
      blitzBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Add blots (single checkers) in multiple positions
      for (let i = 7; i <= 12; i++) {
        const point = blitzBoard.points.find((p) => p.position.clockwise === i)
        if (point) {
          point.checkers = [
            { id: generateId(), color: 'black', checkercontainerId: point.id },
          ]
        }
      }

      // Add checkers to bar
      blitzBoard.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: 'bar-clockwise',
        },
      ]

      const blitzGame = { ...mockGame, board: blitzBoard }
      const phase = GamePhaseDetector.identifyPhase(blitzGame)
      expect(phase).toBe(GamePhase.BLITZ)
    })

    it('should identify middle game as default phase', () => {
      // Create a typical middle game position
      const middleBoard = Board.initialize()

      // Clear all points first
      middleBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Add checkers spread across the board
      const positions = [8, 13, 6, 24, 13, 8]
      positions.forEach((pos, index) => {
        const point = middleBoard.points.find(
          (p) => p.position.clockwise === pos
        )
        if (point) {
          point.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point.id,
          })
        }
      })

      const middleGame = { ...mockGame, board: middleBoard }
      const phase = GamePhaseDetector.identifyPhase(middleGame)
      expect(phase).toBe(GamePhase.MIDDLE_GAME)
    })
  })

  describe('getDetailedPhaseAnalysis', () => {
    it('should return detailed analysis with phase and player data', () => {
      const analysis = GamePhaseDetector.getDetailedPhaseAnalysis(mockGame)

      expect(analysis).toHaveProperty('phase')
      expect(analysis).toHaveProperty('playerAnalysis')
      expect(analysis.playerAnalysis).toHaveLength(2)

      // Check that each player analysis has the expected properties
      analysis.playerAnalysis.forEach((playerAnalysis) => {
        expect(playerAnalysis).toHaveProperty('player')
        expect(playerAnalysis).toHaveProperty('distribution')
        expect(playerAnalysis).toHaveProperty('pipCount')
        expect(playerAnalysis).toHaveProperty('blotCount')
        expect(playerAnalysis).toHaveProperty('primeLength')
        expect(playerAnalysis).toHaveProperty('anchors')

        expect(typeof playerAnalysis.pipCount).toBe('number')
        expect(typeof playerAnalysis.blotCount).toBe('number')
        expect(typeof playerAnalysis.primeLength).toBe('number')
        expect(Array.isArray(playerAnalysis.anchors)).toBe(true)
      })
    })

    it('should identify correct phase in detailed analysis', () => {
      const analysis = GamePhaseDetector.getDetailedPhaseAnalysis(mockGame)

      // Starting position should be opening
      expect(analysis.phase).toBe(GamePhase.OPENING)
    })
  })

  describe('isEndgame', () => {
    it('should return true for bear-off phase', () => {
      // Create bear-off position
      const bearOffBoard = Board.initialize()
      bearOffBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Add checkers to home board
      const point1 = bearOffBoard.points.find((p) => p.position.clockwise === 1)
      if (point1) {
        for (let i = 0; i < 12; i++) {
          point1.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point1.id,
          })
        }
      }

      const bearOffGame = { ...mockGame, board: bearOffBoard }
      const isEndgame = GamePhaseDetector.isEndgame(bearOffGame)
      expect(isEndgame).toBe(true)
    })

    it('should return true for race phase', () => {
      // Create race position
      const raceBoard = Board.initialize()
      raceBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Spread checkers to create race condition
      for (let i = 1; i <= 6; i++) {
        const point = raceBoard.points.find((p) => p.position.clockwise === i)
        if (point) {
          point.checkers = [
            { id: generateId(), color: 'black', checkercontainerId: point.id },
          ]
        }
      }

      for (let i = 19; i <= 24; i++) {
        const point = raceBoard.points.find((p) => p.position.clockwise === i)
        if (point) {
          point.checkers = [
            { id: generateId(), color: 'white', checkercontainerId: point.id },
          ]
        }
      }

      const raceGame = { ...mockGame, board: raceBoard }
      const isEndgame = GamePhaseDetector.isEndgame(raceGame)
      expect(isEndgame).toBe(true)
    })

    it('should return false for opening phase', () => {
      const isEndgame = GamePhaseDetector.isEndgame(mockGame)
      expect(isEndgame).toBe(false)
    })

    it('should return false for middle game phase', () => {
      const middleBoard = Board.initialize()
      middleBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Add checkers spread across the board (realistic middle game)
      const positions = [8, 13, 6, 24, 13, 8]
      positions.forEach((pos, index) => {
        const point = middleBoard.points.find(
          (p) => p.position.clockwise === pos
        )
        if (point) {
          point.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point.id,
          })
        }
      })
      // Add some white checkers for a true middle game
      const whitePositions = [7, 12, 18]
      whitePositions.forEach((pos) => {
        const point = middleBoard.points.find(
          (p) => p.position.clockwise === pos
        )
        if (point) {
          point.checkers.push({
            id: generateId(),
            color: 'white',
            checkercontainerId: point.id,
          })
        }
      })
      const middleGame = { ...mockGame, board: middleBoard }
      const isEndgame = GamePhaseDetector.isEndgame(middleGame)
      expect(isEndgame).toBe(false)
    })
  })

  describe('isOpening', () => {
    it('should return true for opening phase', () => {
      const isOpening = GamePhaseDetector.isOpening(mockGame)
      expect(isOpening).toBe(true)
    })

    it('should return false for non-opening phases', () => {
      // Create bear-off position
      const bearOffBoard = Board.initialize()
      bearOffBoard.points.forEach((point) => {
        point.checkers = []
      })

      const point1 = bearOffBoard.points.find((p) => p.position.clockwise === 1)
      if (point1) {
        for (let i = 0; i < 12; i++) {
          point1.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point1.id,
          })
        }
      }

      const bearOffGame = { ...mockGame, board: bearOffBoard }
      const isOpening = GamePhaseDetector.isOpening(bearOffGame)
      expect(isOpening).toBe(false)
    })
  })

  describe('isMiddleGame', () => {
    it('should return true for middle game phase', () => {
      const middleBoard = Board.initialize()
      middleBoard.points.forEach((point) => {
        point.checkers = []
      })
      // Add checkers spread across the board (realistic middle game)
      const positions = [8, 13, 6, 24, 13, 8]
      positions.forEach((pos, index) => {
        const point = middleBoard.points.find(
          (p) => p.position.clockwise === pos
        )
        if (point) {
          point.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point.id,
          })
        }
      })
      // Add some white checkers for a true middle game
      const whitePositions = [7, 12, 18]
      whitePositions.forEach((pos) => {
        const point = middleBoard.points.find(
          (p) => p.position.clockwise === pos
        )
        if (point) {
          point.checkers.push({
            id: generateId(),
            color: 'white',
            checkercontainerId: point.id,
          })
        }
      })
      const middleGame = { ...mockGame, board: middleBoard }
      const isMiddleGame = GamePhaseDetector.isMiddleGame(middleGame)
      expect(isMiddleGame).toBe(true)
    })

    it('should return true for blitz phase', () => {
      const blitzBoard = Board.initialize()
      blitzBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Create blitz position with many blots
      for (let i = 7; i <= 12; i++) {
        const point = blitzBoard.points.find((p) => p.position.clockwise === i)
        if (point) {
          point.checkers = [
            { id: generateId(), color: 'black', checkercontainerId: point.id },
          ]
        }
      }

      blitzBoard.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: 'bar-clockwise',
        },
      ]

      const blitzGame = { ...mockGame, board: blitzBoard }
      const isMiddleGame = GamePhaseDetector.isMiddleGame(blitzGame)
      expect(isMiddleGame).toBe(true)
    })

    it('should return true for backgame phase', () => {
      const backgameBoard = Board.initialize()
      backgameBoard.points.forEach((point) => {
        point.checkers = []
      })

      // Create backgame position
      const anchor = backgameBoard.points.find(
        (p) => p.position.clockwise === 20
      )
      if (anchor) {
        for (let i = 0; i < 5; i++) {
          anchor.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: anchor.id,
          })
        }
      }

      const backgameGame = { ...mockGame, board: backgameBoard }
      const isMiddleGame = GamePhaseDetector.isMiddleGame(backgameGame)
      expect(isMiddleGame).toBe(true)
    })

    it('should return false for opening phase', () => {
      const isMiddleGame = GamePhaseDetector.isMiddleGame(mockGame)
      expect(isMiddleGame).toBe(false)
    })

    it('should return false for endgame phases', () => {
      // Create bear-off position
      const bearOffBoard = Board.initialize()
      bearOffBoard.points.forEach((point) => {
        point.checkers = []
      })

      const point1 = bearOffBoard.points.find((p) => p.position.clockwise === 1)
      if (point1) {
        for (let i = 0; i < 12; i++) {
          point1.checkers.push({
            id: generateId(),
            color: 'black',
            checkercontainerId: point1.id,
          })
        }
      }

      const bearOffGame = { ...mockGame, board: bearOffBoard }
      const isMiddleGame = GamePhaseDetector.isMiddleGame(bearOffGame)
      expect(isMiddleGame).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty board correctly', () => {
      const emptyBoard = Board.initialize()
      emptyBoard.points.forEach((point) => {
        point.checkers = []
      })
      emptyBoard.bar.clockwise.checkers = []
      emptyBoard.bar.counterclockwise.checkers = []
      emptyBoard.off.clockwise.checkers = []
      emptyBoard.off.counterclockwise.checkers = []

      const emptyGame = { ...mockGame, board: emptyBoard }

      // Should not crash and should return a phase
      const phase = GamePhaseDetector.identifyPhase(emptyGame)
      expect(Object.values(GamePhase)).toContain(phase)

      const analysis = GamePhaseDetector.getDetailedPhaseAnalysis(emptyGame)
      expect(analysis).toHaveProperty('phase')
      expect(analysis).toHaveProperty('playerAnalysis')

      expect(typeof GamePhaseDetector.isEndgame(emptyGame)).toBe('boolean')
      expect(typeof GamePhaseDetector.isOpening(emptyGame)).toBe('boolean')
      expect(typeof GamePhaseDetector.isMiddleGame(emptyGame)).toBe('boolean')
    })

    it('should handle game with only one player having checkers', () => {
      const onePlayerBoard = Board.initialize()
      onePlayerBoard.points.forEach((point) => {
        point.checkers = point.checkers.filter((c) => c.color === 'black')
      })

      const onePlayerGame = { ...mockGame, board: onePlayerBoard }

      // Should not crash
      const phase = GamePhaseDetector.identifyPhase(onePlayerGame)
      expect(Object.values(GamePhase)).toContain(phase)

      const analysis = GamePhaseDetector.getDetailedPhaseAnalysis(onePlayerGame)
      expect(analysis).toHaveProperty('phase')
      expect(analysis).toHaveProperty('playerAnalysis')
    })
  })
})
