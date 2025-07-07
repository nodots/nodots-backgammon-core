import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameDoubled,
  BackgammonGameMoving,
  BackgammonGamePreparingMove,
  BackgammonGameRolled,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerDoubled,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
} from '@nodots-llc/backgammon-types/dist'
import { generateId, Player, randomBackgammonColor } from '..'
import { Board } from '../Board'
import { Checker } from '../Checker'
import { Cube } from '../Cube'
import { BackgammonMoveDirection, Play } from '../Play'
import { logger } from '../utils/logger'
export * from '../index'

// GameProps is now imported from @nodots-llc/backgammon-types

export class Game {
  id: string = generateId()
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube
  activeColor!: BackgammonColor
  activePlay!: BackgammonPlay
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

  /**
   * Creates a new game between two players
   * This is the main entry point for creating games - handles all player assignments and board setup
   *
   * @param player1UserId - User ID for player 1
   * @param player2UserId - User ID for player 2
   * @param autoRollForStart - Whether to auto roll for start
   * @param player1IsRobot - Whether player 1 is a robot
   * @param player2IsRobot - Whether player 2 is a robot
   * @param colorDirectionConfig - Optional: { blackDirection, whiteDirection, blackFirst } for explicit control (for tests)
   */
  public static createNewGame = function createNewGame(
    player1UserId: string,
    player2UserId: string,
    autoRollForStart: boolean = true,
    player1IsRobot: boolean = true,
    player2IsRobot: boolean = true,
    colorDirectionConfig?: {
      blackDirection: BackgammonMoveDirection
      whiteDirection: BackgammonMoveDirection
      blackFirst?: boolean
    }
  ): BackgammonGame {
    // Determine color and direction assignments
    let blackDirection: BackgammonMoveDirection
    let whiteDirection: BackgammonMoveDirection
    let blackFirst: boolean

    if (colorDirectionConfig) {
      blackDirection = colorDirectionConfig.blackDirection
      whiteDirection = colorDirectionConfig.whiteDirection
      blackFirst = colorDirectionConfig.blackFirst ?? true
    } else {
      // Randomize directions for real games
      if (Math.random() < 0.5) {
        blackDirection = 'clockwise'
        whiteDirection = 'counterclockwise'
        blackFirst = true
      } else {
        blackDirection = 'counterclockwise'
        whiteDirection = 'clockwise'
        blackFirst = false
      }
    }

    // Assign user IDs and robot flags to colors
    const playerConfigs = blackFirst
      ? [
          {
            color: 'black' as BackgammonColor,
            direction: blackDirection,
            userId: player1UserId,
            isRobot: player1IsRobot,
          },
          {
            color: 'white' as BackgammonColor,
            direction: whiteDirection,
            userId: player2UserId,
            isRobot: player2IsRobot,
          },
        ]
      : [
          {
            color: 'white' as BackgammonColor,
            direction: whiteDirection,
            userId: player1UserId,
            isRobot: player1IsRobot,
          },
          {
            color: 'black' as BackgammonColor,
            direction: blackDirection,
            userId: player2UserId,
            isRobot: player2IsRobot,
          },
        ]

    const players = playerConfigs.map((cfg) =>
      Player.initialize(
        cfg.color as BackgammonColor,
        cfg.direction,
        undefined,
        generateId(),
        'inactive',
        cfg.isRobot,
        cfg.userId
      )
    )

    // Ensure players is a tuple of length 2
    const playersTuple = players as [(typeof players)[0], (typeof players)[1]]

    // Create board with proper dual numbering system
    // The board expects: createBoardForPlayers(clockwiseColor, counterclockwiseColor)
    const board = Board.createBoardForPlayers(
      blackDirection === 'clockwise' ? 'black' : 'white',
      blackDirection === 'counterclockwise' ? 'black' : 'white'
    )

    // Initialize game
    let game: BackgammonGame = Game.initialize(
      playersTuple,
      generateId(),
      'rolling-for-start',
      board
    ) as BackgammonGameRollingForStart

    // Auto roll for start if requested
    if (autoRollForStart) {
      game = Game.rollForStart(game as BackgammonGameRollingForStart)
    }

    return game
  }

  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
        } as BackgammonGameRollingForStart
      case 'rolled-for-start':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      case 'rolling':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling
      case 'preparing-move':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGamePreparingMove
      case 'moving':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGameMoving
      case 'rolled':
        throw new Error('Game cannot be initialized in the rolled state')
      case 'moved':
        throw new Error('Game cannot be initialized in the moved state')
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
      case 'doubling':
        throw new Error('Game cannot be initialized in the doubling state')
      case 'doubled':
        throw new Error('Game cannot be initialized in the doubled state')
    }
    // Exhaustiveness check
    const _exhaustiveCheck: never = stateKind
    throw new Error(`Unhandled stateKind: ${stateKind}`)
  }

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    const activeColor = randomBackgammonColor()
    const rollingPlayers = game.players.map((p) =>
      p.color === activeColor
        ? Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'rolled-for-start',
            true,
            p.userId
          )
        : Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'inactive',
            true,
            p.userId
          )
    ) as BackgammonPlayers
    const activePlayer = rollingPlayers.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerRolledForStart
    const inactivePlayer = rollingPlayers.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive
    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      players: rollingPlayers,
      activePlayer,
      inactivePlayer,
    } as BackgammonGameRolledForStart
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart | BackgammonGameRolling
  ): BackgammonGameRolled {
    if (game.stateKind === 'rolled-for-start') {
      const { players, activeColor } = game
      const rollingPlayers = players.map((p) => {
        if (p.color === activeColor) {
          if (p.stateKind === 'rolling') return p
          return {
            ...p,
            stateKind: 'rolling',
          } as BackgammonPlayerRolling
        }
        return {
          ...p,
          stateKind: 'inactive',
        } as BackgammonPlayerInactive
      }) as BackgammonPlayers
      const newActivePlayer = rollingPlayers.find(
        (p) => p.color === activeColor
      ) as BackgammonPlayerRolling
      const inactivePlayer = rollingPlayers.find(
        (p) => p.color !== activeColor
      ) as BackgammonPlayerInactive
      const rollingGame: BackgammonGameRolling = {
        ...game,
        stateKind: 'rolling',
        players: rollingPlayers,
        activePlayer: newActivePlayer,
        inactivePlayer,
        activeColor: activeColor!,
      }
      return Game.roll(rollingGame)
    }
    const { players, board, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    if (activePlayerForColor.stateKind !== 'rolling') {
      throw new Error('Active player must be in rolling state')
    }
    const activePlayerRolling = activePlayerForColor as BackgammonPlayerRolling
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const playerRolled = Player.roll(activePlayerRolling)
    const activePlay = Play.initialize(board, playerRolled)

    const rolledPlay = {
      ...activePlay,
      stateKind: 'rolled',
      player: playerRolled,
    } as BackgammonPlayRolled

    // Update the players array to include the rolled player
    const updatedPlayers = players.map((p) =>
      p.id === playerRolled.id ? playerRolled : p
    ) as BackgammonPlayers

    return {
      ...game,
      stateKind: 'rolled',
      players: updatedPlayers,
      activePlayer: playerRolled,
      activePlay: rolledPlay,
      board,
    } as BackgammonGameRolled
  }

  /**
   * Transition from 'rolled' to 'preparing-move' state
   * This represents the player about to make a decision (move or double)
   */
  public static prepareMove = function prepareMove(
    game: BackgammonGameRolled
  ): BackgammonGamePreparingMove {
    if (game.stateKind !== 'rolled') {
      throw new Error(`Cannot prepare move from ${game.stateKind} state`)
    }

    // The preparing-move state maintains the same play and player state
    // but indicates that a decision (move or double) is about to be made
    return {
      ...game,
      stateKind: 'preparing-move',
    } as BackgammonGamePreparingMove
  }

  /**
   * Transition from 'preparing-move' or 'doubled' to 'moving' state
   * This must be called before any moves can be made
   */
  public static toMoving = function toMoving(
    game: BackgammonGamePreparingMove | BackgammonGameDoubled
  ): BackgammonGameMoving {
    const isValidState =
      game.stateKind === 'preparing-move' || game.stateKind === 'doubled'

    if (!isValidState) {
      throw new Error(
        `Cannot start moving from ${
          (game as any).stateKind
        } state. Must be in 'preparing-move' or 'doubled' state.`
      )
    }

    const movingPlay = Play.startMove(game.activePlay)
    return Game.startMove(game, movingPlay)
  }

  /**
   * Transition from 'preparing-move' to 'doubling' state
   * This represents offering a double to the opponent
   */
  public static toDoubling = function toDoubling(
    game: BackgammonGamePreparingMove
  ): BackgammonGame {
    if (game.stateKind !== 'preparing-move') {
      throw new Error(
        `Cannot start doubling from ${
          (game as any).stateKind
        } state. Must be in 'preparing-move' state.`
      )
    }

    // Delegate to the existing offerDouble logic
    return Game.offerDouble(game, game.activePlayer)
  }

  public static move = function move(
    game: BackgammonGameMoving,
    originId: string
  ): BackgammonGameMoving | BackgammonGame {
    let { activePlay, board } = game

    // Require explicit moving state - no automatic transitions
    if (activePlay.stateKind !== 'moving') {
      throw new Error(
        `Cannot move from ${activePlay.stateKind} state. Call Game.toMoving() first.`
      )
    }

    const playResult = Player.move(board, activePlay, originId)
    board = playResult.board

    // Update activePlayer from the move result if available
    let movedPlayer =
      playResult.move && playResult.move.player
        ? playResult.move.player
        : game.activePlayer

    // Always update activePlay from playResult (fallback to activePlay if undefined)
    const updatedActivePlay = (playResult as any).play || activePlay

    // --- WIN CONDITION CHECK ---
    // Check if the player has won (all checkers off) AFTER the move is processed
    // IMPORTANT: This check must happen after the checker is moved off the board
    const direction = movedPlayer.direction
    const playerOff = board.off[direction]
    const playerCheckersOff = playerOff.checkers.filter(
      (c) => c.color === movedPlayer.color
    ).length
    // If the move just made was a bear-off and this brings the total to 15, end the game
    const lastMoveKind = playResult.move && playResult.move.moveKind
    // Debug output for win condition
    logger.debug('[Game] Checking win condition:', {
      playerCheckersOff,
      lastMoveKind,
      playerOffCheckers: playerOff.checkers.length,
      movedPlayerColor: movedPlayer.color,
      movedPlayerDirection: movedPlayer.direction,
    })
    if (playerCheckersOff === 15 && lastMoveKind === 'bear-off') {
      // Player has borne off all checkers, they win
      const winner = {
        ...movedPlayer,
        stateKind: 'winner',
      } as BackgammonPlayerWinner
      return {
        ...game,
        stateKind: 'completed',
        winner,
        board,
        activePlayer: winner,
        activePlay: updatedActivePlay,
      } as any // TODO: type as BackgammonGameCompleted
    }
    // --- END WIN CONDITION CHECK ---

    return {
      ...game,
      stateKind: 'moving',
      board,
      activePlayer: movedPlayer,
      activePlay: updatedActivePlay,
    } as BackgammonGameMoving
  }

  public static activePlayer = function activePlayer(
    game: BackgammonGame
  ): BackgammonPlayerActive {
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind !== 'inactive'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    return activePlayer as BackgammonPlayerActive
  }

  public static inactivePlayer = function inactivePlayer(
    game: BackgammonGame
  ): BackgammonPlayerInactive {
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor && p.stateKind === 'inactive'
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return inactivePlayer as BackgammonPlayerInactive
  }

  public static getPlayersForColor = function getPlayersForColor(
    players: BackgammonPlayers,
    color: BackgammonColor
  ): [
    activePlayerForColor: BackgammonPlayerActive,
    inactivePlayerForColor: BackgammonPlayerInactive
  ] {
    const activePlayerForColor = players.find((p) => p.color === color)
    const inactivePlayerForColor = players.find((p) => p.color !== color)
    if (!activePlayerForColor || !inactivePlayerForColor) {
      throw new Error('Players not found')
    }
    return [
      activePlayerForColor as BackgammonPlayerActive,
      inactivePlayerForColor as BackgammonPlayerInactive,
    ]
  }

  public static startMove = function startMove(
    game: BackgammonGamePreparingMove | BackgammonGameDoubled,
    movingPlay: BackgammonPlayMoving
  ): BackgammonGameMoving {
    return {
      ...game,
      stateKind: 'moving',
      activePlay: movingPlay,
    } as BackgammonGameMoving
  }

  // --- Doubling Cube Logic ---

  public static canOfferDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Allow doubling from preparing-move state only (after rolling)
    // Only if player does not own the cube and cube is not maxxed or already offered
    return (
      game.stateKind === 'preparing-move' &&
      game.cube.stateKind !== 'maxxed' &&
      game.cube.stateKind !== 'offered' &&
      (!game.cube.owner || game.cube.owner.id !== player.id)
    )
  }

  // --- Player Management ---

  /**
   * Validates if rolling is allowed in the current game state
   */
  public static canRoll(game: BackgammonGame): boolean {
    return game.stateKind === 'rolled-for-start' || game.stateKind === 'rolling'
  }

  /**
   * Validates if rolling for start is allowed in the current game state
   */
  public static canRollForStart(game: BackgammonGame): boolean {
    return game.stateKind === 'rolling-for-start'
  }

  /**
   * Validates if the specified player can roll in the current game state
   */
  public static canPlayerRoll(game: BackgammonGame, playerId: string): boolean {
    if (!Game.canRoll(game)) {
      return false
    }

    // Check if the player is the active player
    if (game.activeColor) {
      const activePlayer = game.players.find(
        (p) => p.color === game.activeColor
      )
      if (!activePlayer || activePlayer.id !== playerId) {
        return false
      }
    }

    return true
  }

  /**
   * Validates if moves can be calculated for the current game state
   */
  public static canGetPossibleMoves(game: BackgammonGame): boolean {
    return game.stateKind === 'rolled' || game.stateKind === 'preparing-move'
  }

  // --- Checker Management ---

  /**
   * Finds a checker in the game board by ID
   * @param game - The game containing the board to search
   * @param checkerId - The ID of the checker to find
   * @returns The checker object or null if not found
   */
  public static findChecker(
    game: BackgammonGame,
    checkerId: string
  ): BackgammonChecker | null {
    try {
      return Checker.getChecker(game.board, checkerId)
    } catch {
      return null
    }
  }

  public static offerDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canOfferDouble(game, player))
      throw new Error('Cannot offer double')
    // Set cube to 'offered' state and transition to 'doubling' game state
    // Find the opponent
    const opponent = game.players.find((p) => p.id !== player.id)!
    // Convert players to correct types
    const activePlayer = Player.initialize(
      player.color,
      player.direction,
      player.dice,
      player.id,
      'doubled',
      true,
      player.userId
    )
    const inactivePlayer = opponent as BackgammonPlayerInactive
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    return {
      ...game,
      stateKind: 'doubling',
      cube: {
        ...game.cube,
        stateKind: 'offered',
        owner: player,
        value: game.cube.value
          ? (game.cube.value as Exclude<typeof game.cube.value, undefined>)
          : 2,
        offeredBy: player,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubling
  }

  public static canAcceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return (
      game.cube.stateKind === 'offered' &&
      game.cube.offeredBy &&
      game.cube.offeredBy.id !== player.id
    )
  }

  public static acceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canAcceptDouble(game, player))
      throw new Error('Cannot accept double')
    // Double the cube value, transfer ownership to accepting player, clear offeredBy, set to 'doubled' or 'maxxed'
    const nextValue = Math.min(
      game.cube.value ? game.cube.value * 2 : 2,
      64
    ) as typeof game.cube.value
    const offeringPlayer = game.cube.offeredBy!
    // Convert players to correct types
    const activePlayer = {
      ...player,
      stateKind: 'doubled',
    } as BackgammonPlayerDoubled
    const inactivePlayer = {
      ...offeringPlayer,
      stateKind: 'inactive',
    } as BackgammonPlayerInactive
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    if (nextValue === 64) {
      // If maxxed, game should be completed
      const winner = {
        ...player,
        stateKind: 'winner',
      } as BackgammonPlayerWinner
      return {
        ...game,
        stateKind: 'completed',
        winner,
        cube: {
          ...game.cube,
          stateKind: 'maxxed',
          owner: undefined,
          value: 64,
          offeredBy: undefined,
        },
      } as any // TODO: type as BackgammonGameCompleted
    }
    return {
      ...game,
      stateKind: 'doubled',
      cube: {
        ...game.cube,
        stateKind: 'doubled',
        owner: player,
        value: nextValue,
        offeredBy: undefined,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubled
  }

  public static canRefuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return Game.canAcceptDouble(game, player)
  }

  public static refuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canRefuseDouble(game, player))
      throw new Error('Cannot refuse double')
    // The refusing player loses at the current cube value
    // The offering player is the winner
    const offeringPlayer = game.cube.offeredBy!
    const winner = {
      ...offeringPlayer,
      stateKind: 'winner',
    } as BackgammonPlayerWinner
    return {
      ...game,
      stateKind: 'completed',
      winner,
    } as any // TODO: type as BackgammonGameCompleted
  }

  public static getPossibleMoves = function getPossibleMoves(
    game: BackgammonGame,
    playerId?: string
  ): {
    success: boolean
    error?: string
    possibleMoves?: BackgammonMoveSkeleton[]
    playerId?: string
    playerColor?: string
    updatedGame?: BackgammonGame
  } {
    // Validate game state
    if (
      game.stateKind !== 'rolled' &&
      game.stateKind !== 'preparing-move' &&
      game.stateKind !== 'moving'
    ) {
      return {
        success: false,
        error: 'Game is not in a state where possible moves can be calculated',
      }
    }

    // Get the target player
    let targetPlayer
    if (playerId) {
      targetPlayer = game.players.find((p) => p.id === playerId)
      if (!targetPlayer) {
        return {
          success: false,
          error: 'Player is not part of this game',
        }
      }
    } else if (game.activeColor) {
      targetPlayer = game.players.find((p) => p.color === game.activeColor)
    }

    if (!targetPlayer) {
      return {
        success: false,
        error: 'Unable to determine target player',
      }
    }

    // Get activePlay and moves
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return {
        success: false,
        error: 'No active play found',
      }
    }

    const movesArr = Array.isArray(activePlay.moves)
      ? activePlay.moves
      : Array.from(activePlay.moves)

    // Calculate possible moves based on current move states (respects dice consumption)
    let possibleMoves: BackgammonMoveSkeleton[] = []
    if (movesArr && movesArr.length > 0) {
      possibleMoves = movesArr.flatMap((move) => {
        // Only include moves that are still ready to be made
        if (move.stateKind === 'ready') {
          // Recalculate possible moves based on current board state
          const currentPossibleMoves = Board.getPossibleMoves(
            game.board,
            targetPlayer,
            move.dieValue
          )
          return currentPossibleMoves
        }
        return []
      })

      // Auto-complete turn when no legal moves remain
      if (
        possibleMoves.length === 0 &&
        movesArr.every((m) => m.stateKind === 'ready')
      ) {
        logger.debug('[Game] Auto-completing turn: no legal moves remain')

        // Mark all remaining moves as completed with no-move
        const completedMoves = movesArr.map((move) => ({
          ...move,
          stateKind: 'completed',
          moveKind: 'no-move',
          possibleMoves: [],
          isHit: false,
          origin: undefined,
          destination: undefined,
        }))

        // Update activePlay with completed moves
        const completedActivePlay = {
          ...activePlay,
          moves: new Set(completedMoves),
          stateKind: 'completed',
        }

        // Transition game to next player's turn
        const updatedGame = {
          ...game,
          activePlay: completedActivePlay,
          stateKind: 'rolling',
          activeColor: game.activeColor === 'white' ? 'black' : 'white',
        }

        // Update players: current becomes inactive, other becomes rolling
        const updatedPlayers = game.players.map((player) => {
          if (player.color === game.activeColor) {
            return { ...player, stateKind: 'inactive' as const }
          } else {
            return { ...player, stateKind: 'rolling' as const }
          }
        })
        updatedGame.players = updatedPlayers as any

        return {
          success: true,
          possibleMoves: [],
          playerId: targetPlayer.id,
          playerColor: targetPlayer.color,
          updatedGame: updatedGame as BackgammonGame,
        }
      }
    }

    return {
      success: true,
      possibleMoves,
      playerId: targetPlayer.id,
      playerColor: targetPlayer.color,
    }
  }
}
