import { describe, expect, it, beforeEach } from '@jest/globals'
import {
  BackgammonGameDoubled,
  BackgammonGameRolling,
  BackgammonPlayerRolling,
  BackgammonPlayerInactive,
} from '@nodots-llc/backgammon-types'
import { Game } from '..'
import { generateId } from '../..'
import { Board } from '../../Board'
import { Cube } from '../../Cube'

/**
 * Tests for the doubling cube game flow.
 * Tests Game.double(), Game.acceptDouble(), Game.refuseDouble() and related validation.
 */
describe('Doubling Cube Game Flow', () => {
  let rollingGame: BackgammonGameRolling

  beforeEach(() => {
    // Create a mock rolling game directly for testing doubling
    const activePlayer: BackgammonPlayerRolling = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'rolling',
      color: 'white',
      direction: 'clockwise',
      dice: {
        id: generateId(),
        color: 'white',
        stateKind: 'rolling',
        currentRoll: undefined,
      },
      pipCount: 167,
      isRobot: false,
      rollForStartValue: 5,
    }

    const inactivePlayer: BackgammonPlayerInactive = {
      id: generateId(),
      userId: generateId(),
      stateKind: 'inactive',
      color: 'black',
      direction: 'counterclockwise',
      dice: {
        id: generateId(),
        color: 'black',
        stateKind: 'inactive',
        currentRoll: undefined,
      },
      pipCount: 167,
      isRobot: false,
      rollForStartValue: 3,
    }

    const board = Board.initialize([activePlayer, inactivePlayer])
    const cube = Cube.initialize()

    rollingGame = {
      id: generateId(),
      stateKind: 'rolling',
      players: [activePlayer, inactivePlayer],
      board,
      cube,
      activeColor: 'white',
      activePlayer,
      inactivePlayer,
      createdAt: new Date(),
      version: '1.0.0',
      rules: {},
      settings: {},
    } as BackgammonGameRolling
  })

  describe('Game.canOfferDouble()', () => {
    it('should return true when in rolling state and cube has no owner (anyone can double)', () => {
      // Initial state: no one owns the cube, so any player can double
      const canDouble = Game.canOfferDouble(rollingGame, rollingGame.activePlayer)
      expect(canDouble).toBe(true)
    })

    it('should return true when active player OWNS the cube (they can re-double)', () => {
      // Create a game where the active player owns the cube
      const gameWithOwnedCube = {
        ...rollingGame,
        cube: {
          ...rollingGame.cube,
          stateKind: 'doubled' as const,
          value: 2 as const,
          owner: rollingGame.activePlayer, // Active player owns the cube
        },
      } as BackgammonGameRolling

      // Per backgammon rules: only the player who owns the cube can offer a double
      const canDouble = Game.canOfferDouble(gameWithOwnedCube, gameWithOwnedCube.activePlayer)
      expect(canDouble).toBe(true)
    })

    it('should return false when opponent owns the cube (only owner can re-double)', () => {
      // Create a game where the INACTIVE player (opponent) owns the cube
      const gameWithOpponentCube = {
        ...rollingGame,
        cube: {
          ...rollingGame.cube,
          stateKind: 'doubled' as const,
          value: 2 as const,
          owner: rollingGame.inactivePlayer, // Opponent owns the cube
        },
      } as BackgammonGameRolling

      // Per backgammon rules: active player cannot double because they don't own the cube
      const canDouble = Game.canOfferDouble(gameWithOpponentCube, gameWithOpponentCube.activePlayer)
      expect(canDouble).toBe(false)
    })

    it('should return false when cube is maxxed (at 64)', () => {
      // Create a game with cube at 64 (maxxed)
      const maxxedCubeGame = {
        ...rollingGame,
        cube: {
          ...rollingGame.cube,
          stateKind: 'maxxed' as const,
          value: 64 as const,
          owner: undefined,
        },
      } as BackgammonGameRolling

      const canDouble = Game.canOfferDouble(maxxedCubeGame, maxxedCubeGame.activePlayer)
      expect(canDouble).toBe(false)
    })
  })

  describe('Game.double()', () => {
    it('should transition game from rolling to doubled state', () => {
      const doubledGame = Game.double(rollingGame)

      expect(doubledGame.stateKind).toBe('doubled')
      expect(doubledGame.cube.stateKind).toBe('offered')
    })

    it('should NOT change cube value when offering (value changes on accept)', () => {
      const doubledGame = Game.double(rollingGame)

      // Cube value stays undefined until opponent accepts
      expect(doubledGame.cube.value).toBeUndefined()
    })

    it('should set offeredBy to the active player', () => {
      const doubledGame = Game.double(rollingGame)

      expect(doubledGame.cube.offeredBy).toBeDefined()
      expect(doubledGame.cube.offeredBy?.id).toBe(rollingGame.activePlayer.id)
    })

    it('should throw error if game is not in rolling state', () => {
      // Create a mock game in moving state directly
      // Using mock instead of Game.roll() since roll behavior varies by board state
      const movingGame = {
        ...rollingGame,
        stateKind: 'moving',
      }

      expect(() => {
        Game.double(movingGame as any)
      }).toThrow()
    })

    it('should update statistics with cube history', () => {
      const gameWithStats = {
        ...rollingGame,
        statistics: {
          totalMoves: 0,
          totalRolls: 1,
          totalDoubles: 0,
          averageMoveTime: 0,
          longestMoveTime: 0,
          shortestMoveTime: 0,
          pipCountHistory: [],
          cubeHistory: [],
        },
      } as BackgammonGameRolling

      const doubledGame = Game.double(gameWithStats)

      expect(doubledGame.statistics?.totalDoubles).toBe(1)
      expect(doubledGame.statistics?.cubeHistory.length).toBe(1)
      expect(doubledGame.statistics?.cubeHistory[0].value).toBe(2)
      expect(doubledGame.statistics?.cubeHistory[0].accepted).toBe(false)
    })
  })

  describe('Game.acceptDouble()', () => {
    let doubledGame: BackgammonGameDoubled

    beforeEach(() => {
      doubledGame = Game.double(rollingGame)
    })

    it('should transition game to rolling state after acceptance', () => {
      const acceptedGame = Game.acceptDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      // After accepting, game should be in rolling state so the offering player can roll
      expect(acceptedGame.stateKind).toBe('rolling')
    })

    it('should set cube value to 2 on first acceptance', () => {
      const acceptedGame = Game.acceptDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      // First double: undefined -> 2 (value changes NOW on acceptance, not on offer)
      expect(acceptedGame.cube.value).toBe(2)
    })

    it('should transfer cube ownership to accepting player', () => {
      const acceptingPlayer = doubledGame.inactivePlayer
      const acceptedGame = Game.acceptDouble(
        doubledGame,
        acceptingPlayer as any
      )

      expect(acceptedGame.cube.owner?.id).toBe(acceptingPlayer.id)
    })

    it('should clear offeredBy after acceptance', () => {
      const acceptedGame = Game.acceptDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      expect(acceptedGame.cube.offeredBy).toBeUndefined()
    })

    it('should throw error if player is the one who offered', () => {
      expect(() => {
        Game.acceptDouble(doubledGame, doubledGame.activePlayer as any)
      }).toThrow()
    })

    it('should continue play with maxxed cube when reaching 64', () => {
      // Create a doubled game with cube at 32 (next double would be 64)
      const highCubeGame: BackgammonGameDoubled = {
        ...doubledGame,
        cube: {
          ...doubledGame.cube,
          stateKind: 'offered' as const,
          value: 32 as const,
        },
      }

      const acceptedGame = Game.acceptDouble(
        highCubeGame,
        highCubeGame.inactivePlayer as any
      )

      // When cube reaches 64, play continues but cube is maxxed (no further doubling)
      expect(acceptedGame.stateKind).toBe('rolling')
      expect(acceptedGame.cube.stateKind).toBe('maxxed')
      expect(acceptedGame.cube.value).toBe(64)
    })
  })

  describe('Game.refuseDouble()', () => {
    let doubledGame: BackgammonGameDoubled

    beforeEach(() => {
      doubledGame = Game.double(rollingGame)
    })

    it('should end game immediately', () => {
      const refusedGame = Game.refuseDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      expect(refusedGame.stateKind).toBe('completed')
    })

    it('should set offering player as winner', () => {
      const offeringPlayerId = doubledGame.activePlayer.id
      const refusedGame = Game.refuseDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      expect(refusedGame.winner).toBe(offeringPlayerId)
    })

    it('should throw error if player is the one who offered', () => {
      expect(() => {
        Game.refuseDouble(doubledGame, doubledGame.activePlayer as any)
      }).toThrow()
    })
  })

  describe('Game.canAcceptDouble() and Game.canRefuseDouble()', () => {
    let doubledGame: BackgammonGameDoubled

    beforeEach(() => {
      doubledGame = Game.double(rollingGame)
    })

    it('should return true for the player who did not offer', () => {
      const canAccept = Game.canAcceptDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )
      const canRefuse = Game.canRefuseDouble(
        doubledGame,
        doubledGame.inactivePlayer as any
      )

      expect(canAccept).toBe(true)
      expect(canRefuse).toBe(true)
    })

    it('should return false for the player who offered', () => {
      const canAccept = Game.canAcceptDouble(
        doubledGame,
        doubledGame.activePlayer as any
      )
      const canRefuse = Game.canRefuseDouble(
        doubledGame,
        doubledGame.activePlayer as any
      )

      expect(canAccept).toBe(false)
      expect(canRefuse).toBe(false)
    })

    it('should return false when cube is not in offered state', () => {
      const notOfferedGame = {
        ...doubledGame,
        cube: {
          ...doubledGame.cube,
          stateKind: 'doubled' as const,
        },
      } as BackgammonGameDoubled

      const canAccept = Game.canAcceptDouble(
        notOfferedGame,
        notOfferedGame.inactivePlayer as any
      )

      expect(canAccept).toBe(false)
    })
  })
})
