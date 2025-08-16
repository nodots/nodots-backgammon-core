import { GameEventEmitter } from '../GameEventEmitter'

describe('GameEventEmitter', () => {
  let emitter: GameEventEmitter
  const gameId = 'test-game-123'

  beforeEach(() => {
    emitter = new GameEventEmitter(gameId)
  })

  describe('constructor', () => {
    it('should create instance with gameId', () => {
      expect(emitter).toBeInstanceOf(GameEventEmitter)
      expect(emitter.getGameId()).toBe(gameId)
    })

    it('should handle empty gameId', () => {
      const emptyEmitter = new GameEventEmitter('')
      expect(emptyEmitter.getGameId()).toBe('')
    })

    it('should handle special characters in gameId', () => {
      const specialId = 'game-123_test@domain.com'
      const specialEmitter = new GameEventEmitter(specialId)
      expect(specialEmitter.getGameId()).toBe(specialId)
    })
  })

  describe('getGameId', () => {
    it('should return the gameId passed in constructor', () => {
      expect(emitter.getGameId()).toBe(gameId)
    })

    it('should return consistent gameId on multiple calls', () => {
      const firstCall = emitter.getGameId()
      const secondCall = emitter.getGameId()
      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe(gameId)
    })
  })

  describe('emit', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should emit event with data', () => {
      const eventName = 'test-event'
      const eventData = { message: 'test data' }
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })

    it('should emit event with string data', () => {
      const eventName = 'string-event'
      const eventData = 'simple string'
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })

    it('should emit event with null data', () => {
      const eventName = 'null-event'
      const eventData = null
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })

    it('should emit event with undefined data', () => {
      const eventName = 'undefined-event'
      const eventData = undefined
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })

    it('should emit event with complex object data', () => {
      const eventName = 'complex-event'
      const eventData = {
        nested: {
          property: 'value',
          array: [1, 2, 3],
          boolean: true
        },
        timestamp: new Date('2023-01-01')
      }
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })

    it('should emit multiple events in sequence', () => {
      emitter.emit('event1', 'data1')
      emitter.emit('event2', 'data2')
      emitter.emit('event3', 'data3')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Event event1:', 'data1')
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Event event2:', 'data2')
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Event event3:', 'data3')
    })

    it('should handle empty event name', () => {
      const eventName = ''
      const eventData = 'test'
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith('Event :', eventData)
    })

    it('should handle special characters in event name', () => {
      const eventName = 'event-with_special@characters.test'
      const eventData = 'test'
      
      emitter.emit(eventName, eventData)
      
      expect(consoleSpy).toHaveBeenCalledWith(`Event ${eventName}:`, eventData)
    })
  })

  describe('integration scenarios', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should emit game-specific events with gameId context', () => {
      const moveData = { from: 'point1', to: 'point2', player: 'white' }
      
      emitter.emit('move-made', moveData)
      
      expect(consoleSpy).toHaveBeenCalledWith('Event move-made:', moveData)
      expect(emitter.getGameId()).toBe(gameId)
    })

    it('should handle multiple emitters for different games', () => {
      const emitter2 = new GameEventEmitter('game-456')
      
      emitter.emit('event1', 'data1')
      emitter2.emit('event2', 'data2')
      
      expect(emitter.getGameId()).toBe(gameId)
      expect(emitter2.getGameId()).toBe('game-456')
      expect(consoleSpy).toHaveBeenCalledTimes(2)
    })
  })
})