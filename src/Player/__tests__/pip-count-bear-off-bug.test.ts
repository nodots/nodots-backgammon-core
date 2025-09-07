import { Player } from '../index'
import { Board } from '../../Board'
import { BackgammonGame, BackgammonBoard, BackgammonPlayers } from '@nodots-llc/backgammon-types'

describe('Pip Count Bear Off Bug', () => {
  it('should return 0 pip count when all checkers are borne off', () => {
    // Create a basic board structure
    const board = Board.initialize()
    
    // Create players
    const players: BackgammonPlayers = [
      Player.initialize('white', 'clockwise', 'inactive', false),
      Player.initialize('black', 'counterclockwise', 'inactive', false)
    ]

    // Create a mock game with all white checkers borne off
    const gameWithAllBornOff: BackgammonGame = {
      id: 'test-game',
      stateKind: 'idle',
      players,
      board: {
        ...board,
        points: board.points.map(point => ({
          ...point,
          checkers: [] // No checkers on any points
        })),
        bar: {
          clockwise: { checkers: [] },
          counterclockwise: { checkers: [] }
        },
        off: {
          clockwise: { checkers: Array(15).fill(0).map((_, i) => ({
            id: `white-checker-${i}`,
            color: 'white' as const,
          })) },
          counterclockwise: { checkers: [] }
        }
      },
      winner: undefined,
      activePlayer: undefined,
      activePlay: undefined,
      resignedBy: undefined,
      drewToEnd: false,
      startedAt: new Date(),
      endedAt: undefined,
      history: [],
      settings: {}
    } as any

    const whitePipCount = Player.calculatePipCount(gameWithAllBornOff, 'white')
    
    // This test will currently FAIL because the bug exists
    // The function doesn't account for borne-off checkers
    // It should return 0 but will return some other value
    console.log('🐛 White pip count with all checkers borne off:', whitePipCount)
    expect(whitePipCount).toBe(0)
  })

  it('should return 1 pip count when one checker is on point 1', () => {
    // Create a basic board structure  
    const board = Board.initialize()
    
    // Create players
    const players: BackgammonPlayers = [
      Player.initialize('white', 'clockwise', 'inactive', false),
      Player.initialize('black', 'counterclockwise', 'inactive', false)
    ]

    // Find point 1 for white (clockwise) player
    const point1 = board.points.find(p => p.position.clockwise === 1)!
    
    const gameWithOneCheckerOnPoint1: BackgammonGame = {
      id: 'test-game',
      stateKind: 'idle', 
      players,
      board: {
        ...board,
        points: board.points.map(point => ({
          ...point,
          checkers: point.id === point1.id ? [{
            id: 'white-checker-1',
            color: 'white' as const,
          }] : []
        })),
        bar: {
          clockwise: { checkers: [] },
          counterclockwise: { checkers: [] }
        },
        off: {
          clockwise: { checkers: [] },
          counterclockwise: { checkers: [] }
        }
      },
      winner: undefined,
      activePlayer: undefined,
      activePlay: undefined,
      resignedBy: undefined,
      drewToEnd: false,
      startedAt: new Date(),
      endedAt: undefined,
      history: [],
      settings: {}
    } as any

    const whitePipCount = Player.calculatePipCount(gameWithOneCheckerOnPoint1, 'white')
    console.log('✅ White pip count with one checker on point 1:', whitePipCount)
    expect(whitePipCount).toBe(1)
  })
})