import {
  BackgammonGame,
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
} from '-llc/backgammon-types'
import { XGConverter, XGParser, XGSerializer } from '../XG'
import { GameHistoryService, HistoryState } from './GameHistoryService'

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
      for (const action of gameHistoryData.actions) {
        const recordResult = await GameHistoryService.recordAction(
          newHistoryState,
          {
            gameId: action.gameId,
            playerId: action.playerId,
            actionType: action.actionType,
            actionData: action.actionData,
            gameStateBefore: gameHistoryData.simulatedGame,
            gameStateAfter: gameHistoryData.simulatedGame,
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

    // Convert XG moves to history actions using pure functions
    const actions: GameHistoryAction[] = []
    let sequenceNumber = 1

    // Add game start action
    const startAction = createGameStartAction(
      gameId,
      header,
      sequenceNumber++,
      game
    )
    actions.push(startAction)

    // Convert XG moves to history actions
    for (const moveRecord of xgGame.moves) {
      const historyActions = xgMoveRecordToHistoryActions(
        moveRecord,
        gameId,
        header,
        sequenceNumber,
        preserveAnalysis
      )

      actions.push(...historyActions)
      sequenceNumber += historyActions.length
    }

    // Add game end action if we have a winner
    if (xgGame.winner) {
      const endAction = createGameEndAction(
        xgGame,
        gameId,
        header,
        sequenceNumber,
        game
      )
      actions.push(endAction)
    }

    return success({
      gameId,
      actions,
      simulatedGame: game,
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
