import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonGame,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPoint,
  failure,
  GameEndActionData,
  GameHistory,
  GameHistoryAction,
  GameStartActionData,
  GameStateSnapshot,
  HistoryExportResult,
  MakeMoveActionData,
  Result,
  RollDiceActionData,
  success,
  XGExportOptions,
  XGGameRecord,
  XGMatch,
  XGMatchHeader,
  XGMove,
  XGMoveRecord,
} from '@nodots/backgammon-types'
import { Board, exportToGnuPositionId } from '../../src/Board'
import { XGConverter, XGParser, XGSerializer } from '../XG'
import { GameHistoryService, HistoryState } from './GameHistoryService'
// Note: Using local createGameSnapshot function instead of SnapshotService.createSnapshot
// for better control over board state tracking during XG import

// Pure data structures for XG conversion
export interface XGConversionState {
  readonly historyState: HistoryState
}

export interface ExportGameParams {
  readonly gameId: string
  readonly options: XGExportOptions
}

export interface ImportXGParams {
  readonly xgContent: string
  readonly preserveAnalysis: boolean
}

export interface ExportMultipleParams {
  readonly gameIds: readonly string[]
  readonly matchName: string
  readonly options: XGExportOptions
}

// Pure function to export game history to XG format
export const exportGameHistoryToXG = async (
  state: XGConversionState,
  params: ExportGameParams
): Promise<Result<HistoryExportResult, string>> => {
  try {
    const { gameId, options } = params

    // Get the complete game history using functional service
    const gameHistoryOption = GameHistoryService.getGameHistory(
      state.historyState,
      gameId
    )

    // Use traditional conditional instead of match for Option type
    if (gameHistoryOption === null) {
      return failure(`Game history not found for game ${gameId}`)
    }

    const gameHistory = gameHistoryOption as unknown as GameHistory

    // Convert history to XG match using pure functions
    const xgMatchResult = await gameHistoryToXGMatch(gameHistory, options)

    // Use traditional conditional instead of match for Result type
    if (!xgMatchResult.success) {
      return failure(xgMatchResult.error)
    }

    // Serialize to XG format
    const xgContent = XGSerializer.serialize(xgMatchResult.data)

    const result: HistoryExportResult = {
      format: 'xg',
      data: xgContent,
      filename: `game-${gameId}-${Date.now()}.xg`,
      size: xgContent.length,
    }

    return success(result)
  } catch (error) {
    return failure(
      `Failed to export game history: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to import XG file and create complete game history
export const importXGToGameHistory = async (
  state: XGConversionState,
  params: ImportXGParams
): Promise<
  Result<
    {
      success: boolean
      gameIds: readonly string[]
      errors: readonly string[]
      warnings: readonly string[]
      newState: HistoryState
    },
    string
  >
> => {
  try {
    const { xgContent, preserveAnalysis } = params

    // Parse XG content
    const parseResult = XGParser.parse(xgContent)

    // Use traditional conditional instead of match for parse result
    if (!parseResult.success) {
      return success({
        success: false,
        gameIds: [],
        errors: parseResult.errors.map((e) => e.message),
        warnings: parseResult.warnings,
        newState: state.historyState,
      })
    }

    // Check if parse result has data
    if (!parseResult.data) {
      return success({
        success: false,
        gameIds: [],
        errors: ['No data in parse result'],
        warnings: parseResult.warnings,
        newState: state.historyState,
      })
    }

    // Convert each XG game to game history using pure functions
    const conversionResults = await Promise.all(
      parseResult.data.games.map((xgGame) =>
        xgGameToGameHistory(xgGame, parseResult.data!.header, preserveAnalysis)
      )
    )

    // Separate successes from failures
    const successes = conversionResults
      .filter((r) => r.success)
      .map((r) => r.data!)
    const failures = conversionResults
      .filter((r) => !r.success)
      .map((r) => r.error)

    // Apply all successful conversions to the history state
    let newHistoryState = state.historyState
    const gameIds: string[] = []

    for (const gameHistoryData of successes) {
      // Record each action using the functional service
      // NOTE: Each action now has its own proper gameStateBefore and gameStateAfter
      // that reflect the board state at that point in the game
      for (const action of gameHistoryData.actions) {
        const recordResult = await GameHistoryService.recordAction(
          newHistoryState,
          {
            gameId: action.gameId,
            playerId: action.playerId,
            actionType: action.actionType,
            actionData: action.actionData,
            gameStateBefore: action.gameStateBefore,
            gameStateAfter: action.gameStateAfter,
            metadata: action.metadata,
          }
        )

        if (recordResult.success) {
          newHistoryState = recordResult.data.newState
        }
      }
      gameIds.push(gameHistoryData.gameId)
    }

    return success({
      success: failures.length === 0,
      gameIds,
      errors: failures,
      warnings: parseResult.warnings,
      newState: newHistoryState,
    })
  } catch (error) {
    return failure(
      `Failed to import XG content: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to export multiple game histories to a single XG match file
export const exportMultipleGamesToXG = async (
  state: XGConversionState,
  params: ExportMultipleParams
): Promise<Result<HistoryExportResult, string>> => {
  try {
    const { gameIds, matchName, options } = params

    // Use traditional conditional instead of match for length check
    if (gameIds.length === 0) {
      return failure('No games provided for export')
    }

    // Get all game histories
    const gameHistories = gameIds
      .map((gameId) => ({
        gameId,
        history: GameHistoryService.getGameHistory(state.historyState, gameId),
      }))
      .filter(({ history }) => history !== null) // Keep only found histories
      .map(({ gameId, history }) => ({
        gameId,
        history: history as unknown as GameHistory,
      }))

    // Use traditional conditional instead of match for length check
    if (gameHistories.length === 0) {
      return failure('No valid game histories found')
    }

    // Convert each game history to XG game using pure functions
    const xgGameResults = await Promise.all(
      gameHistories.map(({ history }, index) =>
        gameHistoryToXGGame(history, index + 1, { player1: 0, player2: 0 })
      )
    )

    // Check for conversion failures
    const failures = xgGameResults.filter((r) => !r.success)
    if (failures.length > 0) {
      return failure(
        `Failed to convert ${failures.length} games: ${failures[0].error}`
      )
    }

    const xgGames = xgGameResults.filter((r) => r.success).map((r) => r.data!)
    const firstHistory = gameHistories[0].history

    // Create XG match using pure functions
    const header = createXGMatchHeader(
      firstHistory,
      matchName,
      gameHistories.map(({ gameId }) => gameId)
    )

    const finalScore = calculateFinalScore(xgGames)

    const xgMatch: XGMatch = {
      header,
      matchLength: 0, // Money game
      games: xgGames,
      metadata: {
        totalGames: xgGames.length,
        finalScore,
        parsedAt: new Date(),
        fileSize: 0,
      },
    }

    // Serialize to XG format
    const xgContent = XGSerializer.serialize(xgMatch)

    const result: HistoryExportResult = {
      format: 'xg',
      data: xgContent,
      filename: `${matchName}-${Date.now()}.xg`,
      size: xgContent.length,
    }

    return success(result)
  } catch (error) {
    return failure(
      `Failed to export multiple games: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure helper functions

const gameHistoryToXGMatch = async (
  gameHistory: GameHistory,
  options: XGExportOptions
): Promise<Result<XGMatch, string>> => {
  const playerNames: [string, string] = [
    gameHistory.metadata.players.white.userId,
    gameHistory.metadata.players.black.userId,
  ]

  const xgGameResult = await gameHistoryToXGGame(gameHistory, 1, {
    player1: 0,
    player2: 0,
  })

  // Use traditional conditional instead of match for Result type
  if (!xgGameResult.success) {
    return failure(xgGameResult.error)
  }

  const xgGame = xgGameResult.data!

  const header = createXGMatchHeaderFromHistory(gameHistory, playerNames)

  const xgMatch: XGMatch = {
    header,
    matchLength: 0,
    games: [xgGame],
    metadata: {
      totalGames: 1,
      finalScore: xgGame.finalScore,
      parsedAt: new Date(),
      fileSize: 0,
    },
  }

  return success(xgMatch)
}

const gameHistoryToXGGame = async (
  gameHistory: GameHistory,
  gameNumber: number,
  initialScore: { player1: number; player2: number }
): Promise<Result<XGGameRecord, string>> => {
  try {
    const moveRecords: XGMoveRecord[] = []
    let moveNumber = 1

    // Convert history actions to XG moves using pure functions
    for (const action of gameHistory.actions) {
      const xgMoveRecord = historyActionToXGMoveRecord(action, moveNumber)
      if (xgMoveRecord) {
        moveRecords.push(xgMoveRecord)
        moveNumber++
      }
    }

    // Determine winner and points from game end action using functional patterns
    const gameEndAction = gameHistory.actions.find(
      (a) => a.actionType === 'game-end'
    )

    // Use traditional conditional instead of match for boolean check
    let winnerAndPoints: { winner: 1 | 2; pointsWon: number }
    if (!gameEndAction) {
      winnerAndPoints = { winner: 1, pointsWon: 1 }
    } else {
      const endData = gameEndAction.actionData.data as GameEndActionData
      winnerAndPoints = {
        winner: endData.winner === 'white' ? 1 : 2,
        pointsWon: endData.points,
      }
    }

    const finalScore = calculateUpdatedScore(
      initialScore,
      winnerAndPoints.winner,
      winnerAndPoints.pointsWon
    )

    const xgGame: XGGameRecord = {
      gameNumber,
      initialScore,
      moves: moveRecords,
      winner: winnerAndPoints.winner,
      pointsWon: winnerAndPoints.pointsWon,
      finalScore,
    }

    return success(xgGame)
  } catch (error) {
    return failure(
      `Failed to convert game history to XG game: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// ============================================================================
// Board State Tracking Helper Functions (Issue #213 Fix)
// ============================================================================

/**
 * Deep clone a board to avoid mutating the original
 */
const cloneBoard = (board: BackgammonBoard): BackgammonBoard => {
  return {
    id: board.id,
    points: board.points.map(p => ({
      id: p.id,
      kind: p.kind,
      position: { ...p.position },
      checkers: p.checkers.map(c => ({ ...c })),
    })) as BackgammonBoard['points'],
    bar: {
      clockwise: {
        ...board.bar.clockwise,
        checkers: board.bar.clockwise.checkers.map(c => ({ ...c })),
      },
      counterclockwise: {
        ...board.bar.counterclockwise,
        checkers: board.bar.counterclockwise.checkers.map(c => ({ ...c })),
      },
    },
    off: {
      clockwise: {
        ...board.off.clockwise,
        checkers: board.off.clockwise.checkers.map(c => ({ ...c })),
      },
      counterclockwise: {
        ...board.off.counterclockwise,
        checkers: board.off.counterclockwise.checkers.map(c => ({ ...c })),
      },
    },
  }
}

/**
 * Create a GameStateSnapshot from game and current board state
 */
const createGameSnapshot = (
  game: BackgammonGame,
  board: BackgammonBoard,
  activeColor: BackgammonColor
): GameStateSnapshot => {
  // Create board positions from current board state
  const boardPositions: { [position: string]: { id: string; color: BackgammonColor }[] } = {}

  // Capture points
  for (const point of board.points) {
    const posKey = `${point.position.clockwise}`
    if (point.checkers.length > 0) {
      boardPositions[posKey] = point.checkers.map(c => ({
        id: c.id,
        color: c.color,
      }))
    }
  }

  // Capture bar positions
  if (board.bar.clockwise.checkers.length > 0) {
    boardPositions['bar-clockwise'] = board.bar.clockwise.checkers.map(c => ({
      id: c.id,
      color: c.color,
    }))
  }
  if (board.bar.counterclockwise.checkers.length > 0) {
    boardPositions['bar-counterclockwise'] = board.bar.counterclockwise.checkers.map(c => ({
      id: c.id,
      color: c.color,
    }))
  }

  // Capture off positions
  if (board.off.clockwise.checkers.length > 0) {
    boardPositions['off-clockwise'] = board.off.clockwise.checkers.map(c => ({
      id: c.id,
      color: c.color,
    }))
  }
  if (board.off.counterclockwise.checkers.length > 0) {
    boardPositions['off-counterclockwise'] = board.off.counterclockwise.checkers.map(c => ({
      id: c.id,
      color: c.color,
    }))
  }

  // Generate gnuPositionId for this board state
  let gnuPositionId: string | undefined
  try {
    // Create a minimal game-like object for gnuPositionId generation
    const gameForPositionId = {
      ...game,
      board,
      activeColor,
    }
    gnuPositionId = exportToGnuPositionId(gameForPositionId as BackgammonGame)
  } catch {
    gnuPositionId = undefined
  }

  return {
    stateKind: 'moving',
    activeColor,
    boardPositions,
    diceState: {
      black: { stateKind: 'inactive' },
      white: { stateKind: 'inactive' },
    },
    cubeState: { value: 1, stateKind: 'centered' },
    playerStates: {
      black: {
        pipCount: 0,
        stateKind: activeColor === 'black' ? 'active' : 'inactive',
        isRobot: false,
        userId: '',
        direction: 'counterclockwise',
      },
      white: {
        pipCount: 0,
        stateKind: activeColor === 'white' ? 'active' : 'inactive',
        isRobot: false,
        userId: '',
        direction: 'clockwise',
      },
    },
    gnuPositionId,
    moveCount: 0,
    turnCount: 0,
  }
}

/**
 * Apply an XG move to a board and return the updated board
 * Uses player direction to correctly translate XG coordinates
 */
const applyXGMoveToBoard = (
  board: BackgammonBoard,
  xgMove: XGMove,
  direction: BackgammonMoveDirection,
  playerColor: BackgammonColor
): { success: boolean; board: BackgammonBoard; isHit: boolean } => {
  try {
    const clonedBoard = cloneBoard(board)

    // Convert XG positions to board positions using player direction
    // XG uses 1-24 for points, 25 for bar, 0 for off
    const fromXG = xgMove.from
    const toXG = xgMove.to

    // Find origin container
    let originContainer: BackgammonPoint | typeof board.bar.clockwise | null = null
    if (fromXG === 25) {
      // Bar - use player's direction
      originContainer = clonedBoard.bar[direction]
    } else if (fromXG >= 1 && fromXG <= 24) {
      // Find point by player's directional position
      originContainer = clonedBoard.points.find(p => p.position[direction] === fromXG) || null
    }

    // Find destination container
    let destContainer: BackgammonPoint | typeof board.off.clockwise | null = null
    if (toXG === 0) {
      // Off - use player's direction
      destContainer = clonedBoard.off[direction]
    } else if (toXG >= 1 && toXG <= 24) {
      // Find point by player's directional position
      destContainer = clonedBoard.points.find(p => p.position[direction] === toXG) || null
    }

    if (!originContainer || !destContainer) {
      return { success: false, board, isHit: false }
    }

    // Check for hit (opponent checker on destination point)
    let isHit = false
    if ('position' in destContainer && typeof destContainer.position === 'object') {
      // It's a point
      const destPoint = destContainer as BackgammonPoint
      if (destPoint.checkers.length === 1 && destPoint.checkers[0].color !== playerColor) {
        isHit = true
        // Move hit checker to opponent's bar
        const hitChecker = destPoint.checkers[0]
        const opponentDirection = direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
        clonedBoard.bar[opponentDirection].checkers.push({
          ...hitChecker,
          checkercontainerId: clonedBoard.bar[opponentDirection].id,
        })
        destPoint.checkers = []
      }
    }

    // Remove checker from origin
    if (originContainer.checkers.length > 0) {
      const movingChecker = originContainer.checkers.pop()
      if (movingChecker) {
        // Add checker to destination
        destContainer.checkers.push({
          ...movingChecker,
          checkercontainerId: destContainer.id,
        })
      }
    }

    return { success: true, board: clonedBoard, isHit }
  } catch {
    return { success: false, board, isHit: false }
  }
}

/**
 * Create a game start action with proper snapshot
 */
const createGameStartActionWithSnapshot = (
  gameId: string,
  header: XGMatchHeader,
  sequenceNumber: number,
  snapshot: GameStateSnapshot
): GameHistoryAction => {
  const gameStartData: GameStartActionData = {
    startingPlayer: 'white',
    initialDiceRoll: [1, 1],
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId: header.player1,
    actionType: 'game-start',
    actionData: { type: 'game-start', data: gameStartData },
    gameStateBefore: snapshot,
    gameStateAfter: snapshot,
  }
}

/**
 * Create a roll action with proper snapshots
 */
const createRollActionWithSnapshot = (
  moveRecord: XGMoveRecord,
  gameId: string,
  playerId: string,
  sequenceNumber: number,
  snapshotBefore: GameStateSnapshot,
  snapshotAfter: GameStateSnapshot
): GameHistoryAction => {
  const rollData: RollDiceActionData = {
    dice: moveRecord.dice!,
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId,
    actionType: 'roll-dice',
    actionData: { type: 'roll-dice', data: rollData },
    gameStateBefore: snapshotBefore,
    gameStateAfter: snapshotAfter,
  }
}

/**
 * Create a move action with proper snapshots
 */
const createMoveActionWithSnapshot = (
  xgMove: XGMove,
  moveRecord: XGMoveRecord,
  gameId: string,
  playerId: string,
  sequenceNumber: number,
  direction: BackgammonMoveDirection,
  snapshotBefore: GameStateSnapshot,
  snapshotAfter: GameStateSnapshot,
  isHit: boolean,
  preserveAnalysis: boolean
): GameHistoryAction => {
  // Determine move kind and positions
  const fromXG = xgMove.from
  const toXG = xgMove.to

  let moveKind: 'point-to-point' | 'reenter' | 'bear-off' = 'point-to-point'
  let originPosition: number | 'bar' | 'off' = fromXG
  let destinationPosition: number | 'bar' | 'off' = toXG

  if (fromXG === 25) {
    moveKind = 'reenter'
    originPosition = 'bar'
  }
  if (toXG === 0) {
    moveKind = 'bear-off'
    destinationPosition = 'off'
  }

  const moveData: MakeMoveActionData = {
    checkerId: 'unknown',
    originPosition,
    destinationPosition,
    dieValue: Math.abs(toXG - fromXG),
    isHit,
    moveKind,
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId,
    actionType: 'make-move',
    actionData: { type: 'make-move', data: moveData },
    gameStateBefore: snapshotBefore,
    gameStateAfter: snapshotAfter,
    metadata: undefined,
  }
}

/**
 * Create a game end action with proper snapshot
 */
const createGameEndActionWithSnapshot = (
  xgGame: XGGameRecord,
  gameId: string,
  header: XGMatchHeader,
  sequenceNumber: number,
  snapshot: GameStateSnapshot
): GameHistoryAction => {
  const gameEndData: GameEndActionData = {
    winner: xgGame.winner === 1 ? 'white' : 'black',
    reason: 'checkmate',
    points: xgGame.pointsWon,
    finalPipCounts: { black: 0, white: 0 },
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId: xgGame.winner === 1 ? header.player1 : header.player2,
    actionType: 'game-end',
    actionData: { type: 'game-end', data: gameEndData },
    gameStateBefore: snapshot,
    gameStateAfter: snapshot,
  }
}

// ============================================================================
// Original Helper Functions (kept for export compatibility)
// ============================================================================

const historyActionToXGMoveRecord = (
  action: GameHistoryAction,
  moveNumber: number
): XGMoveRecord | null => {
  // Use exhaustive switch instead of match for action type discrimination
  switch (action.actionType) {
    case 'roll-dice': {
      const rollData = action.actionData.data as RollDiceActionData
      return {
        moveNumber,
        player: action.gameStateBefore.activeColor === 'white' ? 1 : 2,
        dice: rollData.dice,
        moves: [],
      }
    }
    case 'make-move': {
      const moveData = action.actionData.data as MakeMoveActionData
      const xgMove: XGMove = {
        from: convertPositionToXG(moveData.originPosition),
        to: convertPositionToXG(moveData.destinationPosition),
      }

      return {
        moveNumber,
        player: action.gameStateBefore.activeColor === 'white' ? 1 : 2,
        dice: [moveData.dieValue, moveData.dieValue], // Simplified
        moves: [xgMove],
      }
    }
    case 'game-end': {
      const endData = action.actionData.data as GameEndActionData
      return {
        moveNumber,
        player: endData.winner === 'white' ? 1 : 2,
        gameEnd: {
          winner: endData.winner === 'white' ? 1 : 2,
          points: endData.points,
        },
      }
    }
    default:
      return null
  }
}

const xgGameToGameHistory = async (
  xgGame: XGGameRecord,
  header: XGMatchHeader,
  preserveAnalysis: boolean
): Promise<
  Result<
    {
      gameId: string
      actions: readonly GameHistoryAction[]
      simulatedGame: BackgammonGame
    },
    string
  >
> => {
  try {
    // Create a basic game structure
    const gameConversionResult = await XGConverter.xgGameToNodotsGame(
      xgGame,
      header
    )
    const game = gameConversionResult as BackgammonGame
    const gameId = game.id || `xg-import-${Date.now()}-${xgGame.gameNumber}`

    // Get player information for direction mapping
    const player1 = game.players.find(p => p.color === 'white')
    const player2 = game.players.find(p => p.color === 'black')

    // Track mutable game state throughout the conversion
    // Start with a deep clone of the initial board state
    let currentBoard: BackgammonBoard = cloneBoard(game.board)
    let currentActiveColor: BackgammonColor = 'white'

    // Convert XG moves to history actions using pure functions
    const actions: GameHistoryAction[] = []
    let sequenceNumber = 1

    // Create initial game snapshot
    const initialSnapshot = createGameSnapshot(
      game,
      currentBoard,
      currentActiveColor
    )

    // Add game start action with proper snapshots
    const startAction = createGameStartActionWithSnapshot(
      gameId,
      header,
      sequenceNumber++,
      initialSnapshot
    )
    actions.push(startAction)

    // Convert XG moves to history actions, tracking board state
    for (const moveRecord of xgGame.moves) {
      // Determine which player is moving
      const movingPlayerColor: BackgammonColor = moveRecord.player === 1 ? 'white' : 'black'
      const movingPlayer = game.players.find(p => p.color === movingPlayerColor)

      if (!movingPlayer) {
        continue
      }

      // Create snapshot before this move record is processed
      const snapshotBefore = createGameSnapshot(
        game,
        currentBoard,
        movingPlayerColor
      )

      // Process dice roll action
      if (moveRecord.dice) {
        const rollAction = createRollActionWithSnapshot(
          moveRecord,
          gameId,
          moveRecord.player === 1 ? header.player1 : header.player2,
          sequenceNumber++,
          snapshotBefore,
          snapshotBefore // Roll doesn't change board state
        )
        actions.push(rollAction)
      }

      // Process each move in the move record, updating board state
      for (const xgMove of moveRecord.moves || []) {
        const movingDirection = movingPlayer.direction

        // Create snapshot before this individual move
        const moveSnapshotBefore = createGameSnapshot(
          game,
          currentBoard,
          movingPlayerColor
        )

        // Apply the move to the board and get the updated board
        const moveResult = applyXGMoveToBoard(
          currentBoard,
          xgMove,
          movingDirection,
          movingPlayerColor
        )

        if (moveResult.success) {
          currentBoard = moveResult.board
        }

        // Create snapshot after this individual move
        const moveSnapshotAfter = createGameSnapshot(
          game,
          currentBoard,
          movingPlayerColor
        )

        // Create move action with proper snapshots
        const moveAction = createMoveActionWithSnapshot(
          xgMove,
          moveRecord,
          gameId,
          moveRecord.player === 1 ? header.player1 : header.player2,
          sequenceNumber++,
          movingDirection,
          moveSnapshotBefore,
          moveSnapshotAfter,
          moveResult.isHit || false,
          preserveAnalysis
        )
        actions.push(moveAction)
      }

      // Switch active color for next turn
      currentActiveColor = currentActiveColor === 'white' ? 'black' : 'white'
    }

    // Add game end action if we have a winner
    if (xgGame.winner) {
      const finalSnapshot = createGameSnapshot(
        game,
        currentBoard,
        xgGame.winner === 1 ? 'white' : 'black'
      )
      const endAction = createGameEndActionWithSnapshot(
        xgGame,
        gameId,
        header,
        sequenceNumber,
        finalSnapshot
      )
      actions.push(endAction)
    }

    // Update the game with the final board state
    const finalGame: BackgammonGame = {
      ...game,
      board: currentBoard,
    }

    return success({
      gameId,
      actions,
      simulatedGame: finalGame,
    })
  } catch (error) {
    return failure(
      `Failed to convert XG game to game history: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

const xgMoveRecordToHistoryActions = (
  moveRecord: XGMoveRecord,
  gameId: string,
  header: XGMatchHeader,
  startingSequence: number,
  preserveAnalysis: boolean
): GameHistoryAction[] => {
  const actions: GameHistoryAction[] = []
  let sequenceNumber = startingSequence
  const playerId = moveRecord.player === 1 ? header.player1 : header.player2

  // Add dice roll action if dice are present
  if (moveRecord.dice) {
    const rollAction = createRollAction(
      moveRecord,
      gameId,
      playerId,
      sequenceNumber++
    )
    actions.push(rollAction)
  }

  // Add move actions using functional patterns
  const moveActions = (moveRecord.moves || []).map((xgMove) =>
    createMoveAction(
      xgMove,
      moveRecord,
      gameId,
      playerId,
      sequenceNumber++,
      preserveAnalysis
    )
  )
  actions.push(...moveActions)

  return actions
}

// Pure utility functions

const convertPositionToXG = (position: number | 'bar' | 'off'): number => {
  // Use exhaustive switch instead of match for position discrimination
  switch (position) {
    case 'bar':
      return 25
    case 'off':
      return 0
    default:
      return typeof position === 'number' ? position : 0
  }
}

const convertPositionFromXG = (xgPosition: number): number | 'bar' | 'off' => {
  // Use exhaustive switch instead of match for XG position discrimination
  switch (xgPosition) {
    case 25:
      return 'bar' as const
    case 0:
      return 'off' as const
    default:
      return xgPosition
  }
}

const createXGMatchHeaderFromHistory = (
  gameHistory: GameHistory,
  playerNames: [string, string]
): XGMatchHeader => ({
  site: 'Nodots Backgammon',
  matchId: gameHistory.gameId,
  player1: playerNames[0],
  player2: playerNames[1],
  eventDate: gameHistory.createdAt
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '.'),
  eventTime: gameHistory.createdAt.toTimeString().substr(0, 5),
  variation: 'Backgammon',
  jacoby: 'Off',
  beaver: 'Off',
  unrated: 'Off',
  cubeLimit: 1024,
})

const createXGMatchHeader = (
  firstHistory: GameHistory,
  matchName: string,
  gameIds: readonly string[]
): XGMatchHeader => ({
  site: 'Nodots Backgammon',
  matchId: `match-${Date.now()}`,
  player1: firstHistory.metadata.players.white.userId,
  player2: firstHistory.metadata.players.black.userId,
  eventDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
  eventTime: new Date().toTimeString().substr(0, 5),
  variation: 'Backgammon',
  jacoby: 'Off',
  beaver: 'Off',
  unrated: 'Off',
  cubeLimit: 1024,
})

const calculateUpdatedScore = (
  initialScore: { player1: number; player2: number },
  winner: number,
  pointsWon: number
): { player1: number; player2: number } => {
  // Use exhaustive switch instead of match for winner discrimination
  switch (winner) {
    case 1:
      return { ...initialScore, player1: initialScore.player1 + pointsWon }
    case 2:
      return { ...initialScore, player2: initialScore.player2 + pointsWon }
    default:
      return initialScore
  }
}

const calculateFinalScore = (
  xgGames: readonly XGGameRecord[]
): { player1: number; player2: number } =>
  xgGames.reduce(
    (score, game) => calculateUpdatedScore(score, game.winner, game.pointsWon),
    { player1: 0, player2: 0 }
  )

const createSimpleSnapshot = (): GameStateSnapshot => ({
  stateKind: 'moving',
  activeColor: 'white',
  boardPositions: {},
  diceState: {
    black: { stateKind: 'inactive' },
    white: { stateKind: 'rolled' },
  },
  cubeState: { value: 1, stateKind: 'centered' },
  playerStates: {
    black: {
      pipCount: 100,
      stateKind: 'inactive',
      isRobot: false,
      userId: '',
      direction: 'clockwise',
    },
    white: {
      pipCount: 100,
      stateKind: 'active',
      isRobot: false,
      userId: '',
      direction: 'clockwise',
    },
  },
  moveCount: 10,
  turnCount: 5,
})

const createGameStartAction = (
  gameId: string,
  header: XGMatchHeader,
  sequenceNumber: number,
  game: BackgammonGame
): GameHistoryAction => {
  const gameStartData: GameStartActionData = {
    startingPlayer: 'white', // Simplified
    initialDiceRoll: [1, 1], // Would extract from first move
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId: header.player1,
    actionType: 'game-start',
    actionData: { type: 'game-start', data: gameStartData },
    gameStateBefore: createSimpleSnapshot(),
    gameStateAfter: createSimpleSnapshot(),
  }
}

const createGameEndAction = (
  xgGame: XGGameRecord,
  gameId: string,
  header: XGMatchHeader,
  sequenceNumber: number,
  game: BackgammonGame
): GameHistoryAction => {
  const gameEndData: GameEndActionData = {
    winner: xgGame.winner === 1 ? 'white' : 'black',
    reason: 'checkmate',
    points: xgGame.pointsWon,
    finalPipCounts: { black: 0, white: 0 }, // Simplified
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId: xgGame.winner === 1 ? header.player1 : header.player2,
    actionType: 'game-end',
    actionData: { type: 'game-end', data: gameEndData },
    gameStateBefore: createSimpleSnapshot(),
    gameStateAfter: createSimpleSnapshot(),
  }
}

const createRollAction = (
  moveRecord: XGMoveRecord,
  gameId: string,
  playerId: string,
  sequenceNumber: number
): GameHistoryAction => {
  const rollData: RollDiceActionData = {
    dice: moveRecord.dice!,
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId,
    actionType: 'roll-dice',
    actionData: { type: 'roll-dice', data: rollData },
    gameStateBefore: createSimpleSnapshot(),
    gameStateAfter: createSimpleSnapshot(),
  }
}

const createMoveAction = (
  xgMove: XGMove,
  moveRecord: XGMoveRecord,
  gameId: string,
  playerId: string,
  sequenceNumber: number,
  preserveAnalysis: boolean
): GameHistoryAction => {
  const moveData: MakeMoveActionData = {
    checkerId: 'unknown',
    originPosition: convertPositionFromXG(xgMove.from),
    destinationPosition: convertPositionFromXG(xgMove.to),
    dieValue: Math.abs(xgMove.to - xgMove.from), // Simplified
    isHit: false, // Would need to determine from game state
    moveKind: 'point-to-point',
  }

  return {
    id: `action-${sequenceNumber}`,
    gameId,
    sequenceNumber,
    timestamp: new Date(),
    playerId,
    actionType: 'make-move',
    actionData: { type: 'make-move', data: moveData },
    gameStateBefore: createSimpleSnapshot(),
    gameStateAfter: createSimpleSnapshot(),
    metadata: undefined, // Analysis preservation not supported in current XG types
  }
}

// Export the functional service module
export const XGHistoryConverter = {
  exportGameHistoryToXG,
  importXGToGameHistory,
  exportMultipleGamesToXG,
} as const
