import { describe, expect, it } from '@jest/globals'
import {
  BackgammonColor,
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
import { Play } from '../../Play'

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

    it('should transition from rolling-for-start to rolled-for-start', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      expect(gameRolling.stateKind).toBe('rolled-for-start')
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
      const rollingPlayers = gameRolling.players.map((p) =>
        p.color === gameRolling.activeColor
          ? ({ ...p, stateKind: 'rolling' } as BackgammonPlayerRolling)
          : ({ ...p, stateKind: 'inactive' } as BackgammonPlayerInactive)
      ) as BackgammonPlayers
      const foundPlayer = rollingPlayers.find(
        (p) => p.color === gameRolling.activeColor
      )!
      const activePlayer = Player.initialize(
        foundPlayer.color,
        foundPlayer.direction,
        undefined,
        foundPlayer.id,
        'rolled-for-start'
      ) as BackgammonPlayerRolledForStart
      const inactivePlayerObj = rollingPlayers.find(
        (p) => p.color !== gameRolling.activeColor
      )!
      const inactivePlayer = Player.initialize(
        inactivePlayerObj.color,
        inactivePlayerObj.direction,
        undefined,
        inactivePlayerObj.id,
        'inactive'
      ) as BackgammonPlayerInactive
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer,
        inactivePlayer,
        activeColor: gameRolling.activeColor!,
      }
      const gameRolled = Game.roll(rolledForStartGame)
      expect((gameRolled as any).stateKind).toBe('rolled')
      expect((gameRolled as any).activePlayer).toBeDefined()
      expect((gameRolled as any).activePlay).toBeDefined()
      expect((gameRolled as any).board).toBeDefined()
      expect((gameRolled as any).activePlayer.dice.currentRoll).toBeDefined()
      expect(
        ((gameRolled as any).activePlay.moves as unknown as any[]).length
      ).toBeGreaterThan(0)
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
      const foundPlayer = rollingPlayers.find(
        (p) => p.color === gameRolling.activeColor
      )!
      const activePlayer = Player.initialize(
        foundPlayer.color,
        foundPlayer.direction,
        undefined,
        foundPlayer.id,
        'rolled-for-start'
      ) as BackgammonPlayerRolledForStart
      const inactivePlayerObj = rollingPlayers.find(
        (p) => p.color !== gameRolling.activeColor
      )!
      const inactivePlayer = Player.initialize(
        inactivePlayerObj.color,
        inactivePlayerObj.direction,
        undefined,
        inactivePlayerObj.id,
        'inactive'
      ) as BackgammonPlayerInactive
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer,
        inactivePlayer,
        activeColor: gameRolling.activeColor!,
      }
      const gameRolled = Game.roll(rolledForStartGame)
      // Transition play to 'moving' state
      const movingPlay = Play.startMove((gameRolled as any).activePlay)
      const gameMoving = Game.startMove(gameRolled, movingPlay)
      // Get the first available move
      expect(
        ((gameMoving as any).activePlay.moves as unknown as any[]).length
      ).toBeGreaterThan(0)
      const firstMove = Array.from(
        (gameMoving as any).activePlay.moves as any[]
      )[0] as any
      expect(firstMove).toBeDefined()
      // Get the move's origin and make the move
      expect(firstMove.origin).toBeDefined()
      if (firstMove.origin) {
        // Only call Game.move if gameMoving is a valid BackgammonGameMoving
        if ((gameMoving as any).stateKind === 'moving') {
          const gameMoved = Game.move(gameMoving, firstMove.origin.id)
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
            expect(
              ((gameMoved as any).activePlay.moves as unknown as any[]).length
            ).toBeGreaterThan(0)
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
          Player.initialize(
            gameRolling.activePlayer.color,
            gameRolling.activePlayer.direction,
            undefined,
            gameRolling.activePlayer.id,
            'rolled-for-start'
          ) as BackgammonPlayerRolledForStart,
          Player.initialize(
            gameRolling.inactivePlayer.color,
            gameRolling.inactivePlayer.direction,
            undefined,
            gameRolling.inactivePlayer.id,
            'inactive'
          ) as BackgammonPlayerInactive,
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
      const rollingPlayers = gameRolling.players.map((p) =>
        p.color === gameRolling.activeColor
          ? ({ ...p, stateKind: 'rolling' } as BackgammonPlayerRolling)
          : ({ ...p, stateKind: 'inactive' } as BackgammonPlayerInactive)
      ) as BackgammonPlayers
      const foundPlayer = rollingPlayers.find(
        (p) => p.color === gameRolling.activeColor
      )!
      const activePlayer = Player.initialize(
        foundPlayer.color,
        foundPlayer.direction,
        undefined,
        foundPlayer.id,
        'rolled-for-start'
      ) as BackgammonPlayerRolledForStart
      const inactivePlayerObj = rollingPlayers.find(
        (p) => p.color !== gameRolling.activeColor
      )!
      const inactivePlayer = Player.initialize(
        inactivePlayerObj.color,
        inactivePlayerObj.direction,
        undefined,
        inactivePlayerObj.id,
        'inactive'
      ) as BackgammonPlayerInactive
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer,
        inactivePlayer,
        activeColor: gameRolling.activeColor!,
      }

      const activePlayerResult = Game.activePlayer(rolledForStartGame)
      expect(activePlayerResult).toBeDefined()
      expect(activePlayerResult.color).toBe(rolledForStartGame.activeColor)
      expect(activePlayerResult.stateKind).not.toBe('inactive')
    })

    it('should get inactive player correctly', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const rollingPlayers = gameRolling.players.map((p) =>
        p.color === gameRolling.activeColor
          ? ({ ...p, stateKind: 'rolling' } as BackgammonPlayerRolling)
          : ({ ...p, stateKind: 'inactive' } as BackgammonPlayerInactive)
      ) as BackgammonPlayers
      const foundPlayer = rollingPlayers.find(
        (p) => p.color === gameRolling.activeColor
      )!
      const activePlayer = Player.initialize(
        foundPlayer.color,
        foundPlayer.direction,
        undefined,
        foundPlayer.id,
        'rolled-for-start'
      ) as BackgammonPlayerRolledForStart
      const inactivePlayerObj = rollingPlayers.find(
        (p) => p.color !== gameRolling.activeColor
      )!
      const inactivePlayer = Player.initialize(
        inactivePlayerObj.color,
        inactivePlayerObj.direction,
        undefined,
        inactivePlayerObj.id,
        'inactive'
      ) as BackgammonPlayerInactive
      const rolledForStartGame: BackgammonGameRolledForStart = {
        ...gameRolling,
        stateKind: 'rolled-for-start',
        players: rollingPlayers,
        activePlayer,
        inactivePlayer,
        activeColor: gameRolling.activeColor!,
      }

      const inactivePlayerResult = Game.inactivePlayer(rolledForStartGame)
      expect(inactivePlayerResult).toBeDefined()
      expect(inactivePlayerResult.color).not.toBe(
        rolledForStartGame.activeColor
      )
      expect(inactivePlayerResult.stateKind).toBe('inactive')
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

  describe('Doubling Cube', () => {
    const clockwiseColor = randomBackgammonColor()
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
    const players: BackgammonPlayers = [
      Player.initialize(clockwiseColor, 'clockwise'),
      Player.initialize(counterclockwiseColor, 'counterclockwise'),
    ]

    it('should allow a player to offer a double if allowed', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Simulate rolling
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer: inactivePlayer as BackgammonPlayerInactive,
        activeColor: activePlayer.color,
      } as any
      expect(
        Game.canOfferDouble(rolledGame, activePlayer as BackgammonPlayerActive)
      ).toBe(true)
      const doubledGame = Game.offerDouble(
        rolledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(doubledGame.stateKind).toBe('doubling')
      expect(doubledGame.cube.stateKind).toBe('offered')
      expect(doubledGame.cube.offeredBy).toBeDefined()
      expect(doubledGame.cube.owner).toBeDefined()
    })

    it('should not allow a player to offer a double if they own the cube', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Simulate rolling and offering
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer: inactivePlayer as BackgammonPlayerInactive,
        activeColor: activePlayer.color,
        cube: {
          ...gameRolling.cube,
          stateKind: 'doubled' as const,
          owner: activePlayer,
          value: 2,
        },
      } as any
      expect(
        Game.canOfferDouble(rolledGame, activePlayer as BackgammonPlayerActive)
      ).toBe(false)
      expect(() =>
        Game.offerDouble(rolledGame, activePlayer as BackgammonPlayerActive)
      ).toThrow()
    })

    it('should allow the opponent to accept a double and transfer ownership', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, origInactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Make the opponent an active player for doubling
      const inactivePlayer = Player.initialize(
        origInactivePlayer.color,
        origInactivePlayer.direction,
        undefined,
        origInactivePlayer.id,
        'rolling'
      ) as BackgammonPlayerActive
      // Simulate rolling and offering
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer,
        activeColor: activePlayer.color,
      } as any
      const doubledGame = Game.offerDouble(
        rolledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(Game.canAcceptDouble(doubledGame, inactivePlayer)).toBe(true)
      const acceptedGame = Game.acceptDouble(doubledGame, inactivePlayer)
      expect(acceptedGame.stateKind).toBe('doubled')
      expect(acceptedGame.cube.owner!.id).toBe(inactivePlayer.id)
      expect(acceptedGame.cube.value).toBe(4) // 2 doubled to 4
    })

    it('should end the game and declare the offering player as winner if double is refused', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, origInactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Make the opponent an active player for doubling
      const inactivePlayer = Player.initialize(
        origInactivePlayer.color,
        origInactivePlayer.direction,
        undefined,
        origInactivePlayer.id,
        'rolling'
      ) as BackgammonPlayerActive
      // Simulate rolling and offering
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer,
        activeColor: activePlayer.color,
      } as any
      const doubledGame = Game.offerDouble(
        rolledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(Game.canRefuseDouble(doubledGame, inactivePlayer)).toBe(true)
      const completedGame = Game.refuseDouble(doubledGame, inactivePlayer)
      expect(completedGame.stateKind).toBe('completed')
      expect(completedGame.winner!.color).toBe(activePlayer.color)
      expect(completedGame.winner!.stateKind).toBe('winner')
    })

    it('should not allow a player to accept their own double', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Simulate rolling and offering
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer: inactivePlayer as BackgammonPlayerInactive,
        activeColor: activePlayer.color,
      } as any
      const doubledGame = Game.offerDouble(
        rolledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(
        Game.canAcceptDouble(
          doubledGame,
          activePlayer as BackgammonPlayerActive
        )
      ).toBe(false)
      expect(() =>
        Game.acceptDouble(doubledGame, activePlayer as BackgammonPlayerActive)
      ).toThrow()
    })

    it('should not allow a player to refuse their own double', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Simulate rolling and offering
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer: inactivePlayer as BackgammonPlayerInactive,
        activeColor: activePlayer.color,
      } as any
      const doubledGame = Game.offerDouble(
        rolledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(
        Game.canRefuseDouble(
          doubledGame,
          activePlayer as BackgammonPlayerActive
        )
      ).toBe(false)
      expect(() =>
        Game.refuseDouble(doubledGame, activePlayer as BackgammonPlayerActive)
      ).toThrow()
    })

    it('should end the game if the cube is maxxed (64) when accepted', () => {
      const gameStart = Game.initialize(
        players
      ) as BackgammonGameRollingForStart
      const gameRolling = Game.rollForStart(gameStart)
      const [activePlayer, origInactivePlayer] = Game.getPlayersForColor(
        gameRolling.players,
        gameRolling.activeColor
      )
      // Make the opponent an active player for doubling
      const inactivePlayer = Player.initialize(
        origInactivePlayer.color,
        origInactivePlayer.direction,
        undefined,
        origInactivePlayer.id,
        'rolling'
      ) as BackgammonPlayerActive
      // Simulate rolling and offering at 32
      const rolledGame = {
        ...gameRolling,
        stateKind: 'rolling' as const,
        activePlayer: activePlayer as BackgammonPlayerActive,
        inactivePlayer,
        activeColor: activePlayer.color,
        cube: {
          ...gameRolling.cube,
          stateKind: 'offered' as const,
          owner: activePlayer,
          value: 32,
          offeredBy: activePlayer,
        },
      } as any
      // Accept double to reach 64
      const acceptedGame = Game.acceptDouble(rolledGame, inactivePlayer)
      expect(acceptedGame.stateKind).toBe('completed')
      expect(acceptedGame.winner!.color).toBe(inactivePlayer.color)
      expect(acceptedGame.winner!.stateKind).toBe('winner')
      expect(acceptedGame.cube.value).toBe(64)
      expect(acceptedGame.cube.stateKind).toBe('maxxed')
    })
  })

  describe('Win Condition', () => {
    it('should end the game and set the winner when a player bears off all 15 checkers', () => {
      // Setup a board where white has 14 checkers already borne off and 1 on point 24
      const { Board } = require('../../Board')
      const { Player } = require('../../Player')
      const board = Board.initialize()
      // Clear all checkers
      board.BackgammonPoints.forEach((point: any) => {
        point.checkers = []
      })
      board.bar.clockwise.checkers = []
      board.bar.counterclockwise.checkers = []
      board.off.clockwise.checkers = []
      board.off.counterclockwise.checkers = []
      // Place 14 white checkers in off position
      for (let i = 0; i < 14; i++) {
        board.off.clockwise.checkers.push({
          id: `w${i}`,
          color: 'white',
          checkercontainerId: board.off.clockwise.id,
        })
      }
      // Place 1 white checker on point 24
      const point24 = board.BackgammonPoints.find(
        (p: any) => p.position.clockwise === 24
      )
      point24.checkers = [
        {
          id: 'w15',
          color: 'white',
          checkercontainerId: point24.id,
        },
      ]
      // Setup players
      const dice = {
        id: 'dice1',
        color: 'white',
        stateKind: 'rolled',
        currentRoll: [6, 1],
        total: 2,
      }
      const whitePlayer = Player.initialize(
        'white',
        'clockwise',
        dice,
        undefined,
        'rolled'
      )
      const blackPlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        undefined,
        'inactive'
      )
      // Setup play
      const play = {
        stateKind: 'rolled',
        player: whitePlayer,
        moves: new Set([
          {
            id: 'move1',
            player: whitePlayer,
            stateKind: 'ready',
            moveKind: 'bear-off',
            origin: point24,
            dieValue: 6,
          },
        ]),
        board,
      }
      // Setup game
      const game = {
        stateKind: 'rolled',
        players: [whitePlayer, blackPlayer],
        activePlayer: whitePlayer,
        inactivePlayer: blackPlayer,
        activeColor: 'white',
        activePlay: play,
        board,
      }
      // Perform the move
      const Game = require('..').Game
      const firstResult = Game.move(game, point24.id) // transitions to 'moving'
      const result = Game.move(firstResult, point24.id) // actually processes the move
      expect(result.stateKind).toBe('completed')
      expect(result.winner).toBeDefined()
      expect(result.winner.color).toBe('white')
      expect(result.winner.stateKind).toBe('winner')
      expect(
        result.board.off.clockwise.checkers.filter(
          (c: any) => c.color === 'white'
        ).length
      ).toBe(15)
    })
  })
})
