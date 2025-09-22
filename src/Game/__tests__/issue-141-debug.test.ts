import { Game } from '../..'

describe('Issue #141: Debug turn completion bug', () => {
  it('should debug checkAndCompleteTurn method with mock stuck game', () => {
    // Mock a game state similar to our stuck games
    const mockStuckGame = {
      stateKind: 'moving' as const,
      activePlayer: {
        color: 'white' as const,
        isRobot: false
      },
      activePlay: {
        moves: new Set([
          {
            id: 'move1',
            dieValue: 4,
            moveKind: 'no-move',
            stateKind: 'completed',
            possibleMoves: []
          },
          {
            id: 'move2',
            dieValue: 6,
            moveKind: 'point-to-point',
            stateKind: 'completed',
            possibleMoves: []
          }
        ])
      }
    }

    console.log('🧪 Testing checkAndCompleteTurn with mock stuck game...')
    console.log('📊 Input game state:', mockStuckGame.stateKind)
    console.log('📊 Active play moves:', Array.from(mockStuckGame.activePlay.moves).map(m => ({
      dieValue: m.dieValue,
      moveKind: m.moveKind,
      stateKind: m.stateKind
    })))

    // Test the checkAndCompleteTurn method
    const result = Game.checkAndCompleteTurn(mockStuckGame as any)

    console.log('📊 Result game state:', result.stateKind)

    // The bug is that this should return 'moved' state but returns 'moving'
    expect(result.stateKind).toBe('moved')
  })

  it('should debug toMoved method directly', () => {
    const mockMovingGame = {
      stateKind: 'moving' as const,
      activePlayer: {
        color: 'white' as const,
        isRobot: false
      },
      activePlay: {
        moves: new Set([
          {
            id: 'move1',
            dieValue: 4,
            moveKind: 'no-move',
            stateKind: 'completed',
            possibleMoves: []
          },
          {
            id: 'move2',
            dieValue: 6,
            moveKind: 'point-to-point',
            stateKind: 'completed',
            possibleMoves: []
          }
        ])
      }
    }

    console.log('🧪 Testing toMoved directly...')

    try {
      const result = Game.toMoved(mockMovingGame as any)
      console.log('✅ toMoved succeeded, result state:', result.stateKind)
      expect(result.stateKind).toBe('moved')
    } catch (error) {
      console.log('❌ toMoved failed with error:', error)
      throw error
    }
  })

  it('should debug full executeAndRecalculate flow', () => {
    // Create a more complete mock game for executeAndRecalculate
    const mockGame = {
      id: 'test-game',
      stateKind: 'moving' as const,
      activePlayer: {
        color: 'white' as const,
        isRobot: false,
        dice: {
          currentRoll: [4, 6],
          stateKind: 'rolled'
        }
      },
      activePlay: {
        id: 'test-play',
        moves: new Set([
          {
            id: 'move1',
            dieValue: 4,
            moveKind: 'no-move',
            stateKind: 'completed',
            possibleMoves: []
          },
          {
            id: 'move2',
            dieValue: 6,
            moveKind: 'point-to-point',
            stateKind: 'completed',
            possibleMoves: []
          }
        ])
      }
    }

    console.log('🧪 Testing full executeAndRecalculate flow...')
    console.log('📊 Input game state:', mockGame.stateKind)
    console.log('📊 Player:', mockGame.activePlayer.color, mockGame.activePlayer.isRobot ? '(robot)' : '(human)')

    // This is what the CORE logic would return - it should detect completed moves and transition to 'moved'
    const coreResult = Game.checkAndCompleteTurn(mockGame as any)
    console.log('📊 Core checkAndCompleteTurn result:', coreResult.stateKind)

    // The issue is likely that this 'moved' state is not being persisted by the API layer
    expect(coreResult.stateKind).toBe('moved')
  })
})