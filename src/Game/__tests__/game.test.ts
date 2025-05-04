import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonMoveReady,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
} from 'nodots-backgammon-types'
import { Game } from '..'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { generateId, randomBackgammonColor } from '../../'
import { describe, it, expect } from '@jest/globals'

describe('Game', () => {
  describe('Initialization', () => {
    it('should initialize the game correctly with minimal parameters', () => {
      const clockwiseColor = randomBackgammonColor()
      const counterclockwiseColor =
        clockwiseColor === 'black' ? 'white' : 'black'
      const players: BackgammonPlayers = [
        Player.initialize(clockwiseColor, 'clockwise'),
        Player.initialize(counterclockwiseColor, 'counterclockwise'),
      ]

      const game = Game.initialize(players) as BackgammonGameRollingForStart
      expect(game).toBeDefined()
      expect(game.stateKind).toBe('rolling-for-start')
      expect(game.players).toBeDefined()
      expect(game.players.length).toBe(2)
      expect(game.board).toBeDefined()
      expect(game.cube).toBeDefined()
      expect(game.activeColor).toBeUndefined()
      expect(game.activePlayer).toBeUndefined()
      expect(game.inactivePlayer).toBeUndefined()
    })

    it('should throw error when initializing in completed state', () => {
      const players: BackgammonPlayers = [
        Player.initialize('black', 'clockwise'),
        Player.initialize('white', 'counterclockwise'),
      ]
      expect(() => Game.initialize(players, undefined, 'completed')).toThrow(
        'Game cannot be initialized in the completed state'
      )
    })

    it('should throw error when initializing in rolled-for-start state without required properties', () => {
      const players: BackgammonPlayers = [
        Player.initialize('black', 'clockwise'),
        Player.initialize('white', 'counterclockwise'),
      ]
      expect(() =>
        Game.initialize(players, undefined, 'rolled-for-start')
      ).toThrow('Active color must be provided')
    })

    it('should throw error when initializing in rolling state without required properties', () => {
      const players: BackgammonPlayers = [
        Player.initialize('black', 'clockwise'),
        Player.initialize('white', 'counterclockwise'),
      ]
      expect(() => Game.initialize(players, undefined, 'rolling')).toThrow(
        'Active color must be provided'
      )
    })

    it('should throw error when initializing in moving state without required properties', () => {
      const players: BackgammonPlayers = [
        Player.initialize('black', 'clockwise'),
        Player.initialize('white', 'counterclockwise'),
      ]
      expect(() => Game.initialize(players, undefined, 'moving')).toThrow(
        'Active color must be provided'
      )
    })

    it('should throw error when initializing in moving state without active play', () => {
      const players: BackgammonPlayers = [
        Player.initialize('black', 'clockwise'),
        Player.initialize('white', 'counterclockwise'),
      ]
      const activePlayer = {
        ...players[0],
        stateKind: 'rolling',
      } as BackgammonPlayerActive
      const inactivePlayer = {
        ...players[1],
        stateKind: 'inactive',
      } as BackgammonPlayerInactive

      expect(() =>
        Game.initialize(
          players,
          undefined,
          'moving',
          undefined,
          undefined,
          undefined,
          'black',
          activePlayer,
          inactivePlayer
        )
      ).toThrow('Active play must be provided')
    })
  })

  describe('Game Flow', () => {
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
    const players: BackgammonPlayers = [
      Player.initialize(clockwiseColor, 'clockwise'),
      Player.initialize(counterclockwiseColor, 'counterclockwise'),
    ]

    it('should transition from rolling-for-start to rolling', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)

      expect(gameRolling.stateKind).toBe('rolling')
      expect(gameRolling.activeColor).toBeDefined()
      expect(gameRolling.activePlayer).toBeDefined()
      expect(gameRolling.inactivePlayer).toBeDefined()
      expect(gameRolling.activePlayer.color).toBe(gameRolling.activeColor)
      expect(gameRolling.inactivePlayer.color).not.toBe(gameRolling.activeColor)
    })

    it('should transition from rolling to moving', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rolledForStartGame = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: [
          {
            ...gameRolling.activePlayer,
            stateKind: 'rolling',
          },
          {
            ...gameRolling.inactivePlayer,
            stateKind: 'inactive',
          },
        ],
      } as BackgammonGameRolledForStart
      const gameMoving = Game.roll(rolledForStartGame)

      expect(gameMoving.stateKind).toBe('moving')
      expect(gameMoving.activePlayer).toBeDefined()
      expect(gameMoving.activePlay).toBeDefined()
      expect(gameMoving.board).toBeDefined()
      expect(gameMoving.activePlayer.dice.currentRoll).toBeDefined()
      expect(gameMoving.activePlay.moves.size).toBeGreaterThan(0)
    })

    it('should handle moves correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rolledForStartGame = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: [
          {
            ...gameRolling.activePlayer,
            stateKind: 'rolling',
          },
          {
            ...gameRolling.inactivePlayer,
            stateKind: 'inactive',
          },
        ],
      } as BackgammonGameRolledForStart
      const gameMoving = Game.roll(rolledForStartGame) as BackgammonGameMoving

      // Get the first available move
      expect(gameMoving.activePlay.moves.size).toBeGreaterThan(0)
      const firstMove = Array.from(gameMoving.activePlay.moves)[0]
      expect(firstMove).toBeDefined()

      // Get the move's origin and make the move
      expect(firstMove.origin).toBeDefined()
      if (firstMove.origin) {
        const gameMoved = Game.move(gameMoving, firstMove.origin)
        expect(gameMoved).toBeDefined()
      }
    })

    it('should throw error when rolling with invalid active color', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rolledForStartGame = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        activeColor: 'invalid' as BackgammonColor,
        players: [
          {
            ...gameRolling.activePlayer,
            stateKind: 'rolling',
          } as BackgammonPlayerRolling,
          {
            ...gameRolling.inactivePlayer,
            stateKind: 'inactive',
          } as BackgammonPlayerInactive,
        ] as BackgammonPlayers,
      } as BackgammonGameRolledForStart

      expect(() => Game.roll(rolledForStartGame)).toThrow('Players not found')
    })
  })

  describe('Player Management', () => {
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
    const players: BackgammonPlayers = [
      Player.initialize(clockwiseColor, 'clockwise'),
      Player.initialize(counterclockwiseColor, 'counterclockwise'),
    ]

    it('should get players for color correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)

      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )

      expect(activePlayer).toBeDefined()
      expect(inactivePlayer).toBeDefined()
      expect(activePlayer.color).toBe(gameRolling.activeColor)
      expect(inactivePlayer.color).not.toBe(gameRolling.activeColor)
    })

    it('should get active player correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rolledForStartGame = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: [
          {
            ...gameRolling.activePlayer,
            stateKind: 'rolling',
          },
          {
            ...gameRolling.inactivePlayer,
            stateKind: 'inactive',
          },
        ],
      } as BackgammonGameRolledForStart

      const activePlayer = Game.activePlayer(rolledForStartGame)
      expect(activePlayer).toBeDefined()
      expect(activePlayer.color).toBe(rolledForStartGame.activeColor)
      expect(activePlayer.stateKind).not.toBe('inactive')
    })

    it('should get inactive player correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rolledForStartGame = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: [
          {
            ...gameRolling.activePlayer,
            stateKind: 'rolling',
          },
          {
            ...gameRolling.inactivePlayer,
            stateKind: 'inactive',
          },
        ],
      } as BackgammonGameRolledForStart

      const inactivePlayer = Game.inactivePlayer(rolledForStartGame)
      expect(inactivePlayer).toBeDefined()
      expect(inactivePlayer.color).not.toBe(rolledForStartGame.activeColor)
      expect(inactivePlayer.stateKind).toBe('inactive')
    })

    it('should throw error when active player not found', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const invalidGame = {
        ...gameStart,
        activeColor: 'red' as BackgammonColor, // Invalid color
      }
      expect(() => Game.activePlayer(invalidGame)).toThrow(
        'Active player not found'
      )
    })

    it('should throw error when inactive player not found', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const invalidGame = {
        ...gameStart,
        activeColor: players[0].color,
        players: [
          { ...players[0], stateKind: 'rolling' },
          { ...players[0], stateKind: 'rolling' },
        ] as BackgammonPlayers, // Two active players, no inactive
      }
      expect(() => Game.inactivePlayer(invalidGame)).toThrow(
        'Inactive player not found'
      )
    })

    it('should throw error when players not found for color', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const emptyPlayers = [
        { ...players[0], stateKind: 'rolling' },
        { ...players[0], stateKind: 'rolling' },
      ] as BackgammonPlayers
      expect(() =>
        Game.getPlayersForColor(emptyPlayers, 'red' as BackgammonColor)
      ).toThrow('Players not found')
    })
  })
})
