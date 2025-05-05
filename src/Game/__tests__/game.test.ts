import { describe, expect, it } from '@jest/globals'
import {
  BackgammonColor,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
} from 'nodots-backgammon-types'
import { Game } from '..'
import { randomBackgammonColor } from '../../'
import { Player } from '../../Player'

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

    it('should transition from rolling to rolled', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      // Use the public API for state transitions
      // Simulate the player rolling dice: set the activePlayer to 'rolling' state
      // This is typically handled by the game logic, but for the test, we need to ensure the type matches
      // We'll assume the first player is the roller
      const rollingPlayers = gameRolling.players.map((p) =>
        p.color === gameRolling.activeColor
          ? ({ ...p, stateKind: 'rolling' } as BackgammonPlayerRolling)
          : ({ ...p, stateKind: 'inactive' } as BackgammonPlayerInactive)
      ) as BackgammonPlayers
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer: rollingPlayers.find(
          (p) => p.color === gameRolling.activeColor
        ) as BackgammonPlayerRolledForStart,
        inactivePlayer: rollingPlayers.find(
          (p) => p.color !== gameRolling.activeColor
        ) as BackgammonPlayerInactive,
        activeColor: gameRolling.activeColor!,
      }
      const gameRolled = Game.roll(rolledForStartGame)
      expect((gameRolled as any).stateKind).toBe('rolled')
      expect((gameRolled as any).activePlayer).toBeDefined()
      expect((gameRolled as any).activePlay).toBeDefined()
      expect((gameRolled as any).board).toBeDefined()
      expect((gameRolled as any).activePlayer.dice.currentRoll).toBeDefined()
      expect((gameRolled as any).activePlay.moves.size).toBeGreaterThan(0)
    })

    it('should handle moves correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rollingPlayers = gameRolling.players.map((p) =>
        p.color === gameRolling.activeColor
          ? ({ ...p, stateKind: 'rolling' } as BackgammonPlayerRolling)
          : ({ ...p, stateKind: 'inactive' } as BackgammonPlayerInactive)
      ) as BackgammonPlayers
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer: rollingPlayers.find(
          (p) => p.color === gameRolling.activeColor
        ) as BackgammonPlayerRolledForStart,
        inactivePlayer: rollingPlayers.find(
          (p) => p.color !== gameRolling.activeColor
        ) as BackgammonPlayerInactive,
        activeColor: gameRolling.activeColor!,
      }
      const gameRolled = Game.roll(rolledForStartGame)
      const gameMoving = Game.move(
        gameRolled,
        Array.from((gameRolled as any).activePlay.moves as any[])[0].origin!
      )
      // Get the first available move
      expect((gameMoving as any).activePlay.moves.size).toBeGreaterThan(0)
      const firstMove = Array.from(
        (gameMoving as any).activePlay.moves as any[]
      )[0] as any
      expect(firstMove).toBeDefined()
      // Get the move's origin and make the move
      expect(firstMove.origin).toBeDefined()
      if (firstMove.origin) {
        // Only call Game.move if gameMoving is a valid BackgammonGameMoving
        if ((gameMoving as any).stateKind === 'moving') {
          const gameMoved = Game.move(gameMoving, firstMove.origin)
          // Check for a move with moveKind: 'no-move' and stateKind: 'completed' in the moves set
          const noMove = Array.from(
            (gameMoved as any).activePlay.moves as any[]
          ).find(
            (m: any) => m.moveKind === 'no-move' && m.stateKind === 'completed'
          )
          if (noMove) {
            expect(noMove.moveKind).toBe('no-move')
            expect(noMove.stateKind).toBe('completed')
          } else {
            expect(gameMoved).toBeDefined()
            expect((gameMoved as any).stateKind).toBe('moving')
            expect((gameMoved as any).activePlay.moves.size).toBeGreaterThan(0)
          }
        }
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
            stateKind: 'rolled-for-start',
          } as BackgammonPlayerRolledForStart,
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
            stateKind: 'rolled-for-start',
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
