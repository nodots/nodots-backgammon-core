import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
  BackgammonCube,
  BackgammonCubeValue,
  BackgammonDieValue,
  BackgammonGame,
  BackgammonGameDoubled,
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerActive,
  BackgammonPlayerDoubled,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolling,
  BackgammonPlayerRollingForStart,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { generateId, Player } from '..'
import { Board } from '../Board'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { Checker } from '../Checker'
import { Cube } from '../Cube'
import { Dice } from '../Dice'
import { BackgammonMoveDirection, Play } from '../Play'
import { debug, logger } from '../utils/logger'

// Hardcoded constant to avoid import issues during build
const MAX_PIP_COUNT = 167

export * from '../index'

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
   * Gets the GNU Position ID for the current board state
   * This is calculated dynamically based on the current game state
   */
  get gnuPositionId(): string {
    try {
      return exportToGnuPositionId(this as any)
    } catch (error) {
      logger.warn('Failed to generate gnuPositionId:', error)
      return ''
    }
  }

  public static createNewGame = function createNewGame(
    player1: { userId: string; isRobot: boolean },
    player2: { userId: string; isRobot: boolean }
  ): BackgammonGameRollingForStart {
    let blackDirection: BackgammonMoveDirection
    let whiteDirection: BackgammonMoveDirection

    if (Math.random() < 0.5) {
      blackDirection = 'clockwise'
      whiteDirection = 'counterclockwise'
    } else {
      blackDirection = 'counterclockwise'
      whiteDirection = 'clockwise'
    }

    const white = Player.initialize(
      'white',
      whiteDirection,
      'rolling-for-start',
      player1.isRobot,
      player1.userId
    )
    const black = Player.initialize(
      'black',
      blackDirection,
      'rolling-for-start',
      player2.isRobot,
      player2.userId
    )

    const players = [white, black]

    // Ensure players is a tuple of length 2
    const playersTuple = players as [(typeof players)[0], (typeof players)[1]]

    const board = Board.createBoardForPlayers(
      blackDirection === 'clockwise' ? 'black' : 'white',
      blackDirection === 'counterclockwise' ? 'black' : 'white'
    )

    // Initialize game
    let game = Game.initialize(
      playersTuple,
      generateId(),
      'rolling-for-start',
      board
    ) as BackgammonGameRollingForStart

    const playersWithCorrectPipCounts = Player.recalculatePipCounts(game)
    game = {
      ...game,
      players: playersWithCorrectPipCounts,
    }

    return game
  }

  // Helper to create base game properties
  private static createBaseGameProperties() {
    return {
      createdAt: new Date(),
      version: `v4.0`, // FIXME
      rules: {},
      settings: {
        allowUndo: false,
        allowResign: true,
        autoPlay: false,
        showHints: false,
        showProbabilities: false,
      },
    }
  }

  /**
   * @internal - Low-level constructor for scripts and internal use only.
   * Use Game.createNewGame() for normal game creation.
   */
  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayer,
    inactivePlayer?: BackgammonPlayer,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          ...Game.createBaseGameProperties(),
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
          ...Game.createBaseGameProperties(),
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
          ...Game.createBaseGameProperties(),
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling
      case 'moving':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          ...Game.createBaseGameProperties(),
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
      case 'moved':
        throw new Error('Game cannot be initialized in the moved state')
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
      case 'doubled':
        throw new Error('Game cannot be initialized in the doubled state')
    }
    // Exhaustiveness check
    const _exhaustiveCheck: never = stateKind
    throw new Error(`Unhandled stateKind: ${stateKind}`)
  }

  // ============================================================================
  // GAME STATE TRANSITION METHODS
  // ============================================================================

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    const { players } = game
    const clockwise = players.find(
      (p) => p.direction === 'clockwise' && p.stateKind === 'rolling-for-start'
    )
    const counterclockwise = players.find(
      (p) =>
        p.direction === 'counterclockwise' &&
        p.stateKind === 'rolling-for-start'
    )

    if (!clockwise || !counterclockwise) {
      throw new Error(
        'Cannot rollForStart without clockwise and counterclockwise players'
      )
    }

    // Roll dice for both players
    const rolledClockwise = Player.rollForStart(
      clockwise as BackgammonPlayerRollingForStart
    )
    const rolledCounterclockwise = Player.rollForStart(
      counterclockwise as BackgammonPlayerRollingForStart
    )

    // Determine who goes first based on the rolls
    const clockwiseRoll = rolledClockwise.dice.currentRoll![0]
    const counterclockwiseRoll = rolledCounterclockwise.dice.currentRoll![0]

    let activeColor: BackgammonColor
    if (clockwiseRoll > counterclockwiseRoll) {
      activeColor = clockwise.color
    } else if (counterclockwiseRoll > clockwiseRoll) {
      activeColor = counterclockwise.color
    } else {
      // Tie - need to reroll (for now, default to clockwise)
      return Game.rollForStart(game)
    }

    const rollingForStartPlayers = [rolledClockwise, rolledCounterclockwise]
    const activePlayer = rollingForStartPlayers.find(
      (p) => p.color === activeColor
    )!
    const inactivePlayer = rollingForStartPlayers.find(
      (p) => p.color !== activeColor
    )!

    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      players: rollingForStartPlayers,
      activePlayer,
      inactivePlayer,
    } as BackgammonGameRolledForStart
  }

  public static roll = function roll(
    game:
      | BackgammonGameRolledForStart
      | BackgammonGameRolling
      | BackgammonGameDoubled
  ): BackgammonGameMoving {
    switch (game.stateKind) {
      case 'rolled-for-start': {
        const { players, activeColor } = game
        const activePlayer = players.find((p) => p.color === activeColor)
        if (!activePlayer) throw Error(`Roll requires an active player`)
        const inactivePlayer = players.find((p) => p.id !== activePlayer.id)
        if (!inactivePlayer) throw Error(`Roll requires and inactive player`)
        if (
          !activePlayer?.rollForStartValue ||
          !inactivePlayer?.rollForStartValue
        ) {
          throw new Error('Players do not have rollForStartValues')
        }

        // Use roll-for-start values for the winner's first roll
        const currentRoll: BackgammonRoll = [
          activePlayer.rollForStartValue,
          inactivePlayer.rollForStartValue,
        ]

        const movingPlayer: BackgammonPlayerMoving = {
          ...activePlayer,
          stateKind: 'moving',
          dice: {
            ...activePlayer.dice,
            stateKind: 'rolled',
            currentRoll: currentRoll, // Use actual roll-for-start values
            total: currentRoll[0] + currentRoll[1],
          },
          rollForStartValue: activePlayer.rollForStartValue,
        }

        const unrolledPlayer: BackgammonPlayerInactive = {
          ...inactivePlayer,
          stateKind: 'inactive',
          dice: {
            ...inactivePlayer.dice,
            stateKind: 'inactive',
            currentRoll: undefined,
            total: 0,
          },
          rollForStartValue: inactivePlayer.rollForStartValue,
        }

        const activePlay = Play.initialize(game.board, movingPlayer)

        // Check if all moves were auto-completed (no legal moves available)
        const allMovesCompleted = Array.from(activePlay.moves).every(
          (m) => m.stateKind === 'completed'
        )
        if (allMovesCompleted) {
          debug(
            'Game.roll: All moves auto-completed - no legal moves available, transitioning to moved state'
          )
          // Player has no legal moves, return game in 'moved' state
          return {
            ...game,
            stateKind: 'moved',
            activePlayer: movingPlayer,
            inactivePlayer: unrolledPlayer,
            activePlay,
            board: game.board, // Board unchanged
          } as any // Cast to avoid type issues since we're returning moved instead of moving
        }

        // Update the board with movable checkers
        const movableContainerIds: string[] = []
        const movesArray = Array.from(activePlay.moves)
        for (const move of movesArray) {
          switch (move.stateKind) {
            case 'ready':
              if (move.possibleMoves) {
                for (const possibleMove of move.possibleMoves) {
                  if (
                    possibleMove.origin &&
                    !movableContainerIds.includes(possibleMove.origin.id)
                  ) {
                    movableContainerIds.push(possibleMove.origin.id)
                  }
                }
              }
              break
            case 'completed':
            case 'confirmed':
            case 'in-progress':
              // These moves don't have movable checkers
              break
          }
        }
        const updatedBoard = Checker.updateMovableCheckers(
          game.board,
          movableContainerIds
        )

        return {
          ...game,
          stateKind: 'moving',
          players: [movingPlayer, unrolledPlayer],
          activeColor: movingPlayer.color,
          activePlayer: movingPlayer,
          inactivePlayer: unrolledPlayer,
          activePlay,
          board: updatedBoard,
        }
      }

      case 'doubled': {
        // Handle rolling from doubled state (after accepting a double)
        const { players, board, activeColor } = game
        if (!activeColor) throw new Error('Active color must be provided')
        let [activePlayerForColor, inactivePlayerForColor] =
          Game.getPlayersForColor(players, activeColor!)
        if (activePlayerForColor.stateKind !== 'doubled') {
          throw new Error('Active player must be in doubled state')
        }
        const activePlayerDoubled =
          activePlayerForColor as BackgammonPlayerDoubled
        const inactivePlayer = inactivePlayerForColor
        if (!inactivePlayer) throw new Error('Inactive player not found')

        // Roll new dice for the doubled player
        const playerRolled = Player.roll({
          ...activePlayerDoubled,
          stateKind: 'rolling',
        } as any)
        const playerMoving = Player.toMoving(playerRolled)
        const activePlay = Play.initialize(board, playerMoving)

        // Check if all moves were auto-completed (no legal moves available)
        const allMovesCompleted = Array.from(activePlay.moves).every(
          (m) => m.stateKind === 'completed'
        )
        if (allMovesCompleted) {
          debug(
            'Game.roll: All moves auto-completed (doubled case) - no legal moves available, transitioning to moved state'
          )
          return {
            ...game,
            stateKind: 'moved',
            activePlayer: playerMoving,
            inactivePlayer,
            activePlay,
            board,
          } as any
        }

        const movingPlay = {
          ...activePlay,
          stateKind: 'moving',
          player: playerMoving,
        } as BackgammonPlayMoving

        // Update the board with movable checkers
        const movableContainerIds: string[] = []
        const movesArray = Array.from(activePlay.moves)
        for (const move of movesArray) {
          switch (move.stateKind) {
            case 'ready':
              if (move.possibleMoves) {
                for (const possibleMove of move.possibleMoves) {
                  if (
                    possibleMove.origin &&
                    !movableContainerIds.includes(possibleMove.origin.id)
                  ) {
                    movableContainerIds.push(possibleMove.origin.id)
                  }
                }
              }
              break
            case 'completed':
            case 'confirmed':
            case 'in-progress':
              // These moves don't have movable checkers
              break
          }
        }
        const updatedBoard = Checker.updateMovableCheckers(
          board,
          movableContainerIds
        )

        // Update the players array to include the rolled player
        const updatedPlayers = players.map((p) =>
          p.id === playerRolled.id ? playerRolled : p
        ) as BackgammonPlayers

        const movingGame = {
          ...game,
          stateKind: 'moving',
          players: updatedPlayers,
          activePlayer: playerRolled,
          activePlay: movingPlay,
          board: updatedBoard,
        } as BackgammonGameMoving

        return movingGame
      }

      case 'rolling': {
        // Handle rolling from 'rolling' state (generate new dice)
        const { players, board, activeColor } = game
        if (!activeColor) throw new Error('Active color must be provided')
        let [activePlayerForColor, inactivePlayerForColor] =
          Game.getPlayersForColor(players, activeColor!)
        if (activePlayerForColor.stateKind !== 'rolling') {
          throw new Error('Active player must be in rolling state')
        }
        const activePlayerRolling =
          activePlayerForColor as BackgammonPlayerRolling
        const inactivePlayer = inactivePlayerForColor
        if (!inactivePlayer) throw new Error('Inactive player not found')

        const playerRolled = Player.roll(activePlayerRolling)
        const playerMoving = Player.toMoving(playerRolled)
        const activePlay = Play.initialize(board, playerMoving)

        // Check if all moves were auto-completed (no legal moves available)
        const allMovesCompleted = Array.from(activePlay.moves).every(
          (m) => m.stateKind === 'completed'
        )
        if (allMovesCompleted) {
          debug(
            'Game.roll: All moves auto-completed (rolling case) - no legal moves available, transitioning to moved state'
          )
          return {
            ...game,
            stateKind: 'moved',
            activePlayer: playerMoving,
            inactivePlayer,
            activePlay,
            board,
          } as any
        }

        const movingPlay = {
          ...activePlay,
          stateKind: 'moving',
          player: playerMoving,
        } as BackgammonPlayMoving

        // Update the board with movable checkers
        const movableContainerIds: string[] = []
        const movesArray = Array.from(activePlay.moves)
        for (const move of movesArray) {
          switch (move.stateKind) {
            case 'ready':
              if (move.possibleMoves) {
                for (const possibleMove of move.possibleMoves) {
                  if (
                    possibleMove.origin &&
                    !movableContainerIds.includes(possibleMove.origin.id)
                  ) {
                    movableContainerIds.push(possibleMove.origin.id)
                  }
                }
              }
              break
            case 'completed':
            case 'confirmed':
            case 'in-progress':
              // These moves don't have movable checkers
              break
          }
        }
        const updatedBoard = Checker.updateMovableCheckers(
          board,
          movableContainerIds
        )

        // Update the players array to include the rolled player
        const updatedPlayers = players.map((p) =>
          p.id === playerRolled.id ? playerRolled : p
        ) as BackgammonPlayers

        const movingGame = {
          ...game,
          stateKind: 'moving',
          players: updatedPlayers,
          activePlayer: playerRolled,
          activePlay: movingPlay,
          board: updatedBoard,
        } as BackgammonGameMoving

        return movingGame
      }

      default:
        // TypeScript exhaustiveness check - should never reach here
        const _exhaustiveCheck: never = game
        throw new Error(`Unexpected game state: ${(game as any).stateKind}`)
    }
  }

  /**
   * Switch the order of dice for the active player
   * Allowed in 'moving' state when all moves are undone
   */
  public static switchDice = function switchDice(
    game: BackgammonGameMoving
  ): BackgammonGameMoving {
    // Check if dice switching is allowed
    switch (game.stateKind) {
      case 'moving': {
        // Only allowed in moving state if all moves are undone (all moves in 'ready' state)
        const allMovesUndone = game.activePlay?.moves
          ? Array.from(game.activePlay.moves).every(
              (move: any) => move.stateKind === 'ready'
            )
          : false

        if (!allMovesUndone) {
          throw new Error(
            'Cannot switch dice in moving state unless all moves are undone'
          )
        }
        break
      }
      default:
        // This should never happen given our union type, but include for completeness
        throw new Error(
          `Cannot switch dice from ${(game as any).stateKind} state`
        )
    }

    const { activePlayer, activePlay } = game

    if (
      !activePlayer?.dice?.currentRoll ||
      activePlayer.dice.currentRoll.length !== 2
    ) {
      throw new Error('Active player does not have valid dice to switch')
    }

    // Switch the dice using the Dice class
    const switchedDice = Dice.switchDice(activePlayer.dice)
    const updatedActivePlayer = {
      ...activePlayer,
      dice: switchedDice,
    }

    // Update the activePlay to reflect the new dice order
    const updatedActivePlay = activePlay
      ? {
          ...activePlay,
          moves: activePlay.moves
            ? (() => {
                const movesArray = Array.from(activePlay.moves)
                if (movesArray.length >= 2) {
                  // Swap the first two moves to match the new dice order
                  const swappedMoves = [...movesArray]
                  const temp = swappedMoves[0]
                  swappedMoves[0] = swappedMoves[1]
                  swappedMoves[1] = temp

                  // CRITICAL: Update dieValue to match new dice order after swapping
                  // This fixes the data duplication bug between dice.currentRoll and moves[].dieValue
                  const [newFirstDie, newSecondDie] = switchedDice.currentRoll
                  swappedMoves[0] = {
                    ...swappedMoves[0],
                    dieValue: newFirstDie,
                  }
                  swappedMoves[1] = {
                    ...swappedMoves[1],
                    dieValue: newSecondDie,
                  }

                  // CRITICAL: Regenerate possibleMoves for all moves based on new dice order
                  // This is necessary because possibleMoves were calculated with the old dice order
                  const regeneratedMoves = swappedMoves.map((move) => {
                    if (move.stateKind === 'ready') {
                      // Only regenerate for ready moves - completed moves shouldn't change
                      const freshPossibleMoves = Board.getPossibleMoves(
                        game.board,
                        updatedActivePlayer,
                        move.dieValue as BackgammonDieValue
                      )
                      return {
                        ...move,
                        player: updatedActivePlayer, // Update player reference with switched dice
                        possibleMoves: freshPossibleMoves,
                      }
                    }
                    // Update player reference for non-ready moves too
                    return {
                      ...move,
                      player: updatedActivePlayer, // Update player reference with switched dice
                    }
                  })

                  return new Set(regeneratedMoves)
                }
                return activePlay.moves
              })()
            : activePlay.moves,
        }
      : activePlay

    // Update the players array
    const updatedPlayers = game.players.map((p) =>
      p.id === activePlayer.id ? updatedActivePlayer : p
    ) as BackgammonPlayers

    // Return the same state type as input
    return {
      ...game,
      players: updatedPlayers,
      activePlayer: updatedActivePlayer,
      activePlay: updatedActivePlay,
    } as typeof game
  }

  public static move = function move(
    game: BackgammonGameMoving,
    checkerId: string
  ): BackgammonGameMoving | BackgammonGame {
    const checker = Board.getCheckers(game.board).find(
      (c) => c.id === checkerId
    )
    if (!checker) throw new Error(`No checker found for checkerId ${checkerId}`)
    // Validate game state using switch
    switch (game.stateKind) {
      case 'moving':
        // Valid state for moving
        break
      default:
        throw new Error(
          `Cannot move from ${(game as any).stateKind} state. Must be in 'moving' state.`
        )
    }
    let { activePlay, board } = game

    // Check if activePlay exists
    if (!activePlay) {
      throw new Error(
        'No active play found. Game must be in a valid play state.'
      )
    }

    // Validate activePlay state using switch
    switch (activePlay.stateKind) {
      case 'moving':
        // Valid state for activePlay
        break
      default:
        throw new Error(
          `Cannot move from ${activePlay.stateKind} state. ActivePlay must be in 'moving' state.`
        )
    }

    const playResult = Player.move(
      board,
      activePlay,
      checker.checkercontainerId
    )
    board = playResult.board

    let movedPlayer =
      playResult.move && playResult.move.player
        ? {
            ...playResult.move.player,
            dice: game.activePlayer.dice, // Preserve switched dice state
          }
        : game.activePlayer

    // Always update activePlay from playResult (fallback to activePlay if undefined)
    const updatedActivePlay = (playResult as any).play || activePlay

    // Update the board with movable checkers based on remaining moves
    // IMPORTANT: After a move, we need to recalculate possible moves for remaining ready moves
    const movableContainerIds: string[] = []
    if (updatedActivePlay.moves) {
      const movesArray = Array.from(updatedActivePlay.moves) as any[]
      for (const move of movesArray) {
        switch (move.stateKind) {
          case 'ready':
            // Recalculate fresh possible moves for this die value on the current board state
            const freshPossibleMoves = Board.getPossibleMoves(
              board,
              updatedActivePlay.player,
              move.dieValue
            )

            // CRITICAL BUG FIX: Handle case where recalculated possibleMoves is empty
            // When no moves are possible after board update, convert to completed no-move
            // This prevents stuck games with ready moves that have no valid possibleMoves
            if (!freshPossibleMoves || freshPossibleMoves.length === 0) {
              move.stateKind = 'completed'
              move.moveKind = 'no-move'
              move.possibleMoves = []
              move.origin = undefined
              move.destination = undefined
              move.isHit = false
              debug(
                'Game.move: Converting move to no-move (no possible moves after recalculation)',
                {
                  moveId: move.id,
                  dieValue: move.dieValue,
                  originalMoveKind: move.moveKind,
                }
              )
            } else {
              // Update the move with fresh possible moves
              move.possibleMoves = freshPossibleMoves

              // Add origins to movable containers
              for (const possibleMove of freshPossibleMoves) {
                if (
                  possibleMove.origin &&
                  !movableContainerIds.includes(possibleMove.origin.id)
                ) {
                  movableContainerIds.push(possibleMove.origin.id)
                }
              }
            }
            break
          case 'completed':
          case 'confirmed':
          case 'in-progress':
            // These moves don't have movable checkers
            break
        }
      }
    }
    board = Checker.updateMovableCheckers(board, movableContainerIds)

    // Recalculate pip counts after the move BEFORE win condition check
    // This ensures final pip counts are correct when the game ends
    logger.info('Game.move: Recalculating pip counts after move')
    const gameWithUpdatedBoard = {
      ...game,
      board,
      players: game.players.map((p) =>
        p.id === movedPlayer.id ? movedPlayer : p
      ) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayers,
    }
    const updatedPlayers = Player.recalculatePipCounts(gameWithUpdatedBoard)

    // Update movedPlayer with correct pip count
    movedPlayer =
      (updatedPlayers.find((p) => p.id === movedPlayer.id) as any) ||
      movedPlayer

    // --- WIN CONDITION CHECK ---
    // Check if the player has won (all checkers off) AFTER the move is processed
    // IMPORTANT: This check must happen after the checker is moved off the board AND pip counts recalculated
    const direction = movedPlayer.direction
    const playerOff = board.off[direction]
    const playerCheckersOff = playerOff.checkers.filter(
      (c) => c.color === movedPlayer.color
    ).length

    // Count total checkers on board for this player (should be 0 when won)
    const playerCheckersOnBoard = Board.getCheckers(board).filter(
      (c) => c.color === movedPlayer.color
    ).length

    // Get move kind for additional context
    const lastMoveKind = playResult.move && playResult.move.moveKind

    // Enhanced debug output for win condition
    logger.info('[Game] 🏆 WIN CONDITION CHECK:', {
      playerCheckersOff,
      playerCheckersOnBoard,
      totalCheckersExpected: 15,
      lastMoveKind,
      playerOffCheckers: playerOff.checkers.length,
      movedPlayerColor: movedPlayer.color,
      movedPlayerDirection: movedPlayer.direction,
      pipCount: movedPlayer.pipCount,
      hasWon: playerCheckersOff === 15 || playerCheckersOnBoard === 0,
    })

    // FIXED: More robust win condition - check multiple criteria for victory
    // A player wins when they have all 15 checkers off OR no checkers remaining on board
    const hasWon = (
      (playerCheckersOff === 15) || // Primary condition: all checkers in off area
      (playerCheckersOnBoard === 0 && playerCheckersOff > 0) || // Backup: no checkers on board + some off
      (movedPlayer.pipCount === 0 && lastMoveKind === 'bear-off') // Tertiary: pip count zero after bear-off
    )

    if (hasWon) {
      logger.info(`🎉 [Game] PLAYER ${movedPlayer.color.toUpperCase()} HAS WON! (${playerCheckersOff} checkers off, ${playerCheckersOnBoard} on board)`)

      // Player has borne off all checkers, they win
      const winner = {
        ...movedPlayer,
        stateKind: 'winner',
        pipCount: 0, // Winner has 0 pip count
      } as BackgammonPlayerWinner

      // Update players array to include the winner with correct state
      const finalPlayers = updatedPlayers.map((p) =>
        p.id === winner.id ? winner : p
      ) as BackgammonPlayers

      logger.info(`🏁 [Game] Game ${game.id} completed - Winner: ${winner.id}`)

      return {
        ...game,
        stateKind: 'completed',
        winner: winner.id,
        board,
        activePlayer: winner,
        activePlay: updatedActivePlay,
        players: finalPlayers,
        endTime: new Date(), // Add end time for completed games
      } as any // TODO: type as BackgammonGameCompleted
    }
    // --- END WIN CONDITION CHECK ---

    // DICE SWITCHING DEBUG: Check what's happening to dice and moves state
    const finalActivePlayer = updatedPlayers.find(
      (p) => p.id === movedPlayer.id
    ) as any
    const finalMoves = Array.from(updatedActivePlay.moves || [])
    console.log('🎲 [DICE DEBUG] Game.move result:')
    console.log(
      '  game.activePlayer.dice:',
      game.activePlayer.dice?.currentRoll
    )
    console.log(
      '  finalActivePlayer.dice:',
      finalActivePlayer?.dice?.currentRoll
    )
    console.log(
      '  finalMoves.dieValues:',
      finalMoves.map((m: any) => m.dieValue)
    )
    console.log(
      '  finalMoves.states:',
      finalMoves.map((m: any) => m.stateKind)
    )

    // Set game stateKind based on activePlay stateKind
    const gameStateKind =
      updatedActivePlay.stateKind === 'moved' ? 'moved' : 'moving'

    // Set activePlayer stateKind based on activePlay stateKind
    const finalActivePlayerWithState = {
      ...finalActivePlayer,
      stateKind: updatedActivePlay.stateKind === 'moved' ? 'moved' : 'moving',
    }

    return {
      ...game,
      stateKind: gameStateKind,
      board,
      players: updatedPlayers.map((p) =>
        p.id === finalActivePlayerWithState.id ? finalActivePlayerWithState : p
      ),
      activePlayer: finalActivePlayerWithState,
      activePlay: updatedActivePlay,
    } as BackgammonGameMoving | BackgammonGameMoved
  }

  /**
   * Transition from 'moving' to 'moved' state
   * This represents that all moves are completed and the player must confirm their turn
   */
  public static toMoved = function toMoved(
    game: BackgammonGameMoving
  ): BackgammonGameMoved {
    if (game.stateKind !== 'moving') {
      throw new Error(
        `Cannot transition to moved from ${
          (game as any).stateKind
        } state. Must be in 'moving' state.`
      )
    }

    // Ensure all moves are completed before transitioning
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      throw new Error('No active play found')
    }

    const movesArray = Array.from(activePlay.moves)
    const allMovesCompleted = movesArray.every(
      (move) => move.stateKind === 'completed'
    )

    if (!allMovesCompleted) {
      throw new Error(
        'Cannot transition to moved state - not all moves are completed'
      )
    }

    // Create moved state - human player's turn is complete, waiting for dice click confirmation
    return {
      ...game,
      stateKind: 'moved',
    } as BackgammonGameMoved
  }

  /**
   * Execute a single move and recalculate fresh moves (just-in-time approach)
   * This method prevents stale move references by always calculating moves based on current board state
   * @param game - Current game state in 'moving' state
   * @param originId - ID of the origin point/bar to move from
   * @returns Updated game state with fresh moves calculated
   */
  public static executeAndRecalculate = function executeAndRecalculate(
    game: BackgammonGameMoving,
    originId: string
  ): BackgammonGameMoving | BackgammonGame {
    // First, execute the move using the existing move method
    console.log(
      '[DEBUG] Game.executeAndRecalculate: About to execute move from origin:',
      originId
    )

    // DEBUG: Check if game is defined and has required properties
    if (!game) {
      console.error('[DEBUG] CRITICAL: game parameter is undefined/null!')
      throw new Error('Game parameter is undefined - cannot execute move')
    }

    if (!game.board) {
      console.error('[DEBUG] CRITICAL: game.board is undefined!', {
        gameStateKind: game.stateKind,
        gameKeys: Object.keys(game),
        hasActivePlay: !!game.activePlay,
        hasActivePlayer: !!game.activePlayer,
      })
      throw new Error('Game.board is undefined - cannot execute move')
    }

    // Find a checker in the specified origin container to execute the move
    const checkers = Board.getCheckers(game.board)
    const checkerInOrigin = checkers.find(
      (c) =>
        c.checkercontainerId === originId && c.color === game.activePlayer.color
    )

    if (!checkerInOrigin) {
      throw new Error(
        `No ${game.activePlayer.color} checker found in container ${originId}`
      )
    }

    const gameAfterMove = Game.move(game, checkerInOrigin.id)

    console.log(
      '[DEBUG] Game.executeAndRecalculate: Move executed, game state:',
      {
        stateKind: gameAfterMove.stateKind,
        hasActivePlay: !!(gameAfterMove as any).activePlay,
        activePlayMoves: (gameAfterMove as any).activePlay?.moves
          ? Array.from((gameAfterMove as any).activePlay.moves).length
          : 0,
      }
    )

    // Check if the game ended (win condition)
    if (gameAfterMove.stateKind === 'completed') {
      return gameAfterMove
    }

    // Check if the game is already in 'moved' state after the move
    if (gameAfterMove.stateKind === 'moved') {
      console.log('[DEBUG] 🎯 Game is already in moved state, returning as-is')
      return gameAfterMove
    }

    // Game continues in moving state
    const movingGame = gameAfterMove as BackgammonGameMoving

    // For robot players, auto-complete turn if all moves are completed
    if (movingGame.activePlayer.isRobot) {
      // Check if turn should be completed for robot
      const gameAfterTurnCheck = Game.checkAndCompleteTurn(movingGame)

      // If the game transitioned to 'moved' state, automatically confirm the turn
      if (gameAfterTurnCheck.stateKind === 'moved') {
        console.log('[DEBUG] 🤖 Robot turn completed, auto-confirming turn')
        return Game.confirmTurn(gameAfterTurnCheck as BackgammonGameMoved)
      }
    }

    // CRITICAL FIX: After executing a move, the activePlay.moves now contains fresh possibleMoves
    // for all remaining ready moves thanks to the fix in Play.move()
    // The movingGame already has the updated board state and refreshed activePlay

    console.log(
      '[DEBUG] Game.executeAndRecalculate: Move executed successfully, returning updated game with fresh activePlay'
    )

    // Turn continues, return the game with fresh board state and updated activePlay
    return movingGame
  }

  /**
   * Check if the current turn is complete and transition to 'moved' state
   * This method now follows the same state machine as human players for consistency
   * @param game - Current game state
   * @returns Updated game state in 'moved' state or current game if turn not complete
   */
  public static checkAndCompleteTurn = function checkAndCompleteTurn(
    game: BackgammonGameMoving
  ): BackgammonGame {
    // Check if all moves in the current turn are completed
    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return game // No active play, return current game
    }

    const movesArray = Array.from(activePlay.moves)
    const allMovesCompleted = movesArray.every(
      (move) => move.stateKind === 'completed'
    )

    if (!allMovesCompleted) {
      return game // Turn not complete, return current game
    }

    // FIXED: Use the same state transition as human players
    // All moves are completed, transition to 'moved' state
    return Game.toMoved(game)
  }

  /**
   * Manually confirm the current turn and pass control to the next player
   * This is triggered by dice click after the player has finished their moves
   * @param game - Current game state in 'moving' state
   * @returns Updated game state with next player's turn
   */
  public static confirmTurn = function confirmTurn(
    game: BackgammonGameMoved
  ): BackgammonGameRolling {
    if (game.stateKind !== 'moved') {
      throw new Error('Cannot confirm turn from non-moving state')
    }

    // Reset all isMovable flags on the board
    const boardWithResetMovable = Checker.updateMovableCheckers(game.board, [])

    // Manually transition to next player since turn is confirmed
    const nextColor = game.activeColor === 'white' ? 'black' : 'white'

    // Update players: current becomes inactive, next becomes rolling
    const updatedPlayers = game.players.map((player) => {
      if (player.color === game.activeColor) {
        // CRITICAL FIX: Preserve robot dice currentRoll values when transitioning to inactive
        // This ensures robot dice continue to display what they rolled
        //
        // ⚠️  TECH DEBT WARNING: currentRoll DATA DUPLICATION ISSUE ⚠️
        // The dice roll values are stored in TWO places in the model:
        // 1. player.dice.currentRoll - Raw rolled values [x, y]
        // 2. game.activePlay.moves[n].dieValue - Individual die values used for moves
        // This duplication creates maintenance overhead and potential inconsistency.
        // Future refactoring should consolidate this to a single source of truth.
        //
        const preservedDice =
          player.isRobot && player.dice?.currentRoll
            ? {
                ...player.dice,
                stateKind: 'inactive' as const,
              }
            : Dice.initialize(player.color, 'inactive')

        return {
          ...player,
          stateKind: 'inactive' as const,
          dice: preservedDice,
        }
      } else {
        return {
          ...player,
          stateKind: 'rolling' as const,
          dice: Dice.initialize(player.color, 'rolling'),
        }
      }
    }) as BackgammonPlayers

    // Recalculate pip counts before transitioning to next player
    logger.info(
      'Game turn completion: Recalculating pip counts before transitioning to next player'
    )
    const playersWithUpdatedPips = Player.recalculatePipCounts({
      ...game,
      players: updatedPlayers,
    })

    const newActivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === nextColor
    ) as BackgammonPlayerActive
    const newInactivePlayerWithPips = playersWithUpdatedPips.find(
      (p) => p.color === game.activeColor
    ) as BackgammonPlayerInactive

    // CRITICAL FIX: Pass undefined for type compatibility, but the core issue is addressed
    // The real fix requires extending the type system to support preserved activePlay
    // For now, keep the original behavior but document the fix location

    // Return game with next player's turn
    return {
      ...game,
      stateKind: 'rolling',
      players: playersWithUpdatedPips,
      board: boardWithResetMovable,
      activeColor: nextColor,
      activePlayer: newActivePlayerWithPips,
      inactivePlayer: newInactivePlayerWithPips,
      activePlay: undefined, // No activePlay after turn confirmation
    } as BackgammonGameRolling
  }

  /**
   * Handle robot automation for games in 'moved' state
   * If the active player is a robot and the game is in 'moved' state, automatically confirm the turn
   * @param game - Game in any state
   * @returns Game with turn confirmed if robot automation was applied, otherwise unchanged
   */
  public static handleRobotMovedState = function handleRobotMovedState(
    game: BackgammonGame
  ): BackgammonGame {
    // Only handle games in 'moved' state with robot active player
    if (game.stateKind === 'moved' && game.activePlayer.isRobot) {
      console.log('[DEBUG] 🤖 Robot in moved state, auto-confirming turn')
      return Game.confirmTurn(game as BackgammonGameMoved)
    }
    return game
  }

  /**
   * Execute a complete robot turn including all moves and turn confirmation
   * This method handles the entire turn cycle for a robot player:
   * 1. Executes all available dice moves using Player.getBestMove()
   * 2. Transitions to 'moved' state when all moves complete
   * 3. Automatically confirms the turn (equivalent to dice click)
   * 4. Transitions to next player's 'rolling' state
   * @param game - Current game state in 'moving' state with robot player
   * @returns Updated game state with next player ready to roll (or current player if turn incomplete)
   */
  public static executeRobotTurn = async function executeRobotTurn(
    game: BackgammonGame
  ): Promise<BackgammonGame> {
    switch (game.stateKind) {
      case 'moving': {
        const movingGame = game as BackgammonGameMoving

        if (!movingGame.activePlayer.isRobot) {
          throw new Error('Cannot execute robot turn for non-robot player')
        }

        if (!movingGame.activePlay) {
          throw new Error(
            'No active play found. Game must be in a valid play state.'
          )
        }

        // CRITICAL FIX: Check if all moves are already completed (no-move scenario)
        // When Play.initialize detects all moves are no-moves, it creates them as 'completed'
        // In this case, we should immediately complete the turn without trying to execute moves
        const movesArray = Array.from(movingGame.activePlay.moves)
        const allMovesCompleted = movesArray.every(
          (move) => move.stateKind === 'completed'
        )

        if (allMovesCompleted) {
          debug(
            'Game.executeRobotTurn: All moves already completed (no-move scenario), transitioning turn immediately'
          )
          // All moves are already completed as no-moves, transition to 'moved' state and confirm turn
          const movedGame = Game.toMoved(movingGame)
          return Game.confirmTurn(movedGame)
        }

        let currentGame: BackgammonGame = movingGame
        let moveCount = 0
        const maxMoves = 4 // Maximum moves in a turn (doubles)

        // Execute moves until no more ready moves or max moves reached
        while (currentGame.stateKind === 'moving' && moveCount < maxMoves) {
          switch (currentGame.stateKind) {
            case 'moving': {
              const gameMoving = currentGame as BackgammonGameMoving

              if (!gameMoving.activePlay) {
                return currentGame // No active play, turn complete
              }

              // Get all moves from activePlay
              const movesArray = Array.from(gameMoving.activePlay.moves)
              const readyMoves = movesArray.filter(
                (move) => move.stateKind === 'ready'
              )

              // Check for turn completion conditions
              const allMovesCompleted = movesArray.every(
                (move) => move.stateKind === 'completed'
              )

              if (readyMoves.length === 0 || allMovesCompleted) {
                // No ready moves available OR all moves are completed (including no-moves)
                // Transition to 'moved' state and auto-confirm turn
                const movedGame = Game.toMoved(gameMoving)
                return Game.confirmTurn(movedGame)
              }

              // Use Player.getBestMove to select the optimal move
              const selectedMove = await Player.getBestMove(
                gameMoving.activePlay
              )

              if (!selectedMove) {
                logger.warn('Robot could not select a move, skipping')
                return currentGame
              }

              // Extract checker ID from the selected move's first possible move
              const checkerId =
                selectedMove.possibleMoves?.[0]?.origin?.checkers?.[0]?.id

              if (!checkerId) {
                logger.warn('Unable to extract checker ID from selected move')
                return currentGame
              }

              // Execute the move
              try {
                currentGame = Game.move(gameMoving, checkerId)
                moveCount++

                logger.info(
                  `Robot executed move ${moveCount} with checker ${checkerId}`
                )
              } catch (error) {
                logger.error('Error executing robot move:', error)
                return currentGame
              }
              break
            }
            default:
              return currentGame
          }
        }

        // Handle final state transitions
        switch (currentGame.stateKind) {
          case 'moving': {
            const gameMoving = currentGame as BackgammonGameMoving
            if (!gameMoving.activePlay) return currentGame

            const movesArray = Array.from(gameMoving.activePlay.moves)
            const allCompleted = movesArray.every(
              (move) => move.stateKind === 'completed'
            )

            if (!allCompleted) return currentGame

            // All moves completed, transition to 'moved' state
            currentGame = Game.toMoved(gameMoving)
            // Fall through to handle 'moved' state
          }
          case 'moved':
            logger.info('Robot turn complete, automatically confirming turn')
            return Game.confirmTurn(currentGame as BackgammonGameMoved)
          default:
            return currentGame
        }
      }
      default:
        throw new Error(
          `Cannot execute robot turn from ${game.stateKind} state. Must be in 'moving' state.`
        )
    }
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
    inactivePlayerForColor: BackgammonPlayerInactive,
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
    game: BackgammonGameDoubled,
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
    // Allow doubling from rolling state only (before rolling dice)
    // Only if player does not own the cube and cube is not maxxed or already offered
    return (
      game.stateKind === 'rolling' &&
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
    return (
      game.stateKind === 'rolled-for-start' ||
      game.stateKind === 'rolling' ||
      game.stateKind === 'doubled'
    )
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
    return game.stateKind === 'moving'
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

      // Update players array to reflect winner status
      const updatedPlayers = game.players.map((p) =>
        p.id === winner.id ? winner : p
      ) as BackgammonPlayers

      return {
        ...game,
        stateKind: 'completed',
        winner: winner.id,
        players: updatedPlayers,
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

    // Update players array to reflect winner status
    const updatedPlayers = game.players.map((p) =>
      p.id === winner.id ? winner : p
    ) as BackgammonPlayers

    return {
      ...game,
      stateKind: 'completed',
      winner: winner.id,
      players: updatedPlayers,
    } as any // TODO: type as BackgammonGameCompleted
  }

  /**
   * Undo the last confirmed move within the current turn
   * This method finds the most recent confirmed move in activePlay.moves and reverses it
   * @param game - Current game state in 'moving' state with confirmed moves
   * @returns Result object with success/error and updated game state
   */
  public static undoLastMove = function undoLastMove(game: BackgammonGame): {
    success: boolean
    error?: string
    game?: BackgammonGame
    undoneMove?: any // BackgammonMove adapted for the interface
    remainingMoveHistory?: any[] // For compatibility with API interface
  } {
    // Validate game state - must be in 'moving' or 'moved' state for undo
    if (game.stateKind !== 'moving' && game.stateKind !== 'moved') {
      return {
        success: false,
        error: `Cannot undo move from ${game.stateKind} state. Must be in 'moving' or 'moved' state.`,
      }
    }

    const activePlay = game.activePlay
    if (!activePlay || !activePlay.moves) {
      return {
        success: false,
        error: 'No active play found',
      }
    }

    // Find completed moves in chronological order (array order IS execution order)
    const movesArray = Array.from(activePlay.moves)
    const completedMoves = movesArray.filter(
      (move) => move.stateKind === 'completed'
    )

    if (completedMoves.length === 0) {
      return {
        success: false,
        error: 'No completed moves available to undo',
      }
    }

    // Get the most recent completed move (last in array = most recently executed)
    const moveToUndo = completedMoves[completedMoves.length - 1]

    // Validate that the move actually moved a checker (not a 'no-move')
    if (
      moveToUndo.moveKind === 'no-move' ||
      !moveToUndo.origin ||
      !moveToUndo.destination
    ) {
      return {
        success: false,
        error: 'Cannot undo a no-move or invalid move',
      }
    }

    try {
      // Start with the current board (we'll create an immutable update)
      let updatedBoard = game.board

      // Get the containers involved in the move
      const originContainer = Board.getCheckerContainer(
        updatedBoard,
        moveToUndo.origin.id
      )
      const destinationContainer = Board.getCheckerContainer(
        updatedBoard,
        moveToUndo.destination.id
      )

      // Find the checker that was moved (should be the top checker at destination)
      const destinationCheckers = destinationContainer.checkers
      if (destinationCheckers.length === 0) {
        return {
          success: false,
          error: 'No checker found at destination to undo',
        }
      }

      // Get the moved checker (should be the last one added to destination)
      const movedChecker = destinationCheckers[destinationCheckers.length - 1]

      // Validate this is the player's checker
      if (movedChecker.color !== game.activePlayer.color) {
        return {
          success: false,
          error: 'Cannot undo - checker at destination is not yours',
        }
      }

      // Remove the checker from destination
      destinationContainer.checkers.pop()

      // Handle hit restoration if this was a hitting move
      // TODO: Future improvement - if moveToUndo.isHit is false but there are opponent checkers
      // on the bar, we could infer this was a hitting move and restore them. However, this
      // requires careful logic to avoid incorrect restorations in complex scenarios.
      if (moveToUndo.isHit && moveToUndo.destination.kind === 'point') {
        // Find the hit checker on the opponent's bar
        const opponentDirection =
          game.activePlayer.direction === 'clockwise'
            ? 'counterclockwise'
            : 'clockwise'
        const opponentBar = updatedBoard.bar[opponentDirection]

        // Find the most recently hit checker (should be last in bar)
        const hitCheckers = opponentBar.checkers.filter(
          (c: BackgammonChecker) => c.color !== game.activePlayer.color
        )
        if (hitCheckers.length > 0) {
          const hitChecker = hitCheckers[hitCheckers.length - 1]

          console.log(
            `🔄 Game.undoLastMove: Restoring hit checker ${hitChecker.id.slice(0, 8)} from ${opponentDirection} bar to ${moveToUndo.destination.kind}:${moveToUndo.destination.id}`
          )

          // Remove from bar
          const hitCheckerIndex = opponentBar.checkers.findIndex(
            (c: BackgammonChecker) => c.id === hitChecker.id
          )
          if (hitCheckerIndex !== -1) {
            opponentBar.checkers.splice(hitCheckerIndex, 1)

            // Restore to destination point
            destinationContainer.checkers.push({
              id: hitChecker.id,
              color: hitChecker.color,
              checkercontainerId: destinationContainer.id,
              isMovable: false,
            })
          }
        }
      }

      // Move the player's checker back to origin
      originContainer.checkers.push({
        id: movedChecker.id,
        color: movedChecker.color,
        checkercontainerId: originContainer.id,
        isMovable: false,
      })

      // Recalculate possible moves for the undone move based on restored board state
      const freshPossibleMoves = Board.getPossibleMoves(
        updatedBoard,
        game.activePlayer,
        moveToUndo.dieValue
      )

      // Update the move state back to 'ready' with recalculated possible moves
      const undoneMove = {
        ...moveToUndo,
        stateKind: 'ready' as const,
        moveKind: moveToUndo.moveKind, // Keep the original move kind for re-calculation
        origin: moveToUndo.origin, // Keep original origin for move generation
        destination: undefined, // Clear destination since move is undone
        isHit: false, // Reset hit flag
        possibleMoves: freshPossibleMoves, // Use freshly calculated possible moves
      }

      // Update the moves set: replace the confirmed move with the ready move
      const updatedMoves = new Set([
        ...movesArray.filter((m) => m.id !== moveToUndo.id),
        undoneMove,
      ])

      // When all moves are undone, recalculate possible moves for all ready moves
      let finalUpdatedMoves = updatedMoves
      const allMovesUndoneCheck = Array.from(updatedMoves).every(
        (move) => move.stateKind === 'ready'
      )

      if (allMovesUndoneCheck) {
        // Recalculate possible moves for all ready moves with the restored board state
        finalUpdatedMoves = new Set(
          Array.from(updatedMoves).map((move) => {
            if (move.stateKind === 'ready' && move.dieValue) {
              const freshPossibleMoves = Board.getPossibleMoves(
                updatedBoard,
                game.activePlayer,
                move.dieValue
              )
              return {
                ...move,
                possibleMoves: freshPossibleMoves,
              }
            }
            return move
          })
        )
      }

      // Update active play
      const updatedActivePlay = {
        ...activePlay,
        moves: finalUpdatedMoves,
      }

      // Recalculate pip counts after the undo
      console.log('🧮 Game.undoLastMove: Recalculating pip counts after undo')
      const updatedPlayers = Player.recalculatePipCounts({
        ...game,
        board: updatedBoard,
      })

      // Check if all moves have been undone (all moves are back to 'ready' state)
      const allMovesUndone = allMovesUndoneCheck

      // Use switch statement to handle state transitions after undo
      // Note: Undo is only allowed in 'moving' or 'moved' states per API validation
      const { newGameState, finalPlayers, clearActivePlay } = (() => {
        switch (game.stateKind) {
          case 'moved':
            // From 'moved', always go back to 'moving' to allow more moves
            return {
              newGameState: 'moving' as const,
              finalPlayers: updatedPlayers,
              clearActivePlay: false,
            }

          case 'moving':
            if (allMovesUndone) {
              // BACKGAMMON RULES FIX: All moves undone - reset to 'rolled' state with preserved dice
              // Player should NOT be able to roll dice again - they must use the same dice values
              console.log(
                '🔄 Game.undoLastMove: All moves undone from moving state, resetting to rolled (not rolling!)'
              )
              const resetPlayers = updatedPlayers.map((player) => {
                if (player.id === game.activePlayer.id) {
                  // DICE SWITCHING FIX: Preserve dice state from moves, not from stale player dice
                  // When dice have been switched, the moves reflect the correct switched dice values
                  // This fixes the bug where undo incorrectly reverts switched dice
                  const movesArray = Array.from(updatedActivePlay.moves)
                  const preservedCurrentRoll =
                    movesArray.length >= 2
                      ? ([movesArray[0].dieValue, movesArray[1].dieValue] as [
                          BackgammonDieValue,
                          BackgammonDieValue,
                        ])
                      : game.activePlayer.dice?.currentRoll

                  console.log(
                    '🎲 Game.undoLastMove: Preserving ORIGINAL dice state (supports dice switching):',
                    preservedCurrentRoll
                  )
                  return {
                    ...player,
                    dice: Dice.initialize(
                      player.color,
                      'rolled',
                      player.dice?.id,
                      preservedCurrentRoll
                    ),
                    stateKind: 'rolled' as const,
                  }
                } else {
                  return {
                    ...player,
                    dice: Dice.initialize(
                      player.color,
                      'inactive',
                      player.dice?.id
                    ),
                    stateKind: 'inactive' as const,
                  }
                }
              }) as BackgammonPlayers

              return {
                newGameState: 'rolled' as const,
                finalPlayers: resetPlayers,
                clearActivePlay: false, // CRITICAL FIX: Preserve activePlay with restored moves
              }
            } else {
              // Still have moves remaining - stay in 'moving'
              return {
                newGameState: 'moving' as const,
                finalPlayers: updatedPlayers,
                clearActivePlay: false,
              }
            }
        }
      })()

      // Return the updated game state
      const updatedGame = {
        ...game,
        stateKind: newGameState,
        board: updatedBoard,
        players: finalPlayers,
        activePlayer: finalPlayers.find(
          (p) => p.id === game.activePlayer.id
        ) as any,
        activePlay: clearActivePlay ? null : updatedActivePlay,
      } as BackgammonGame

      return {
        success: true,
        game: updatedGame,
        undoneMove: moveToUndo, // Return the move that was undone
        remainingMoveHistory: completedMoves.slice(0, -1), // All completed moves except the undone one
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to undo move: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Get possible moves for the current die value only (just-in-time calculation)
   * This method calculates moves for only the next available die to prevent stale references
   * Call this method after each move execution to get fresh moves based on current board state
   */
  public static getPossibleMoves = function getPossibleMoves(
    game: BackgammonGame
  ): {
    success: boolean
    error?: string
    possibleMoves?: BackgammonMoveSkeleton[]
    playerColor?: string
    updatedGame?: BackgammonGame
    currentDie?: number
  } {
    // Validate game state
    if (game.stateKind !== 'moving') {
      return {
        success: false,
        error: 'Game is not in a state where possible moves can be calculated',
      }
    }

    // Use the active player from the game object
    const targetPlayer = game.players.find((p) => p.color === game.activeColor)
    if (!targetPlayer) {
      return {
        success: false,
        error: 'Unable to determine active player',
      }
    }

    // Get activePlay and moves - handle case where game is in 'rolled' state after undo
    const activePlay = game.activePlay
    let movesArr: any[] = []
    let gameWithActivePlay: BackgammonGame = game

    if (!activePlay || !activePlay.moves) {
      // ARCHITECTURAL FIX: If no activePlay exists (e.g., after undo), create it from current dice roll
      if (game.stateKind === 'moving' && targetPlayer.dice?.currentRoll) {
        console.log(
          '[Game.getPossibleMoves] Creating activePlay for rolled state after undo'
        )

        // Create fresh activePlay structure directly using Play.initialize (same as Game.roll does)
        // Cast targetPlayer to correct type - it should be rolled since we checked dice state
        const playerRolled = targetPlayer as any // Type assertion since we verified dice state
        const newActivePlay = Play.initialize(game.board, playerRolled)
        const movingPlay = {
          ...newActivePlay,
          stateKind: 'moving' as const,
          player: playerRolled,
        }

        // Update the players array to ensure activePlayer is in correct state
        const updatedPlayers = game.players.map((p) =>
          p.id === targetPlayer.id ? { ...p, stateKind: 'moving' as const } : p
        )

        // Create updated game with the new activePlay
        gameWithActivePlay = {
          ...game,
          stateKind: 'moving' as const,
          activePlay: movingPlay,
          players: updatedPlayers,
          activePlayer: { ...targetPlayer, stateKind: 'moving' as const },
        } as any // Type assertion - we know the structure is correct

        if (movingPlay.moves) {
          movesArr = Array.isArray(movingPlay.moves)
            ? movingPlay.moves
            : Array.from(movingPlay.moves)
          console.log(
            `[Game.getPossibleMoves] Created activePlay with ${movesArr.length} moves from dice roll [${targetPlayer.dice.currentRoll.join(', ')}]`
          )
        } else {
          return {
            success: false,
            error: 'Failed to create moves in activePlay',
          }
        }
      } else {
        return {
          success: false,
          error:
            'No active play found and cannot create from current game state',
        }
      }
    } else {
      movesArr = Array.isArray(activePlay.moves)
        ? activePlay.moves
        : Array.from(activePlay.moves)
    }

    // CRITICAL FIX: Completely ignore stale activePlay.moves and calculate fresh moves
    // based on current board state and available dice values
    let possibleMoves: BackgammonMoveSkeleton[] = []
    let currentDie: number | undefined

    if (movesArr && movesArr.length > 0) {
      // Get dice values from moves that are still in 'ready' state (not yet used)
      const readyMoves = movesArr.filter((move) => move.stateKind === 'ready')
      const availableDice = readyMoves.map((move) => move.dieValue)

      // CRITICAL FIX: Only calculate moves for the FIRST available die to prevent stale references
      // This ensures moves are always fresh based on current board state
      // Robot will be called again after each move with updated board state
      currentDie = availableDice[0]

      if (currentDie) {
        // CRITICAL FIX: Always calculate completely fresh moves based on current board state
        // Ignore all cached moves - they may reference checkers that have been moved
        console.log(
          '[DEBUG] Game.getPossibleMoves calculating fresh moves for die',
          currentDie
        )

        possibleMoves = Board.getPossibleMoves(
          game.board,
          targetPlayer,
          currentDie as BackgammonDieValue
        )

        console.log(
          '[DEBUG] Game.getPossibleMoves calculated',
          possibleMoves.length,
          'fresh moves for die',
          currentDie
        )
      }

      // Auto-complete turn when no legal moves remain
      if (
        possibleMoves.length === 0 &&
        movesArr.every((m) => m.stateKind === 'ready')
      ) {
        logger.debug(
          `[Game] Auto-completing ${targetPlayer.isRobot ? 'robot' : 'human'} turn: no legal moves remain`
        )

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
        const nextColor = game.activeColor === 'white' ? 'black' : 'white'

        // ARCHITECTURAL FIX: Preserve activePlay in completed state for undo functionality
        // This allows undo button to remain visible with completed move data
        const preservedActivePlay = {
          ...completedActivePlay,
          stateKind: 'completed',
        }
        const updatedGame = {
          ...game,
          activePlay: preservedActivePlay,
          stateKind: 'rolling' as const,
          activeColor: nextColor,
        }

        // Update players: current becomes inactive, other becomes rolling
        const updatedPlayers = game.players.map((player) => {
          if (player.color === game.activeColor) {
            return { ...player, stateKind: 'inactive' as const }
          } else {
            return { ...player, stateKind: 'rolling' as const }
          }
        })

        const finalUpdatedGame = {
          ...updatedGame,
          players: updatedPlayers,
        } as unknown as BackgammonGame

        return {
          success: true,
          possibleMoves: [],
          playerColor: targetPlayer.color,
          updatedGame: finalUpdatedGame,
          currentDie: currentDie,
        }
      }
    }

    // Update movable checkers based on calculated possible moves
    const movableContainerIds: string[] = []
    for (const possibleMove of possibleMoves) {
      if (
        possibleMove.origin &&
        !movableContainerIds.includes(possibleMove.origin.id)
      ) {
        movableContainerIds.push(possibleMove.origin.id)
      }
    }

    const updatedBoard = Checker.updateMovableCheckers(
      gameWithActivePlay.board,
      movableContainerIds
    )

    const finalGameWithActivePlay = {
      ...gameWithActivePlay,
      board: updatedBoard,
    }

    return {
      success: true,
      possibleMoves,
      playerColor: targetPlayer.color,
      updatedGame: finalGameWithActivePlay,
      currentDie: currentDie,
    }
  }

  /**
   * Async wrapper for confirmTurn that handles robot automation
   * @param game - Game in 'moving' state
   * @returns Promise<BackgammonGame> - Updated game state with robot automation if needed
   */
  public static confirmTurnWithRobotAutomation =
    async function confirmTurnWithRobotAutomation(
      game: BackgammonGameMoved
    ): Promise<BackgammonGame> {
      // Call the pure sync function first
      const confirmedGame = Game.confirmTurn(game)

      // Check if the next player is a robot and handle automation
      if (confirmedGame.activePlayer?.isRobot) {
        try {
          // Dynamic import to avoid circular dependencies
          // Robot automation moved to @nodots-llc/backgammon-robots package

          // Robot automation is now external - return game as-is
          logger.info('🤖 Robot automation is now handled externally')
          return confirmedGame
        } catch (error) {
          logger.error(
            '🤖 Robot automation error during turn transition (confirmTurn):',
            error
          )
          // Return original game state if robot automation throws
          return confirmedGame
        }
      }

      return confirmedGame
    }

  // processRobotTurn method removed - now handled by @nodots-llc/backgammon-robots package

  /**
   * Execute doubling action from rolling state (before rolling dice)
   * Transitions from 'rolling' to 'doubled' state and offers double to opponent
   */
  public static double = function double(
    game: BackgammonGameRolling
  ): BackgammonGameDoubled {
    if (game.stateKind !== 'rolling') {
      throw new Error(
        `Cannot double from ${game.stateKind} state. Must be in 'rolling' state.`
      )
    }

    if (!Game.canOfferDouble(game, game.activePlayer)) {
      throw new Error('Doubling is not allowed in current game state')
    }

    const { activePlayer, cube } = game

    // Calculate new cube value - initial doubling sets cube to 2
    const newValue = (
      cube.value ? Math.min(cube.value * 2, 64) : 2
    ) as BackgammonCubeValue

    // Create updated cube in 'offered' state (waiting for opponent response)
    const updatedCube = {
      ...cube,
      stateKind: 'offered' as const,
      value: newValue,
      offeredBy: activePlayer,
    }

    // Convert active player to doubled state
    const doubledPlayer = {
      ...activePlayer,
      stateKind: 'doubled' as const,
      dice: {
        ...activePlayer.dice,
        stateKind: 'rolled' as const,
      },
    } as BackgammonPlayerDoubled

    // Update players array
    const updatedPlayers = game.players.map((p) =>
      p.id === activePlayer.id ? doubledPlayer : p
    ) as BackgammonPlayers

    // Update game statistics if they exist
    const updatedStatistics = game.statistics
      ? {
          ...game.statistics,
          totalDoubles: game.statistics.totalDoubles + 1,
          cubeHistory: [
            ...game.statistics.cubeHistory,
            {
              turn: game.statistics.totalRolls,
              value: newValue || 2,
              offeredBy: activePlayer.color,
              accepted: false, // Not yet accepted - just offered
            },
          ],
        }
      : undefined

    // Return game in 'doubled' state (waiting for opponent to accept/refuse)
    return {
      ...game,
      stateKind: 'doubled',
      cube: updatedCube,
      players: updatedPlayers,
      activePlayer: doubledPlayer,
      statistics: updatedStatistics,
    } as BackgammonGameDoubled
  }
}
