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
} from '@nodots-llc/backgammon-types/dist'
import { Game } from '..'
import { randomBackgammonColor } from '../../'
import { Play } from '../../Play'
import { Player } from '../../Player'
// Robot import removed - functionality moved to @nodots-llc/backgammon-robots package

// Test helper functions using proper CORE flow
const createTestGame = {
  // Creates game in rolling-for-start state
  rollingForStart: () => Game.createNewGame(
    { userId: 'test-user-1', isRobot: true },
    { userId: 'test-user-2', isRobot: true }
  ),
  
  // Creates game through rolled-for-start state
  rolledForStart: () => {
    const game = createTestGame.rollingForStart() as BackgammonGameRollingForStart
    return Game.rollForStart(game)
  },
  
  // Creates game through rolled state (ready for moves)
  rolled: () => {
    const game = createTestGame.rolledForStart()
    return Game.roll(game)
  },
  
  // Creates game in moving state (simplified - no intermediate states)
  moving: () => {
    const game = createTestGame.rolled()
    return Game.toMoving(game)
  }
}

describe('Game', () => {
  // Internal Game.initialize() tests removed - that API is now internal-only.
  // Game creation is tested via Game.createNewGame() below.

  describe('Game Flow', () => {
    it('should transition from rolling-for-start to rolled-for-start', () => {
      const gameRolling = createTestGame.rolledForStart()
      expect(gameRolling.stateKind).toBe('rolled-for-start')
      expect(gameRolling.activeColor).toBeDefined()
      expect(gameRolling.activePlayer).toBeDefined()
      expect(gameRolling.inactivePlayer).toBeDefined()
      expect(gameRolling.activePlayer.color).toBe(gameRolling.activeColor)
      expect(gameRolling.inactivePlayer.color).not.toBe(gameRolling.activeColor)
    })

    it('should transition from rolling to rolled', () => {
      const gameRolled = createTestGame.rolled()
      expect((gameRolled as any).stateKind).toBe('rolled')
      expect((gameRolled as any).activePlayer).toBeDefined()
      expect((gameRolled as any).activePlay).toBeDefined()
      expect((gameRolled as any).board).toBeDefined()
      expect((gameRolled as any).activePlayer.dice.currentRoll).toBeDefined()
      expect(
        ((gameRolled as any).activePlay.moves as Set<any>).size
      ).toBeGreaterThan(0)
    })

    it('should handle moves correctly', () => {
      const gameMoving = createTestGame.moving()
      // Get the first available move
      expect(
        ((gameMoving as any).activePlay.moves as Set<any>).size
      ).toBeGreaterThan(0)
      const firstMove = Array.from(
        (gameMoving as any).activePlay.moves as Set<any>
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
            (gameMoved as any).activePlay.moves as Set<any>
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
              ((gameMoved as any).activePlay.moves as Set<any>).size
            ).toBeGreaterThan(0)
          }
        }
      }
    })

    it('should throw error when rolling with invalid active color', () => {
      const gameRolling = createTestGame.rolledForStart()
      
      // Create invalid state by corrupting activeColor
      const invalidGame = {
        ...gameRolling,
        activeColor: 'invalid' as BackgammonColor,
      } as BackgammonGameRolledForStart

      expect(() => Game.roll(invalidGame)).toThrow('Roll requires an active player')
    })
  })

  describe('Player Management', () => {
    it('should get players for color correctly', () => {
      const gameRolling = createTestGame.rolledForStart()

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
      const gameRolling = createTestGame.rolledForStart()

      const activePlayerResult = Game.activePlayer(gameRolling)
      expect(activePlayerResult).toBeDefined()
      expect(activePlayerResult.color).toBe(gameRolling.activeColor)
      expect(activePlayerResult.stateKind).not.toBe('inactive')
    })

    it('should get inactive player correctly', () => {
      // Use rolled state where inactive player exists properly
      const gameRolled = createTestGame.rolled()

      const inactivePlayerResult = Game.inactivePlayer(gameRolled)
      expect(inactivePlayerResult).toBeDefined()
      expect(inactivePlayerResult.color).not.toBe(
        gameRolled.activeColor
      )
      expect(inactivePlayerResult.stateKind).toBe('inactive')
    })

    it('should throw error when active player not found', () => {
      const gameStart = createTestGame.rollingForStart()
      const invalidGame = {
        ...gameStart,
        activeColor: 'red' as BackgammonColor, // Invalid color
      }
      expect(() => Game.activePlayer(invalidGame)).toThrow(
        'Active player not found'
      )
    })

    it('should throw error when inactive player not found', () => {
      const gameRolling = createTestGame.rolledForStart()
      const invalidGame = {
        ...gameRolling,
        players: [
          { ...gameRolling.players[0], stateKind: 'rolling-for-start' },
          { ...gameRolling.players[0], stateKind: 'rolling-for-start' },
        ] as BackgammonPlayers, // Two active players, no inactive
      }
      expect(() => Game.inactivePlayer(invalidGame)).toThrow(
        'Inactive player not found'
      )
    })

    it('should throw error when players not found for color', () => {
      const gameStart = createTestGame.rollingForStart()
      expect(() =>
        Game.getPlayersForColor(gameStart.players, 'red' as BackgammonColor)
      ).toThrow('Players not found')
    })
  })

  // NOTE: Doubling Cube tests commented out - old offerDouble/toDoubling methods removed
  // Doubling now works from 'rolling' state using Game.double()
  /*
  describe('Doubling Cube', () => {
    it('should allow a player to offer a double if allowed', () => {
      const doubledGame = createTestGame.moving()
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        doubledGame.players,
        doubledGame.activeColor
      )

      expect(
        Game.canOfferDouble(
          doubledGame,
          activePlayer as BackgammonPlayerActive
        )
      ).toBe(true)
      const doubledGame = Game.offerDouble(
        doubledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(doubledGame.stateKind).toBe('doubling')
      expect(doubledGame.cube.stateKind).toBe('offered')
      expect(doubledGame.cube.offeredBy).toBeDefined()
      expect(doubledGame.cube.owner).toBeDefined()
    })

    it('should not allow a player to offer a double if they own the cube', () => {
      const rolledGame = createTestGame.rolled()
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        rolledGame.players,
        rolledGame.activeColor
      )

      // Create doubled game with cube owned by active player  
      const doubledGame = {
        ...rolledGame,
        stateKind: 'doubled' as const,
        cube: {
          ...rolledGame.cube,
          stateKind: 'doubled' as const,
          owner: activePlayer,
          value: 2,
        },
      } as any

      expect(
        Game.canOfferDouble(
          doubledGame,
          activePlayer as BackgammonPlayerActive
        )
      ).toBe(false)
      expect(() =>
        Game.offerDouble(doubledGame, activePlayer as BackgammonPlayerActive)
      ).toThrow()
    })

    it('should allow the opponent to accept a double and transfer ownership', () => {
      const doubledGame = createTestGame.moving()
      const [activePlayer, origInactivePlayer] = Game.getPlayersForColor(
        doubledGame.players,
        doubledGame.activeColor
      )
      // Make the opponent an active player for doubling
      const inactivePlayer = Player.initialize(
        origInactivePlayer.color,
        origInactivePlayer.direction,
        'rolling',
        true,
        origInactivePlayer.id
      ) as BackgammonPlayerActive

      const doubledGame = Game.offerDouble(
        doubledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(Game.canAcceptDouble(doubledGame, inactivePlayer)).toBe(true)
      const acceptedGame = Game.acceptDouble(doubledGame, inactivePlayer)
      expect(acceptedGame.stateKind).toBe('doubled')
      expect(acceptedGame.cube.owner!.id).toBe(inactivePlayer.id)
      expect(acceptedGame.cube.value).toBe(4) // 2 doubled to 4
    })

    it('should end the game and declare the offering player as winner if double is refused', () => {
      const gameRolling = createTestGame.rolledForStart()
      // Simulate the full flow: roll -> double (no intermediate states)
      const rolledGame = Game.roll(gameRolling)
      const [activePlayer, origInactivePlayer] = Game.getPlayersForColor(
        rolledGame.players,
        rolledGame.activeColor
      )
      // Make the opponent an active player for doubling
      const inactivePlayer = Player.initialize(
        origInactivePlayer.color,
        origInactivePlayer.direction,
        'rolling',
        true,
        origInactivePlayer.id
      ) as BackgammonPlayerActive

      const doubledGame = Game.offerDouble(
        doubledGame,
        activePlayer as BackgammonPlayerActive
      )
      expect(Game.canRefuseDouble(doubledGame, inactivePlayer)).toBe(true)
      const completedGame = Game.refuseDouble(doubledGame, inactivePlayer)
      expect(completedGame.stateKind).toBe('completed')
      expect(completedGame.winner).toBe(activePlayer.id)
      const winningPlayer = completedGame.players.find(p => p.id === completedGame.winner)
      expect(winningPlayer?.stateKind).toBe('winner')
    })

    it('should not allow a player to accept their own double', () => {
      const doubledGame = createTestGame.moving()
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        doubledGame.players,
        doubledGame.activeColor
      )

      const doubledGame = Game.offerDouble(
        doubledGame,
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
      const doubledGame = createTestGame.moving()
      const [activePlayer, inactivePlayer] = Game.getPlayersForColor(
        doubledGame.players,
        doubledGame.activeColor
      )

      const doubledGame = Game.offerDouble(
        doubledGame,
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

  })
  */

  describe('Game Creation', () => {
    it('should create a new game with default settings', async () => {
      const game = Game.createNewGame(
        { userId: 'user1', isRobot: false },
        { userId: 'user2', isRobot: false }
      ) // Human vs Human
      expect(game).toBeDefined()
      expect(game.stateKind).toBe('rolling-for-start')

      // Game should be in rolling-for-start state for automatic roll
      expect(game.stateKind).toBe('rolling-for-start')

      expect(game.players).toHaveLength(2)
      expect(game.activeColor).toBeUndefined()
      expect(game.activePlayer).toBeUndefined()
      expect(game.inactivePlayer).toBeUndefined()
      expect(game.board).toBeDefined()
      expect(game.cube).toBeDefined()
    })


    it('should create a new game without auto-rolling for start', () => {
      const game = Game.createNewGame(
        { userId: 'user1', isRobot: false },
        { userId: 'user2', isRobot: false }
      )
      expect(game).toBeDefined()
      expect(game.stateKind).toBe('rolling-for-start')
      expect(game.players).toHaveLength(2)
      expect(game.activeColor).toBeUndefined()
      expect(game.activePlayer).toBeUndefined()
      expect(game.inactivePlayer).toBeUndefined()
    })

    it('should create a game with human players', () => {
      const game = Game.createNewGame(
        { userId: 'user1', isRobot: false },
        { userId: 'user2', isRobot: false }
      )
      expect(game).toBeDefined()
      expect(game.players.every((p) => !p.isRobot)).toBe(true)
    })
  })

  describe('Robot Methods', () => {
    it('should transition robot from rolled to moving state via proper flow', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      // Manually roll for start and then roll to get to rolled state
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)

      // Simplified flow: rolled -> toMoving (no intermediate states)
      const movingGame = Game.toMoving(rolledGame)
      expect(movingGame.stateKind).toBe('moving')
      expect(movingGame.activePlay.stateKind).toBe('moving')
    })

    // Robot turn processing tests removed - functionality moved to @nodots-llc/backgammon-robots package
  })

  describe('State Transitions', () => {
    it('should transition from rolled to moving', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Direct transition: rolled -> moving (no intermediate states)
      const movingGame = Game.toMoving(rolledGame)
      expect(movingGame.stateKind).toBe('moving')
      expect(movingGame.activePlay.stateKind).toBe('moving')
    })

    // NOTE: toDoubling test removed because toDoubling method no longer exists
    // Doubling now works directly from 'rolling' state using Game.double()

    it('should throw error when transitioning to moving from invalid state', () => {
      const rollingGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      expect(() => Game.toMoving(rollingGame as any)).toThrow(
        'Cannot start moving from rolling-for-start state'
      )
    })

    // NOTE: toDoubling error test removed because toDoubling method no longer exists
  })

  describe('Move Execution', () => {
    it('should execute move and recalculate correctly', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      // Get first available move
      const moves = Array.from(movingGame.activePlay.moves)
      if (moves.length > 0 && moves[0].origin) {
        const result = Game.executeAndRecalculate(
          movingGame,
          moves[0].origin.id
        )
        expect(result).toBeDefined()
        expect(result.stateKind).toBe('moving')
      }
    })

    it('should complete turn when all moves are finished', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      // Create game with completed moves
      const completedMoves = new Set(
        Array.from(movingGame.activePlay.moves).map((move) => ({
          ...move,
          stateKind: 'completed' as const,
        }))
      )
      const gameWithCompletedMoves = {
        ...movingGame,
        activePlay: {
          ...movingGame.activePlay,
          moves: completedMoves as any,
        },
      } as any

      const result = Game.checkAndCompleteTurn(gameWithCompletedMoves)
      expect(result.activeColor).not.toBe(movingGame.activeColor)
      expect(result.stateKind).toBe('rolling')
    })
  })

  describe('Permission Checks', () => {
    it('should check if game can roll', () => {
      const rollingGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      expect(Game.canRoll(rollingGame)).toBe(false)

      const rolledForStartGame = Game.rollForStart(rollingGame as any)
      expect(Game.canRoll(rolledForStartGame)).toBe(true)
    })

    it('should check if game can roll for start', () => {
      const rollingGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      expect(Game.canRollForStart(rollingGame)).toBe(true)

      const rolledForStartGame = Game.rollForStart(rollingGame as any)
      expect(Game.canRollForStart(rolledForStartGame)).toBe(false)
    })

    it('should check if specific player can roll', () => {
      // Create game without auto-advancement to test rolling permissions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      expect(
        Game.canPlayerRoll(
          gameAfterRollForStart,
          gameAfterRollForStart.activePlayer?.id || ''
        )
      ).toBe(true)

      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // In rolled state, player cannot roll again
      expect(
        Game.canPlayerRoll(rolledGame, rolledGame.activePlayer?.id || '')
      ).toBe(false)
    })

    it('should check if game can get possible moves', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      expect(Game.canGetPossibleMoves(movingGame)).toBe(false)
      expect(Game.canGetPossibleMoves(rolledForStartGame)).toBe(false)
    })
  })

  describe('Utility Methods', () => {
    it('should find checker by id', () => {
      const rolledGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const checker = rolledGame.board.points[0].checkers[0]
      if (checker) {
        const foundChecker = Game.findChecker(rolledGame, checker.id)
        expect(foundChecker).toEqual(checker)
      }
    })

    it('should return null for non-existent checker', () => {
      const rolledGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const foundChecker = Game.findChecker(rolledGame, 'non-existent-id')
      expect(foundChecker).toBeNull()
    })

    it('should get possible moves successfully', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      const result = Game.getPossibleMoves(movingGame)
      expect(result.success).toBe(true)
      expect(result.possibleMoves).toBeDefined()
      expect(Array.isArray(result.possibleMoves)).toBe(true)
    })

    it('should fail to get possible moves for invalid state', () => {
      const rollingGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const result = Game.getPossibleMoves(rollingGame)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle move with no origin gracefully', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      expect(() => Game.move(movingGame, 'invalid-origin-id')).toThrow(
        'No checkercontainer found for invalid-origin-id'
      )
    })

    it('should handle empty moves set in turn completion', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        {
          userId: 'player-1',
          isRobot: false,
        },
        {
          userId: 'player-2',
          isRobot: false
        }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      const gameWithEmptyMoves = {
        ...movingGame,
        activePlay: {
          ...movingGame.activePlay,
          moves: new Set() as any,
        },
      } as any

      const result = Game.checkAndCompleteTurn(gameWithEmptyMoves)
      expect(result).toBeDefined()
    })

    it('should handle missing active play in turn completion', () => {
      // Create game without auto-advancement to test manual transitions
      const rolledForStartGame = Game.createNewGame(
        { userId: 'user1', isRobot: true },
        { userId: 'user2', isRobot: true }
      )
      const gameAfterRollForStart = Game.rollForStart(rolledForStartGame as any)
      const rolledGame = Game.roll(gameAfterRollForStart as any)
      // Removed prepareMove - using rolledGame directly
      const movingGame = Game.toMoving(rolledGame)

      const gameWithoutActivePlay = {
        ...movingGame,
        activePlay: undefined,
      } as any

      const result = Game.checkAndCompleteTurn(gameWithoutActivePlay)
      expect(result).toBe(gameWithoutActivePlay)
    })
  })
})
