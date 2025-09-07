import { Player } from '../../Player'
import {
  createMinimalGameData,
  CURRENT_GAME_VERSION,
  DEFAULT_GAME_RULES,
  DEFAULT_GAME_SETTINGS,
  gameDataToGameCore,
  gameToGameData,
} from '../GameDataAdapter'
import { Game } from '../index'

describe('GameDataAdapter', () => {
  describe('gameToGameData', () => {
    it('should convert Game instance to complete BackgammonGame data', () => {
      // Create a minimal Game instance using the static method
      const players = [
        Player.initialize(
          'white',
          'clockwise',
          'inactive',
          false,
          'user1'
        ),
        Player.initialize(
          'black',
          'counterclockwise',
          'inactive',
          false,
          'user2'
        ),
      ] as [any, any] // Cast to tuple type for BackgammonPlayers

      const gameData = Game.initialize(players, 'test-game')

      // Create a Game class instance from the gameData
      const game = new Game()
      Object.assign(game, gameData)

      // Convert to GameData format
      const convertedGameData = gameToGameData(game)

      // Should have all Game properties
      expect(convertedGameData.id).toBe(game.id)
      expect(convertedGameData.stateKind).toBe(game.stateKind)
      expect(convertedGameData.players).toEqual(game.players)
      expect(convertedGameData.board).toEqual(game.board)
      expect(convertedGameData.cube).toEqual(game.cube)

      // Should have additional required properties
      expect(convertedGameData.createdAt).toBeInstanceOf(Date)
      expect(convertedGameData.version).toBe(CURRENT_GAME_VERSION)
      expect(convertedGameData.rules).toEqual(DEFAULT_GAME_RULES)
      expect(convertedGameData.settings).toEqual(DEFAULT_GAME_SETTINGS)
      expect(convertedGameData.lastUpdate).toBeInstanceOf(Date)
    })

    it('should allow overriding default values', () => {
      const players = [
        Player.initialize(
          'white',
          'clockwise',
          'inactive',
          false,
          'user1'
        ),
        Player.initialize(
          'black',
          'counterclockwise',
          'inactive',
          false,
          'user2'
        ),
      ] as [any, any] // Cast to tuple type for BackgammonPlayers

      const gameData = Game.initialize(players, 'test-game')
      const game = new Game()
      Object.assign(game, gameData)

      const customCreatedAt = new Date('2023-01-01')

      const convertedGameData = gameToGameData(game, {
        createdAt: customCreatedAt,
        version: '2.0.0',
      })

      expect(convertedGameData.createdAt).toEqual(customCreatedAt)
      expect(convertedGameData.version).toBe('2.0.0')
      expect(convertedGameData.rules).toEqual(DEFAULT_GAME_RULES) // Defaults preserved
    })
  })

  describe('gameDataToGameCore', () => {
    it('should extract core Game properties from BackgammonGame', () => {
      const gameData = createMinimalGameData({
        id: 'test-game',
        stateKind: 'rolling-for-start',
      })

      const coreData = gameDataToGameCore(gameData)

      expect(coreData.id).toBe('test-game')
      expect(coreData.stateKind).toBe('rolling-for-start')
      expect(coreData).not.toHaveProperty('createdAt')
      expect(coreData).not.toHaveProperty('rules')
      expect(coreData).not.toHaveProperty('settings')
    })
  })

  describe('createMinimalGameData', () => {
    it('should create valid BackgammonGame with minimal input', () => {
      const gameData = createMinimalGameData({
        id: 'minimal-test',
      })

      expect(gameData.id).toBe('minimal-test')
      expect(gameData.stateKind).toBe('rolling-for-start')
      expect(gameData.createdAt).toBeInstanceOf(Date)
      expect(gameData.version).toBe(CURRENT_GAME_VERSION)
      expect(gameData.rules).toEqual(DEFAULT_GAME_RULES)
      expect(gameData.settings).toEqual(DEFAULT_GAME_SETTINGS)
    })
  })
})
