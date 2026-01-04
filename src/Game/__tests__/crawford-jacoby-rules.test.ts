import { describe, expect, it } from '@jest/globals'
import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { Game } from '../index'

describe('Crawford and Jacoby Rules', () => {
  describe('Crawford Rule - Doubling Blocked During Crawford Game', () => {
    it('should block doubling when Crawford rule is enabled and isCrawford is true', () => {
      // Create a game
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      )

      // Roll for start and then roll to get into rolling state
      const rolledForStart = Game.rollForStart(game)
      const rolled = Game.roll(rolledForStart)

      // Inject Crawford rule after game is setup
      // We'll test canOfferDouble on a rolling state game
      const gameInRolling: BackgammonGame = {
        ...rolled,
        stateKind: 'rolling', // Force to rolling state for testing
        rules: {
          useCrawfordRule: true,
        },
        matchInfo: {
          matchId: 'test-match-1',
          gameNumber: 3,
          matchLength: 5,
          matchScore: { white: 3, black: 2 },
          isCrawford: true,
        },
      }

      // Test canOfferDouble - should return false due to Crawford rule
      const canDouble = Game.canOfferDouble(gameInRolling, gameInRolling.activePlayer!)

      expect(canDouble).toBe(false)
      expect(gameInRolling.rules?.useCrawfordRule).toBe(true)
      expect(gameInRolling.matchInfo?.isCrawford).toBe(true)
    })

    it('should allow doubling when Crawford rule is enabled but isCrawford is false', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      )

      const rolledForStart = Game.rollForStart(game)
      const rolled = Game.roll(rolledForStart)

      const gameInRolling: BackgammonGame = {
        ...rolled,
        stateKind: 'rolling',
        rules: {
          useCrawfordRule: true,
        },
        matchInfo: {
          matchId: 'test-match-1',
          gameNumber: 4,
          matchLength: 5,
          matchScore: { white: 3, black: 3 },
          isCrawford: false, // Not a Crawford game
        },
      }

      // Test canOfferDouble - should return true (Crawford rule enabled but not Crawford game)
      const canDouble = Game.canOfferDouble(gameInRolling, gameInRolling.activePlayer!)

      expect(canDouble).toBe(true)
      expect(gameInRolling.rules?.useCrawfordRule).toBe(true)
      expect(gameInRolling.matchInfo?.isCrawford).toBe(false)
    })

    it('should allow doubling when Crawford rule is disabled', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      )

      const rolledForStart = Game.rollForStart(game)
      const rolled = Game.roll(rolledForStart)

      const gameInRolling: BackgammonGame = {
        ...rolled,
        stateKind: 'rolling',
        rules: {
          useCrawfordRule: false,
        },
        matchInfo: {
          matchId: 'test-match-1',
          gameNumber: 3,
          matchLength: 5,
          matchScore: { white: 3, black: 2 },
          isCrawford: true, // This should be ignored when rule is disabled
        },
      }

      // Should allow doubling since Crawford rule is disabled
      const canDouble = Game.canOfferDouble(gameInRolling, gameInRolling.activePlayer!)
      expect(canDouble).toBe(true)
    })
  })

  describe('Jacoby Rule - Game Creation with Rules', () => {
    it('should create game with Jacoby rule enabled when passed in options', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false },
        {
          rules: {
            useJacobyRule: true,
          },
        }
      )

      expect(game.rules?.useJacobyRule).toBe(true)
    })

    it('should create game with Crawford rule enabled when passed in options', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false },
        {
          rules: {
            useCrawfordRule: true,
          },
        }
      )

      expect(game.rules?.useCrawfordRule).toBe(true)
    })

    it('should create game with multiple rules enabled', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false },
        {
          rules: {
            useCrawfordRule: true,
            useJacobyRule: true,
            useBeaverRule: true,
          },
        }
      )

      expect(game.rules?.useCrawfordRule).toBe(true)
      expect(game.rules?.useJacobyRule).toBe(true)
      expect(game.rules?.useBeaverRule).toBe(true)
    })

    it('should create game with no rules when options not provided', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      )

      // Rules should be empty object or undefined
      expect(game.rules?.useCrawfordRule).toBeUndefined()
      expect(game.rules?.useJacobyRule).toBeUndefined()
    })
  })

  describe('refuseDouble scoring', () => {
    it('should return winType simple and correct pointsWon when double is refused', () => {
      const game = Game.createNewGame(
        { userId: 'player1', isRobot: false },
        { userId: 'player2', isRobot: false }
      )

      const rolledForStart = Game.rollForStart(game)

      // Get to rolling state
      const rollingGame: BackgammonGame = {
        ...rolledForStart,
        stateKind: 'rolling',
        activePlayer: {
          ...rolledForStart.activePlayer,
          stateKind: 'rolling',
        },
        inactivePlayer: {
          ...rolledForStart.inactivePlayer,
          stateKind: 'inactive',
        },
      } as any

      // Offer a double
      const doubledGame = Game.double(rollingGame as any)

      // The non-offering player refuses
      const refusingPlayer = doubledGame.players.find(
        p => p.id !== doubledGame.cube.offeredBy?.id
      )!

      const completedGame = Game.refuseDouble(doubledGame, refusingPlayer as any)

      expect(completedGame.stateKind).toBe('completed')
      expect((completedGame as any).winType).toBe('simple')
      // When refusing first double from centered cube, points = 1
      expect((completedGame as any).pointsWon).toBe(1)
    })
  })
})
