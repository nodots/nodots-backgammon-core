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
  BackgammonMoveSkeleton,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerActive,
  BackgammonPlayerDoubled,
  BackgammonPlayerInactive,
  BackgammonPlayerMoving,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayerRollingForStart,
  BackgammonPlayers,
  BackgammonPlayerWinner,
  BackgammonPlayMoving,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types'
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
// Import tuple aliases from types package
import type {
  BackgammonGameCompleted,
  BackgammonPlayersMovingTuple,
  BackgammonPlayersRolledForStartTuple,
  BackgammonPlayersRollingForStartTuple,
  BackgammonPlayersRollingTuple,
} from '@nodots-llc/backgammon-types'
import { RESTORABLE_GAME_STATE_KINDS } from '@nodots-llc/backgammon-types'

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
      players:
        playersWithCorrectPipCounts as BackgammonPlayersRollingForStartTuple,
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
  // Overloads by stateKind for typed returns
  public static initialize(
    players: BackgammonPlayers,
    id?: string,
    stateKind?: 'rolling-for-start',
    board?: BackgammonBoard,
    cube?: BackgammonCube,
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayer,
    inactivePlayer?: BackgammonPlayer
  ): BackgammonGameRollingForStart
  public static initialize(
    players: BackgammonPlayersRolledForStartTuple,
    id: string | undefined,
    stateKind: 'rolled-for-start',
    board: BackgammonBoard,
    cube: BackgammonCube,
    activePlay: undefined,
    activeColor: BackgammonColor,
    activePlayer: BackgammonPlayerRolledForStart,
    inactivePlayer: BackgammonPlayerRolledForStart
  ): BackgammonGameRolledForStart
  public static initialize(
    players: BackgammonPlayers,
    id: string | undefined,
    stateKind: 'rolling',
    board: BackgammonBoard,
    cube: BackgammonCube,
    activePlay: undefined,
    activeColor: BackgammonColor,
    activePlayer: BackgammonPlayerRolling,
    inactivePlayer: BackgammonPlayerInactive
  ): BackgammonGameRolling
  public static initialize(
    players: BackgammonPlayers,
    id: string | undefined,
    stateKind: 'rolling',
    board: BackgammonBoard | undefined,
    cube: BackgammonCube | undefined,
    activePlay: undefined,
    activeColor: BackgammonColor,
    activePlayer: BackgammonPlayerRolling,
    inactivePlayer: BackgammonPlayerInactive
  ): BackgammonGameRolling
  public static initialize(
    players: BackgammonPlayers,
    id: string | undefined,
    stateKind: 'moving',
    board: BackgammonBoard,
    cube: BackgammonCube,
    activePlay: BackgammonPlayMoving,
    activeColor: BackgammonColor,
    activePlayer: BackgammonPlayerMoving,
    inactivePlayer: BackgammonPlayerInactive
  ): BackgammonGameMoving
  // Broad overload to accommodate test helpers using defaults
  public static initialize(
    players: BackgammonPlayers,
    id?: string,
    stateKind?: BackgammonGameStateKind,
    board?: BackgammonBoard,
    cube?: BackgammonCube,
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayer,
    inactivePlayer?: BackgammonPlayer
  ): BackgammonGame
  public static initialize(
    players: BackgammonPlayers,
    id: string | undefined,
    stateKind: 'moving',
    board: BackgammonBoard | undefined,
    cube: BackgammonCube | undefined,
    activePlay: BackgammonPlayMoving,
    activeColor: BackgammonColor,
    activePlayer: BackgammonPlayerMoving,
    inactivePlayer: BackgammonPlayerInactive
  ): BackgammonGameMoving
  public static initialize(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayer,
    inactivePlayer?: BackgammonPlayer
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
      // Ensure tuple order is [active, inactive] for stricter typing
      players: [
        activePlayer,
        inactivePlayer,
      ] as BackgammonPlayersRolledForStartTuple,
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
        const allMovesCompleted = activePlay.moves.every(
          (m) => m.stateKind === 'completed'
        )

        // CRITICAL FIX: Validate that the correct number of moves exist before auto-completing
        const expectedMoveCount = currentRoll[0] === currentRoll[1] ? 4 : 2 // doubles vs regular roll
        const actualMoveCount = activePlay.moves.length

        if (allMovesCompleted && actualMoveCount === expectedMoveCount) {
          debug(
            'Game.roll: All moves auto-completed - no legal moves available, transitioning to moved state',
            { expectedMoveCount, actualMoveCount, currentRoll }
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
        } else if (allMovesCompleted && actualMoveCount !== expectedMoveCount) {
          // BUG DETECTED: Moves are completed but count doesn't match expected dice
          debug(
            'Game.roll: BUG - Move count mismatch detected, staying in moving state to allow proper move generation',
            {
              expectedMoveCount,
              actualMoveCount,
              currentRoll,
              moveStates: activePlay.moves.map((m) => ({
                id: m.id.slice(0, 8),
                stateKind: m.stateKind,
                dieValue: m.dieValue,
              })),
            }
          )
          // Force stay in moving state - this prevents stuck games
        }

        // Update the board with movable checkers
        const movableContainerIds: string[] = []
        const movesArray = activePlay.moves
        for (const move of movesArray) {
          switch (move.stateKind) {
            case 'ready': {
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
            }
            case 'completed':
            case 'confirmed':
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
          players: [
            movingPlayer,
            unrolledPlayer,
          ] as BackgammonPlayersMovingTuple,
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
        const [activePlayerForColor, inactivePlayerForColor] =
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
        const allMovesCompleted = activePlay.moves.every(
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
        const movesArray = activePlay.moves
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
              // These moves don't have movable checkers
              break
          }
        }
        const updatedBoard = Checker.updateMovableCheckers(
          board,
          movableContainerIds
        )

        // Update the players array to include the rolled player
        const updatedPlayers = [
          playerRolled,
          inactivePlayer,
        ] as BackgammonPlayersMovingTuple

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
        const allMovesCompleted = activePlay.moves.every(
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
        const movesArray = activePlay.moves
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
          ? game.activePlay.moves.every(
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
                const movesArray = activePlay.moves
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
                      ) as BackgammonMoveSkeleton[]
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

                  return regeneratedMoves
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
  ): BackgammonGameMoving | BackgammonGameMoved | BackgammonGameCompleted {
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
      const movesArray = updatedActivePlay.moves as any[]
      for (const move of movesArray) {
        switch (move.stateKind) {
          case 'ready': {
            // Recalculate fresh possible moves for this die value on the current board state
            const freshPossibleMoves = Board.getPossibleMoves(
              board,
              updatedActivePlay.player,
              move.dieValue
            ) as BackgammonMoveSkeleton[]

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
          }
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
      ) as import('@nodots-llc/backgammon-types').BackgammonPlayers,
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
    const hasWon =
      playerCheckersOff === 15 || // Primary condition: all checkers in off area
      (playerCheckersOnBoard === 0 && playerCheckersOff > 0) || // Backup: no checkers on board + some off
      (movedPlayer.pipCount === 0 && lastMoveKind === 'bear-off') // Tertiary: pip count zero after bear-off

    if (hasWon) {
      logger.info(
        `🎉 [Game] PLAYER ${movedPlayer.color.toUpperCase()} HAS WON! (${playerCheckersOff} checkers off, ${playerCheckersOnBoard} on board)`
      )

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

    const movesArray = activePlay.moves
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

    // Check if turn should be completed (for both human and robot players)
    const gameAfterTurnCheck = Game.checkAndCompleteTurn(movingGame)

    // For robot players, auto-confirm the turn if it transitioned to 'moved'
    if (
      movingGame.activePlayer.isRobot &&
      gameAfterTurnCheck.stateKind === 'moved'
    ) {
      console.log('[DEBUG] 🤖 Robot turn completed, auto-confirming turn')
      return Game.confirmTurn(gameAfterTurnCheck as BackgammonGameMoved)
    }

    // Return the game (either still 'moving' or transitioned to 'moved')
    if (gameAfterTurnCheck.stateKind === 'moved') {
      console.log('[DEBUG] Turn completed, transitioned to moved state')
      return gameAfterTurnCheck
    }

    // CRITICAL FIX: After executing a move, the activePlay.moves now contains fresh possibleMoves
    // for all remaining ready moves thanks to the fix in Play.move()
    // The movingGame already has the updated board state and refreshed activePlay

    console.log(
      '[DEBUG] Game.executeAndRecalculate: Move executed successfully, returning updated game with fresh activePlay'
    )

    // Turn continues, return the game with fresh board state and updated activePlay
    return gameAfterTurnCheck
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
    // Use discriminated union pattern for turn completion states
    type TurnCompletionState =
      | { type: 'invalid-game' }
      | { type: 'no-active-play' }
      | { type: 'moves-incomplete'; completedCount: number; totalCount: number }
      | {
          type: 'all-moves-completed'
          moves: Array<{
            id: string
            dieValue: number
            stateKind: string
            moveKind: string
          }>
        }

    // Determine current turn completion state
    const getTurnCompletionState = (): TurnCompletionState => {
      // Validate game structure first
      if (!game?.activePlayer?.color) {
        return { type: 'invalid-game' }
      }

      const activePlay = game.activePlay
      if (!activePlay?.moves) {
        return { type: 'no-active-play' }
      }

      const movesArray = activePlay.moves
      const completedMoves = movesArray.filter(
        (move) => move.stateKind === 'completed'
      )

      if (completedMoves.length === movesArray.length) {
        return {
          type: 'all-moves-completed',
          moves: movesArray.map((m) => ({
            id: m.id,
            dieValue: m.dieValue,
            stateKind: m.stateKind,
            moveKind: m.moveKind,
          })),
        }
      }

      return {
        type: 'moves-incomplete',
        completedCount: completedMoves.length,
        totalCount: movesArray.length,
      }
    }

    const turnState = getTurnCompletionState()

    // Log debug info only after validation
    if (turnState.type !== 'invalid-game') {
      logger.info(
        '🔍 checkAndCompleteTurn called for player:',
        game.activePlayer.color,
        game.activePlayer.isRobot ? '(robot)' : '(human)'
      )
    }

    // State machine using switch on discriminated union
    switch (turnState.type) {
      case 'invalid-game': {
        logger.warn('❌ Invalid game structure, returning original game')
        return game
      }
      case 'no-active-play': {
        logger.info('❌ No active play or moves, returning original game')
        return game
      }
      case 'moves-incomplete': {
        logger.info(
          `⏳ Turn incomplete: ${turnState.completedCount}/${turnState.totalCount} moves completed`
        )
        return game
      }

      case 'all-moves-completed':
        logger.info(
          '✅ All moves completed, attempting transition to moved state'
        )
        logger.info(
          '📋 Move details:',
          turnState.moves.map((m) => `${m.dieValue}:${m.stateKind}`)
        )

        try {
          const movedGame = Game.toMoved(game)
          logger.info('🎯 Successfully transitioned to moved state')
          return movedGame
        } catch (error) {
          logger.error('💥 Error in toMoved transition:', error)
          logger.error('📊 Game state:', game.stateKind)
          logger.error('📊 Moves details:', turnState.moves)
          return game
        }

      default:
        // TypeScript exhaustiveness check ensures we handle all cases
        const _exhaustive: never = turnState
        return game
    }
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
      players: [
        newActivePlayerWithPips as BackgammonPlayerRolling,
        newInactivePlayerWithPips,
      ] as BackgammonPlayersRollingTuple,
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
        const movesArray = movingGame.activePlay.moves
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
          const gameMoving = currentGame as BackgammonGameMoving

          if (!gameMoving.activePlay) {
            return currentGame // No active play, turn complete
          }

          // Get all moves from activePlay
          const movesArray = gameMoving.activePlay.moves
          const readyMoves = movesArray.filter(
            (move) => move.stateKind === 'ready'
          )

          // Debug logging to understand the issue
          logger.info('🤖 Robot turn - moves state:', {
            totalMoves: movesArray.length,
            readyMoves: readyMoves.length,
            completedMoves: movesArray.filter(
              (m) => m.stateKind === 'completed'
            ).length,
            moveDetails: movesArray.map((m) => ({
              dieValue: m.dieValue,
              stateKind: m.stateKind,
              moveKind: m.moveKind,
            })),
          })

          // Check for turn completion conditions
          const allMovesCompleted = movesArray.every(
            (move) => move.stateKind === 'completed'
          )

          if (readyMoves.length === 0 || allMovesCompleted) {
            // No ready moves available OR all moves are completed (including no-moves)
            // Transition to 'moved' state and auto-confirm turn
            logger.info('🤖 No ready moves or all completed, ending turn')
            const movedGame = Game.toMoved(gameMoving)
            return Game.confirmTurn(movedGame)
          }

          // Use Player.getBestMove to select the optimal move
          // CRITICAL FIX: Use gameMoving.activePlay to ensure we have the correct activePlay
          logger.info(
            '🤖 Calling Player.getBestMove with',
            readyMoves.length,
            'ready moves'
          )
          const selectedMove = await Player.getBestMove(
            gameMoving.activePlay,
            gameMoving.activePlayer.userId
          )

          if (!selectedMove) {
            logger.warn('🤖 Player.getBestMove failed to select a move')
            logger.info(
              '🤖 Ready moves available but getBestMove returned null:',
              {
                readyMovesCount: readyMoves.length,
                readyMoveDetails: readyMoves.map((m) => ({
                  dieValue: m.dieValue,
                  moveKind: m.moveKind,
                  possibleMovesCount: m.possibleMoves?.length || 0,
                })),
              }
            )

            // CRITICAL FIX: When Player.getBestMove fails, complete the turn instead of leaving stuck
            // This handles edge cases where AI cannot select a move but moves are available
            logger.warn(
              '🤖 Completing turn due to move selection failure to prevent stuck game'
            )
            const movedGame = Game.toMoved(gameMoving)
            return Game.confirmTurn(movedGame)
          }

          // Extract checker ID from the selected move's first possible move
          const checkerId =
            selectedMove.possibleMoves?.[0]?.origin?.checkers?.[0]?.id

          if (!checkerId) {
            logger.warn('🤖 Unable to extract checker ID from selected move')
            logger.info('🤖 Selected move details:', {
              selectedMoveId: selectedMove.id,
              possibleMovesCount: selectedMove.possibleMoves?.length || 0,
              hasOrigin: !!selectedMove.possibleMoves?.[0]?.origin,
              originCheckersCount:
                selectedMove.possibleMoves?.[0]?.origin?.checkers?.length || 0,
            })

            // CRITICAL FIX: When checker ID extraction fails, complete the turn instead of leaving stuck
            logger.warn(
              '🤖 Completing turn due to checker ID extraction failure to prevent stuck game'
            )
            const movedGame = Game.toMoved(gameMoving)
            return Game.confirmTurn(movedGame)
          }

          // Execute the move
          try {
            currentGame = Game.move(currentGame, checkerId)
            moveCount++

            logger.info(
              `Robot executed move ${moveCount} with checker ${checkerId}`
            )
          } catch (error) {
            logger.error('🤖 Error executing robot move:', error)
            logger.warn(
              '🤖 Completing turn due to move execution error to prevent stuck game'
            )

            // CRITICAL FIX: When move execution fails, complete the turn instead of leaving stuck
            const movedGame = Game.toMoved(gameMoving)
            return Game.confirmTurn(movedGame)
          }
        }

        // Handle final state transitions
        switch (currentGame.stateKind) {
          case 'moving': {
            const gameMoving = currentGame as BackgammonGameMoving
            if (!gameMoving.activePlay) return currentGame

            const movesArray = gameMoving.activePlay.moves
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

  /**
   * Restores a game to a previous state
   * This is the new architecture for state restoration - CORE validates but doesn't manage history
   * @param state Complete game state to restore to
   * @returns Validated game state
   */
  public static restoreState = function restoreState(
    state: BackgammonGame
  ): BackgammonGame {
    // Validate that this is a valid game state
    if (!state) {
      throw new Error('Cannot restore: state is null or undefined')
    }

    if (!state.stateKind) {
      throw new Error('Cannot restore: invalid state - missing stateKind')
    }

    if (!state.players || state.players.length !== 2) {
      throw new Error('Cannot restore: invalid state - must have exactly 2 players')
    }

    if (!state.board) {
      throw new Error('Cannot restore: invalid state - missing board')
    }

    if (!state.cube) {
      throw new Error('Cannot restore: invalid state - missing cube')
    }

    // Validate state kind is one of the known restorable states from TYPES
    if (!RESTORABLE_GAME_STATE_KINDS.includes(state.stateKind)) {
      throw new Error(`Cannot restore: invalid stateKind '${state.stateKind}'`)
    }

    // State is valid - return it
    // Note: We return the state as-is because it's already a complete, valid game state
    // The API layer is responsible for persisting this state
    logger.info(`State restored successfully to ${state.stateKind}`)
    return state
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

  // undoLastMove removed - use database-driven state restoration via API endpoints instead

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
