import { Game } from '../index'
import { Player } from '../../Player'
import { Board } from '../../Board'
import { Cube } from '../../Cube'
import { Dice } from '../../Dice'
import {
  BackgammonGameRolled,
  BackgammonPlayerRolled,
  BackgammonPlayerInactive,
} from '@nodots-llc/backgammon-types'

describe('Game.getRolledStateCapabilities', () => {
  let baseGame: BackgammonGameRolled

  beforeEach(() => {
    // Create a simple rolled game using Game.createNewGame and transitioning it to rolled state
    const newGame = Game.createNewGame(
      { userId: 'test-user-1', isRobot: false },
      { userId: 'test-user-2', isRobot: false }
    )
    
    // Transition to rolled-for-start
    const rolledForStartGame = Game.rollForStart(newGame as any)
    
    // Transition to rolled
    baseGame = Game.roll(rolledForStartGame) as BackgammonGameRolled
  })

  describe('canSwitchDice', () => {
    it('should return true when dice values are different', () => {
      // Force different dice values
      if (baseGame.activePlayer.dice?.currentRoll) {
        (baseGame.activePlayer.dice as any).currentRoll = [3, 5]
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canSwitchDice).toBe(true)
    })

    it('should return false when dice values are the same', () => {
      // Force same dice values
      if (baseGame.activePlayer.dice?.currentRoll) {
        (baseGame.activePlayer.dice as any).currentRoll = [4, 4]
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canSwitchDice).toBe(false)
    })

    it('should return false when no dice currentRoll exists', () => {
      // Remove dice currentRoll
      if (baseGame.activePlayer.dice) {
        (baseGame.activePlayer.dice as any).currentRoll = undefined
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canSwitchDice).toBe(false)
    })
  })

  describe('canDouble', () => {
    it('should return true when in rolled state (doubling allowed after rolling)', () => {
      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canDouble).toBe(true)
    })

    it('should return false when player owns the cube (and in rolled state)', () => {
      // Make active player own the cube
      (baseGame as any).cube = {
        ...baseGame.cube,
        stateKind: 'doubled',
        owner: baseGame.activePlayer,
        value: 2,
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canDouble).toBe(false)
    })

    it('should return false when cube is maxxed (and in rolled state)', () => {
      (baseGame as any).cube = {
        ...baseGame.cube,
        stateKind: 'maxxed',
        value: 64,
        owner: undefined,
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canDouble).toBe(false)
    })

    it('should return false when cube is already offered (and in rolled state)', () => {
      (baseGame as any).cube = {
        ...baseGame.cube,
        stateKind: 'offered',
        owner: baseGame.inactivePlayer,
        value: 2,
        offeredBy: baseGame.inactivePlayer,
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canDouble).toBe(false)
    })

    it('should return false when cube value would exceed 64 (and in rolled state)', () => {
      (baseGame as any).cube = {
        ...baseGame.cube,
        stateKind: 'doubled',
        owner: baseGame.inactivePlayer,
        value: 64,
      }

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canDouble).toBe(false)
    })
  })

  describe('canMove', () => {
    it('should return true when ready moves with possible moves exist', () => {
      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canMove).toBe(true)
    })

    it('should return false when no ready moves exist', () => {
      // Create a game with no ready moves by setting all moves to completed
      (baseGame.activePlay as any).moves = new Set([
        {
          id: 'move-1',
          stateKind: 'completed',
          possibleMoves: [],
        },
        {
          id: 'move-2', 
          stateKind: 'completed',
          possibleMoves: [],
        }
      ])

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canMove).toBe(false)
    })

    it('should return false when ready moves have no possible moves', () => {
      // Create ready moves with empty possible moves
      (baseGame.activePlay as any).moves = new Set([
        {
          id: 'move-1',
          stateKind: 'ready',
          possibleMoves: [],
        },
        {
          id: 'move-2',
          stateKind: 'ready', 
          possibleMoves: [],
        }
      ])

      const capabilities = Game.getRolledStateCapabilities(baseGame)
      expect(capabilities.canMove).toBe(false)
    })
  })

  describe('all capabilities together', () => {
    it('should return correct structure', () => {
      const capabilities = Game.getRolledStateCapabilities(baseGame)
      
      expect(capabilities).toHaveProperty('canSwitchDice')
      expect(capabilities).toHaveProperty('canDouble')
      expect(capabilities).toHaveProperty('canMove')
      expect(typeof capabilities.canSwitchDice).toBe('boolean')
      expect(typeof capabilities.canDouble).toBe('boolean')
      expect(typeof capabilities.canMove).toBe('boolean')
    })
  })
})

// NOTE: Game.double() tests commented out because doubling behavior has changed
// Doubling now only works from 'rolling' state, not 'rolled' state
// These tests need to be rewritten for the new doubling flow:
// 1. Game must be in 'rolling' state
// 2. Game.double() returns 'doubled' state (waiting for opponent response)
// 3. Opponent must accept/refuse before dice can be rolled
/*
describe('Game.double', () => {
  let baseGame: BackgammonGameRolled

  beforeEach(() => {
    // Create a simple rolled game
    const newGame = Game.createNewGame(
      { userId: 'test-user-1', isRobot: false },
      { userId: 'test-user-2', isRobot: false }
    )
    
    // Transition to rolled-for-start
    const rolledForStartGame = Game.rollForStart(newGame as any)
    
    // Transition to rolled
    baseGame = Game.roll(rolledForStartGame) as BackgammonGameRolled
  })

  it('should double the cube value from initial state', () => {
    const doubledGame = Game.double(baseGame)

    expect(doubledGame.cube.stateKind).toBe('doubled')
    expect(doubledGame.cube.value).toBe(2)
    expect(doubledGame.cube.owner).toBe(baseGame.activePlayer)
    expect(doubledGame.cube.offeredBy).toBeUndefined()
  })

  it('should double from existing cube value', () => {
    // Set existing cube value
    (baseGame as any).cube = {
      ...baseGame.cube,
      stateKind: 'doubled',
      value: 4,
      owner: baseGame.inactivePlayer,
    }

    const doubledGame = Game.double(baseGame)

    expect(doubledGame.cube.stateKind).toBe('doubled')
    expect(doubledGame.cube.value).toBe(8)
    expect(doubledGame.cube.owner).toBe(baseGame.activePlayer)
    expect(doubledGame.cube.offeredBy).toBeUndefined()
  })

  it('should set cube to maxxed when reaching 64', () => {
    // Set cube to 32 so doubling reaches 64
    (baseGame as any).cube = {
      ...baseGame.cube,
      stateKind: 'doubled',
      value: 32,
      owner: baseGame.inactivePlayer,
    }

    const doubledGame = Game.double(baseGame)

    expect(doubledGame.cube.stateKind).toBe('maxxed')
    expect(doubledGame.cube.value).toBe(64)
    expect(doubledGame.cube.owner).toBeUndefined() // Maxxed cube has no owner
    expect(doubledGame.cube.offeredBy).toBeUndefined()
  })

  it('should maintain game in rolled state', () => {
    const doubledGame = Game.double(baseGame)

    expect(doubledGame.stateKind).toBe('rolled')
    expect(doubledGame.activePlayer).toBe(baseGame.activePlayer)
    expect(doubledGame.activePlay).toBe(baseGame.activePlay)
  })

  it('should update statistics when present', () => {
    // Add statistics to base game
    (baseGame as any).statistics = {
      totalMoves: 5,
      totalRolls: 3,
      totalDoubles: 1,
      averageMoveTime: 2000,
      longestMoveTime: 5000,
      shortestMoveTime: 500,
      pipCountHistory: [],
      cubeHistory: [],
    }

    const doubledGame = Game.double(baseGame)

    expect(doubledGame.statistics?.totalDoubles).toBe(2)
    expect(doubledGame.statistics?.cubeHistory).toHaveLength(1)
    expect(doubledGame.statistics?.cubeHistory[0]).toEqual({
      turn: 3,
      value: 2,
      offeredBy: baseGame.activePlayer.color,
      accepted: true,
    })
  })

  it('should throw error when not in rolled state', () => {
    const nonRolledGame = {
      ...baseGame,
      stateKind: 'moving' as const,
    } as any

    expect(() => Game.double(nonRolledGame)).toThrow('Cannot double from moving state')
  })

  it('should throw error when doubling not allowed', () => {
    // Make active player own the cube (not allowed to double)
    (baseGame as any).cube = {
      ...baseGame.cube,
      stateKind: 'doubled',
      owner: baseGame.activePlayer,
      value: 2,
    }

    expect(() => Game.double(baseGame)).toThrow('Doubling is not allowed in current game state')
  })

  it('should throw error when cube is maxxed', () => {
    (baseGame as any).cube = {
      ...baseGame.cube,
      stateKind: 'maxxed',
      value: 64,
      owner: undefined,
    }

    expect () => Game.double(baseGame)).toThrow('Doubling is not allowed in current game state')
  })
})
*/