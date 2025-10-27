import {
  BackgammonGame,
  GameHistory,
  GameHistoryAction,
  GameStateSnapshot,
  Result,
  success,
  failure,
  XGMatch,
  XGMatchHeader,
  XGGameRecord,
  XGMoveRecord,
  XGMove,
  XGExportOptions,
  HistoryExportResult,
  GameStartActionData,
  RollDiceActionData,
  MakeMoveActionData,
  GameEndActionData,
  BackgammonColor,
} from '@nodots-llc/backgammon-types'
import { XGParser } from '../XG/parser'
import { XGSerializer } from '../XG/serializer'
import { XGConverter } from '../XG/converter'
import { createSnapshot } from './SnapshotService'

/**
 * Export a complete game history to XG format
 */
export async function exportGameHistoryToXG(
  gameHistory: GameHistory,
  options: XGExportOptions = {}
): Promise<Result<HistoryExportResult, string>> {
  try {
    const xgMatchResult = await gameHistoryToXGMatch(gameHistory, options)

    if (!xgMatchResult.success) {
      return failure(xgMatchResult.error)
    }

    const xgContent = XGSerializer.serialize(xgMatchResult.data)

    const result: HistoryExportResult = {
      format: 'xg',
      data: xgContent,
      filename: `game-${gameHistory.gameId}-${Date.now()}.xg`,
      size: xgContent.length,
    }

    return success(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return failure(`Failed to export game history: ${errorMessage}`)
  }
}

/**
 * Import XG format and create game history
 */
export async function importXGToGameHistory(
  xgContent: string,
  preserveAnalysis: boolean = false
): Promise<Result<{ gameIds: string[]; errors: string[]; warnings: string[] }, string>> {
  try {
    const parseResult = XGParser.parse(xgContent)

    if (!parseResult.success || !parseResult.data) {
      return success({
        gameIds: [],
        errors: parseResult.errors.map((e) => e.message),
        warnings: parseResult.warnings,
      })
    }

    const conversionResults = await Promise.all(
      parseResult.data.games.map((xgGame) =>
        xgGameToGameHistory(xgGame, parseResult.data!.header, preserveAnalysis)
      )
    )

    const successes = conversionResults
      .filter((r) => r.success)
      .map((r) => r.data!)
    const failures = conversionResults
      .filter((r) => !r.success)
      .map((r) => r.error)

    const gameIds = successes.map((s) => s.gameId)

    return success({
      gameIds,
      errors: failures,
      warnings: parseResult.warnings,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return failure(`Failed to import XG content: ${errorMessage}`)
  }
}

/**
 * Convert GameHistory to XG match format
 */
async function gameHistoryToXGMatch(
  gameHistory: GameHistory,
  options: XGExportOptions
): Promise<Result<XGMatch, string>> {
  try {
    const player1Name = gameHistory.metadata.players.white.userId || 'Player 1'
    const player2Name = gameHistory.metadata.players.black.userId || 'Player 2'

    const xgGameResult = await gameHistoryToXGGame(
      gameHistory,
      1,
      { player1: 0, player2: 0 }
    )

    if (!xgGameResult.success) {
      return failure(xgGameResult.error)
    }

    const header: XGMatchHeader = {
      site: options.site || 'Nodots Backgammon',
      matchId: gameHistory.gameId,
      player1: player1Name,
      player2: player2Name,
      eventDate: gameHistory.createdAt.toISOString().split('T')[0].replace(/-/g, '.'),
      eventTime: gameHistory.createdAt.toTimeString().substr(0, 5),
      variation: 'Backgammon',
      jacoby: gameHistory.metadata.settings.jacobyRule ? 'On' : 'Off',
      beaver: gameHistory.metadata.settings.beaverAllowed ? 'On' : 'Off',
      unrated: 'Off',
      cubeLimit: 1024,
    }

    const xgMatch: XGMatch = {
      header,
      matchLength: 0,
      games: [xgGameResult.data],
      metadata: {
        totalGames: 1,
        finalScore: xgGameResult.data.finalScore,
        parsedAt: new Date(),
        fileSize: 0,
      },
    }

    return success(xgMatch)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return failure(`Failed to convert game history to XG match: ${errorMessage}`)
  }
}

/**
 * Convert GameHistory to XG game record
 */
async function gameHistoryToXGGame(
  gameHistory: GameHistory,
  gameNumber: number,
  initialScore: { player1: number; player2: number }
): Promise<Result<XGGameRecord, string>> {
  try {
    const moveRecords: XGMoveRecord[] = []
    let moveNumber = 1

    // Convert history actions to XG moves
    for (const action of gameHistory.actions) {
      const xgMoveRecord = historyActionToXGMoveRecord(action, moveNumber)
      if (xgMoveRecord) {
        moveRecords.push(xgMoveRecord)
        // Only increment move number for actual moves, not dice rolls
        if (xgMoveRecord.moves || xgMoveRecord.cubeAction || xgMoveRecord.gameEnd) {
          moveNumber++
        }
      }
    }

    // Determine winner and points from final state
    let winner: 1 | 2 = 1
    let pointsWon = 1

    // Look for game end action or check final state
    const lastSnapshot = gameHistory.actions[gameHistory.actions.length - 1]?.gameStateAfter
    if (lastSnapshot) {
      // Determine winner based on pip counts or checkers off
      const whitePipCount = lastSnapshot.pipCounts.white
      const blackPipCount = lastSnapshot.pipCounts.black

      winner = whitePipCount === 0 ? 1 : 2

      // Determine points (simplified - would need more logic for gammon/backgammon)
      pointsWon = 1
    }

    const finalScore = {
      player1: initialScore.player1 + (winner === 1 ? pointsWon : 0),
      player2: initialScore.player2 + (winner === 2 ? pointsWon : 0),
    }

    const xgGame: XGGameRecord = {
      gameNumber,
      initialScore,
      moves: moveRecords,
      winner,
      pointsWon,
      finalScore,
    }

    return success(xgGame)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return failure(`Failed to convert game history to XG game: ${errorMessage}`)
  }
}

/**
 * Convert a history action to an XG move record
 */
function historyActionToXGMoveRecord(
  action: GameHistoryAction,
  moveNumber: number
): XGMoveRecord | null {
  const player: 1 | 2 = action.gameStateBefore.activeColor === 'white' ? 1 : 2

  // as - Type narrowing for specific action data types from discriminated union
  switch (action.actionType) {
    case 'roll-dice': {
      const rollData = action.actionData as unknown as { type: string; data: RollDiceActionData }
      return {
        moveNumber,
        player,
        dice: rollData.data.dice,
        moves: [],
      }
    }

    case 'make-move': {
      const moveData = action.actionData as unknown as { type: string; data: MakeMoveActionData }
      const from = convertPositionToXG(moveData.data.originPosition)
      const to = convertPositionToXG(moveData.data.destinationPosition)

      const xgMove: XGMove = { from, to }

      return {
        moveNumber,
        player,
        dice: [moveData.data.dieValue, moveData.data.dieValue],
        moves: [xgMove],
      }
    }

    default:
      return null
  }
}

/**
 * Convert XG game to game history
 */
async function xgGameToGameHistory(
  xgGame: XGGameRecord,
  header: XGMatchHeader,
  preserveAnalysis: boolean
): Promise<Result<{ gameId: string; actions: GameHistoryAction[] }, string>> {
  try {
    // Create a basic game structure from XG
    const game = await XGConverter.xgGameToNodotsGame(xgGame, header)
    const gameId = `xg-import-${Date.now()}-${xgGame.gameNumber}`

    const actions: GameHistoryAction[] = []
    let sequenceNumber = 1

    // Create initial snapshot
    const snapshotResult = createSnapshot(game as BackgammonGame)
    let currentSnapshot: GameStateSnapshot

    if (snapshotResult.kind === 'success') {
      currentSnapshot = snapshotResult.data
    } else {
      return failure(`Failed to create initial snapshot: ${snapshotResult.error}`)
    }

    // Convert XG moves to history actions
    for (const moveRecord of xgGame.moves) {
      const historyActions = xgMoveRecordToHistoryActions(
        moveRecord,
        gameId,
        header,
        currentSnapshot,
        sequenceNumber
      )

      actions.push(...historyActions)
      sequenceNumber += historyActions.length
    }

    return success({
      gameId,
      actions,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return failure(`Failed to convert XG game to game history: ${errorMessage}`)
  }
}

/**
 * Convert XG move record to history actions
 */
function xgMoveRecordToHistoryActions(
  moveRecord: XGMoveRecord,
  gameId: string,
  header: XGMatchHeader,
  snapshot: GameStateSnapshot,
  startingSequence: number
): GameHistoryAction[] {
  const actions: GameHistoryAction[] = []
  let sequenceNumber = startingSequence
  const playerId = moveRecord.player === 1 ? header.player1 : header.player2

  // Add dice roll action if dice are present
  if (moveRecord.dice) {
    const rollData: RollDiceActionData = {
      // as - XG dice format is plain [number, number] but we need BackgammonDieValue tuple
      dice: moveRecord.dice as [1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6],
    }

    actions.push({
      id: `action-${sequenceNumber}`,
      gameId,
      sequenceNumber,
      timestamp: new Date(),
      playerId,
      actionType: 'roll-dice',
      actionData: { type: 'roll-dice', data: rollData },
      gameStateBefore: snapshot,
      gameStateAfter: snapshot,
    })
    sequenceNumber++
  }

  // Add move actions
  for (const xgMove of moveRecord.moves || []) {
    const moveData: MakeMoveActionData = {
      checkerId: 'unknown',
      originPosition: convertPositionFromXG(xgMove.from),
      destinationPosition: convertPositionFromXG(xgMove.to),
      // as - XG positions are plain numbers, convert to die value for move distance
      dieValue: Math.abs(xgMove.to - xgMove.from) as 1 | 2 | 3 | 4 | 5 | 6,
      isHit: false,
      moveKind: 'point-to-point',
    }

    actions.push({
      id: `action-${sequenceNumber}`,
      gameId,
      sequenceNumber,
      timestamp: new Date(),
      playerId,
      actionType: 'make-move',
      actionData: { type: 'make-move', data: moveData },
      gameStateBefore: snapshot,
      gameStateAfter: snapshot,
    })
    sequenceNumber++
  }

  return actions
}

/**
 * Convert position to XG notation
 */
function convertPositionToXG(position: number | 'bar' | 'off'): number {
  if (position === 'bar') return 25
  if (position === 'off') return 0
  return position
}

/**
 * Convert position from XG notation
 */
function convertPositionFromXG(xgPosition: number): number | 'bar' | 'off' {
  if (xgPosition === 25) return 'bar'
  if (xgPosition === 0) return 'off'
  return xgPosition
}

export const XGHistoryConverter = {
  exportGameHistoryToXG,
  importXGToGameHistory,
} as const
