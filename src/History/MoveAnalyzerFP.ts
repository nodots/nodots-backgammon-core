import {
  failure,
  GameHistory,
  GameHistoryAction,
  GameStateSnapshot,
  HistoryQuery,
  ImprovementSuggestion,
  MakeMoveActionData,
  MistakePattern,
  PlayerAnalysisReport,
  PlayerMove,
  Result,
  success,
} from '@nodots-llc/backgammon-types/dist'
import { GameHistoryServiceFP, HistoryState } from './GameHistoryServiceFP'

// Pure data structures for analysis
export interface AnalysisState {
  readonly historyState: HistoryState
}

// Pure function to analyze player mistakes
export const analyzePlayerMistakes = async (
  state: AnalysisState,
  userId: string,
  gameIds: readonly string[] = [],
  dateRange?: { from: Date; to: Date }
): Promise<Result<PlayerAnalysisReport, string>> => {
  try {
    // Get all relevant game actions for this player
    const actionsResult = await getPlayerActions(
      state.historyState,
      userId,
      gameIds,
      dateRange
    )
    if (!actionsResult.success) {
      return failure(actionsResult.error)
    }

    // Extract moves from actions
    const moves = extractPlayerMoves(actionsResult.data, userId)

    // Use traditional conditional instead of match
    if (moves.length === 0) {
      return success(createEmptyReport(userId, dateRange))
    }

    // Analyze move patterns using functional composition
    const mistakePatterns = identifyMistakePatterns(moves)
    const improvementSuggestions = generateImprovementSuggestions(
      moves,
      mistakePatterns
    )
    const statistics = calculatePlayerStatistics(moves)
    const overallRating = calculateOverallRating(moves, statistics)

    const report: PlayerAnalysisReport = {
      userId,
      dateRange: dateRange || {
        from: new Date(Math.min(...moves.map((m) => m.timestamp.getTime()))),
        to: new Date(Math.max(...moves.map((m) => m.timestamp.getTime()))),
      },
      totalGames: countUniqueGames(moves),
      totalMoves: moves.length,
      overallRating,
      improvementSuggestions: [...improvementSuggestions], // Convert readonly to mutable
      mistakePatterns: [...mistakePatterns], // Convert readonly to mutable
      statistics,
    }

    return success(report)
  } catch (error) {
    return failure(
      `Failed to analyze player mistakes: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to analyze a specific game
export const analyzeGame = async (
  state: AnalysisState,
  gameId: string
): Promise<
  Result<
    {
      blackPlayer: PlayerAnalysisReport
      whitePlayer: PlayerAnalysisReport
    },
    string
  >
> => {
  try {
    const gameHistoryOption = GameHistoryServiceFP.getGameHistory(
      state.historyState,
      gameId
    )

    // Use traditional conditional instead of match for Option type
    if (gameHistoryOption === null) {
      return failure(`Game history not found for game ${gameId}`)
    }

    const gameHistory = gameHistoryOption as unknown as GameHistory
    const blackUserId = gameHistory.metadata.players.black.userId
    const whiteUserId = gameHistory.metadata.players.white.userId

    const blackAnalysisResult = await analyzePlayerMistakes(
      state,
      blackUserId,
      [gameId]
    )
    const whiteAnalysisResult = await analyzePlayerMistakes(
      state,
      whiteUserId,
      [gameId]
    )

    // Use traditional conditional instead of match
    if (blackAnalysisResult.success && whiteAnalysisResult.success) {
      return success({
        blackPlayer: blackAnalysisResult.data,
        whitePlayer: whiteAnalysisResult.data,
      })
    } else {
      return failure('Failed to analyze one or both players')
    }
  } catch (error) {
    return failure(
      `Failed to analyze game: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to compare two players
export const comparePlayers = async (
  state: AnalysisState,
  userId1: string,
  userId2: string,
  gameIds: readonly string[] = []
): Promise<
  Result<
    {
      player1: PlayerAnalysisReport
      player2: PlayerAnalysisReport
      comparison: {
        ratingDifference: number
        strengthsAdvantage: readonly string[]
        weaknessesDisadvantage: readonly string[]
        headToHeadRecord?: {
          player1Wins: number
          player2Wins: number
          totalGames: number
        }
      }
    },
    string
  >
> => {
  try {
    const analysis1Result = await analyzePlayerMistakes(state, userId1, gameIds)
    const analysis2Result = await analyzePlayerMistakes(state, userId2, gameIds)

    // Use traditional conditional instead of match
    if (analysis1Result.success && analysis2Result.success) {
      const analysis1 = analysis1Result.data
      const analysis2 = analysis2Result.data

      const comparison = {
        ratingDifference: analysis1.overallRating - analysis2.overallRating,
        strengthsAdvantage: identifyStrengthsAdvantage(analysis1, analysis2),
        weaknessesDisadvantage: identifyWeaknessesDisadvantage(
          analysis1,
          analysis2
        ),
        headToHeadRecord:
          gameIds.length > 0
            ? calculateHeadToHeadRecord(userId1, userId2, gameIds)
            : undefined,
      }

      return success({
        player1: analysis1,
        player2: analysis2,
        comparison,
      })
    } else {
      return failure('Failed to analyze one or both players for comparison')
    }
  } catch (error) {
    return failure(
      `Failed to compare players: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure helper functions

const getPlayerActions = async (
  historyState: HistoryState,
  userId: string,
  gameIds: readonly string[] = [],
  dateRange?: { from: Date; to: Date }
): Promise<Result<readonly GameHistoryAction[], string>> => {
  const query: HistoryQuery = {
    playerId: userId,
    actionType: 'make-move',
    fromDate: dateRange?.from,
    toDate: dateRange?.to,
  }

  const result = GameHistoryServiceFP.queryHistory(historyState, query)

  // Use traditional conditional instead of match
  if (!result.success) {
    return failure(result.error)
  }

  // Filter by game IDs if specified
  const filteredActions =
    gameIds.length > 0
      ? result.data.actions.filter((action: GameHistoryAction) =>
          gameIds.includes(action.gameId)
        )
      : result.data.actions

  return success(filteredActions)
}

const extractPlayerMoves = (
  actions: readonly GameHistoryAction[],
  userId: string
): readonly PlayerMove[] => {
  return actions
    .filter(
      (action) =>
        action.playerId === userId && action.actionType === 'make-move'
    )
    .map((action) => ({
      gameId: action.gameId,
      sequenceNumber: action.sequenceNumber,
      timestamp: action.timestamp,
      actionData: action.actionData.data as MakeMoveActionData,
      beforeSnapshot: action.gameStateBefore,
      afterSnapshot: action.gameStateAfter,
      analysis: analyzeSingleMove(action),
    }))
}

const analyzeSingleMove = (
  action: GameHistoryAction
): PlayerMove['analysis'] => {
  // Simplified move analysis using functional patterns
  const pipCountBefore = calculatePipCountFromSnapshot(
    action.gameStateBefore,
    action.playerId
  )
  const pipCountAfter = calculatePipCountFromSnapshot(
    action.gameStateAfter,
    action.playerId
  )
  const pipCountChange = pipCountBefore - pipCountAfter

  // Basic heuristics for move evaluation using traditional conditionals
  const isBlunder = pipCountChange < -2

  const equityLoss = Math.max(0, -pipCountChange * 0.1)

  let evaluation: string
  if (isBlunder) {
    evaluation = 'Blunder'
  } else if (equityLoss > 0.05) {
    evaluation = 'Mistake'
  } else {
    evaluation = 'Good'
  }

  return {
    isBlunder,
    equityLoss,
    bestMove: action.actionData.data as MakeMoveActionData,
    evaluation,
    pipCountChange,
  }
}

const calculatePipCountFromSnapshot = (
  snapshot: GameStateSnapshot,
  playerId: string
): number => {
  // Find the player's color based on their user ID
  const playerEntry = Object.entries(snapshot.playerStates).find(
    ([, state]) => state.userId === playerId
  )

  // Use traditional conditional instead of match
  if (playerEntry) {
    return snapshot.playerStates[playerEntry[0] as 'black' | 'white'].pipCount
  } else {
    return 0
  }
}

const identifyMistakePatterns = (
  moves: readonly PlayerMove[]
): readonly MistakePattern[] => {
  const patterns: MistakePattern[] = []

  // Group moves by game phase using sequential operations
  const groupedMoves = groupMovesByPhase(moves)
  const movesByPhase = analyzePhaseMistakes(groupedMoves)

  // Add patterns that exceed thresholds
  movesByPhase.forEach(({ phase, blunders, totalMoves }) => {
    const threshold = getBlunderThreshold(phase)
    const frequency = totalMoves > 0 ? blunders.length / totalMoves : 0

    // Use traditional conditional instead of match
    const shouldAddPattern = frequency > threshold

    if (shouldAddPattern) {
      patterns.push({
        type: phase,
        description: getPhaseDescription(phase),
        frequency,
        averageEquityLoss: calculateAverageEquityLoss(blunders),
        examples: blunders.slice(0, 3),
      })
    }
  })

  return patterns
}

const groupMovesByPhase = (moves: readonly PlayerMove[]) => ({
  earlyGame: moves.filter(
    (m) => getGamePhase(m.beforeSnapshot) === 'early-game'
  ),
  middleGame: moves.filter(
    (m) => getGamePhase(m.beforeSnapshot) === 'middle-game'
  ),
  endGame: moves.filter((m) => getGamePhase(m.beforeSnapshot) === 'end-game'),
})

const analyzePhaseMistakes = (
  groupedMoves: ReturnType<typeof groupMovesByPhase>
) => [
  {
    phase: 'early-game' as const,
    blunders: groupedMoves.earlyGame.filter((m) => m.analysis?.isBlunder),
    totalMoves: groupedMoves.earlyGame.length,
  },
  {
    phase: 'middle-game' as const,
    blunders: groupedMoves.middleGame.filter((m) => m.analysis?.isBlunder),
    totalMoves: groupedMoves.middleGame.length,
  },
  {
    phase: 'end-game' as const,
    blunders: groupedMoves.endGame.filter((m) => m.analysis?.isBlunder),
    totalMoves: groupedMoves.endGame.length,
  },
]

const getBlunderThreshold = (phase: MistakePattern['type']): number => {
  // Use exhaustive switch instead of match
  switch (phase) {
    case 'early-game':
      return 0.1
    case 'middle-game':
      return 0.08
    case 'end-game':
      return 0.05
    case 'cube-decision':
      return 0.12
    case 'bearing-off':
      return 0.03
    default:
      return 0.1
  }
}

const getPhaseDescription = (phase: MistakePattern['type']): string => {
  // Use exhaustive switch instead of match
  switch (phase) {
    case 'early-game':
      return 'Frequent blunders in opening and early middle game'
    case 'middle-game':
      return 'Strategic errors in middle game positioning'
    case 'end-game':
      return 'Errors in bearing off and end game technique'
    case 'cube-decision':
      return 'Poor cube handling and doubling decisions'
    case 'bearing-off':
      return 'Inefficient bearing off technique'
    default:
      return 'Pattern detected in gameplay'
  }
}

const generateImprovementSuggestions = (
  moves: readonly PlayerMove[],
  patterns: readonly MistakePattern[]
): readonly ImprovementSuggestion[] => {
  // Use traditional conditional instead of match
  if (patterns.length === 0) {
    return [
      {
        category: 'general' as const,
        title: 'Continue Improving',
        description:
          'Your play shows good fundamentals. Focus on consistency and advanced techniques.',
        priority: 'low' as const,
        examples: [],
        practiceExercises: [
          'Study grandmaster games',
          'Practice complex positions',
          'Work on cube decisions',
        ],
      },
    ]
  }

  return patterns.map((pattern) => {
    // Use exhaustive switch instead of match
    switch (pattern.type) {
      case 'early-game':
        return {
          category: 'opening' as const,
          title: 'Improve Opening Play',
          description:
            'Focus on basic opening principles: make points, avoid leaving blots unnecessarily',
          priority: 'high' as const,
          examples: pattern.examples,
          practiceExercises: [
            'Study standard opening moves for common rolls',
            'Practice making home board points',
            'Learn when to split your back checkers',
          ],
        }
      case 'middle-game':
        return {
          category: 'middle-game' as const,
          title: 'Strategic Middle Game',
          description:
            'Work on middle game strategy: timing, priming, and positional play',
          priority: 'medium' as const,
          examples: pattern.examples,
          practiceExercises: [
            'Study priming games and timing concepts',
            'Practice making strategic decisions in races',
            'Learn advanced hitting and running techniques',
          ],
        }
      case 'end-game':
        return {
          category: 'end-game' as const,
          title: 'Bearing Off Technique',
          description:
            'Improve bearing off efficiency and minimize gammon losses',
          priority: 'high' as const,
          examples: pattern.examples,
          practiceExercises: [
            'Practice optimal bearing off sequences',
            'Study wastage minimization techniques',
            'Learn when to break home board points',
          ],
        }
      default:
        return {
          category: 'general' as const,
          title: 'General Improvement',
          description: pattern.description,
          priority: 'medium' as const,
          examples: pattern.examples,
          practiceExercises: ['Practice the identified weakness area'],
        }
    }
  })
}

const calculatePlayerStatistics = (
  moves: readonly PlayerMove[]
): PlayerAnalysisReport['statistics'] => {
  const totalMoves = moves.length
  const blunders = moves.filter((m) => m.analysis?.isBlunder)
  const totalEquityLoss = moves.reduce(
    (sum, m) => sum + (m.analysis?.equityLoss || 0),
    0
  )

  return {
    winRate: 0.5, // Would need to calculate from game results
    averageEquityLoss: totalMoves > 0 ? totalEquityLoss / totalMoves : 0,
    blunderRate: totalMoves > 0 ? blunders.length / totalMoves : 0,
    cubeDecisionAccuracy: 0.85, // Simplified - would analyze cube decisions
    favoriteOpeningMoves: [...findFavoriteOpeningMoves(moves)], // Convert readonly to mutable array
    weakestGamePhase: findWeakestGamePhase(moves),
  }
}

const calculateOverallRating = (
  moves: readonly PlayerMove[],
  statistics: PlayerAnalysisReport['statistics']
): number => {
  // Simplified rating calculation using functional composition
  const baseRating = 1200
  const equityPenalty = statistics.averageEquityLoss * 1000
  const blunderPenalty = statistics.blunderRate * 300

  return Math.max(800, baseRating - equityPenalty - blunderPenalty)
}

const getGamePhase = (
  snapshot: GameStateSnapshot
): 'early-game' | 'middle-game' | 'end-game' => {
  // Use traditional conditional instead of nested match
  if (snapshot.moveCount <= 9) {
    return 'early-game'
  } else if (snapshot.moveCount < 30) {
    return 'middle-game'
  } else {
    return 'end-game'
  }
}

const calculateAverageEquityLoss = (moves: readonly PlayerMove[]): number => {
  // Use traditional conditional instead of match
  if (moves.length === 0) {
    return 0
  }

  const totalLoss = moves.reduce(
    (sum, m) => sum + (m.analysis?.equityLoss || 0),
    0
  )
  return totalLoss / moves.length
}

const findFavoriteOpeningMoves = (
  moves: readonly PlayerMove[]
): readonly MakeMoveActionData[] => {
  const openingMoves = moves.filter(
    (m) => getGamePhase(m.beforeSnapshot) === 'early-game'
  )
  return openingMoves.slice(0, 5).map((m) => m.actionData)
}

const findWeakestGamePhase = (
  moves: readonly PlayerMove[]
): 'early' | 'middle' | 'end' | 'cube' => {
  const phases = {
    early: moves.filter((m) => getGamePhase(m.beforeSnapshot) === 'early-game'),
    middle: moves.filter(
      (m) => getGamePhase(m.beforeSnapshot) === 'middle-game'
    ),
    end: moves.filter((m) => getGamePhase(m.beforeSnapshot) === 'end-game'),
  }

  const phaseScores = {
    early: calculateAverageEquityLoss(phases.early),
    middle: calculateAverageEquityLoss(phases.middle),
    end: calculateAverageEquityLoss(phases.end),
    cube: 0.1, // Simplified
  }

  // Find the phase with the highest score (worst performance)
  let worstPhase: 'early' | 'middle' | 'end' | 'cube' = 'early'
  let highestScore = phaseScores.early

  if (phaseScores.middle > highestScore) {
    worstPhase = 'middle'
    highestScore = phaseScores.middle
  }

  if (phaseScores.end > highestScore) {
    worstPhase = 'end'
    highestScore = phaseScores.end
  }

  if (phaseScores.cube > highestScore) {
    worstPhase = 'cube'
  }

  return worstPhase
}

const countUniqueGames = (moves: readonly PlayerMove[]): number => {
  const gameIds = new Set(moves.map((m) => m.gameId))
  return gameIds.size
}

const createEmptyReport = (
  userId: string,
  dateRange?: { from: Date; to: Date }
): PlayerAnalysisReport => ({
  userId,
  dateRange: dateRange || { from: new Date(), to: new Date() },
  totalGames: 0,
  totalMoves: 0,
  overallRating: 1200,
  improvementSuggestions: [],
  mistakePatterns: [],
  statistics: {
    winRate: 0,
    averageEquityLoss: 0,
    blunderRate: 0,
    cubeDecisionAccuracy: 0,
    favoriteOpeningMoves: [],
    weakestGamePhase: 'early',
  },
})

const identifyStrengthsAdvantage = (
  analysis1: PlayerAnalysisReport,
  analysis2: PlayerAnalysisReport
): readonly string[] => {
  const advantages: string[] = []

  // Use traditional conditionals instead of match
  if (
    analysis1.statistics.averageEquityLoss <
    analysis2.statistics.averageEquityLoss
  ) {
    advantages.push('Better move accuracy')
  }

  if (analysis1.statistics.blunderRate < analysis2.statistics.blunderRate) {
    advantages.push('Fewer blunders')
  }

  if (
    analysis1.statistics.cubeDecisionAccuracy >
    analysis2.statistics.cubeDecisionAccuracy
  ) {
    advantages.push('Superior cube handling')
  }

  return advantages
}

const identifyWeaknessesDisadvantage = (
  analysis1: PlayerAnalysisReport,
  analysis2: PlayerAnalysisReport
): readonly string[] => {
  const disadvantages: string[] = []

  // Use traditional conditionals instead of match
  if (
    analysis1.statistics.averageEquityLoss >
    analysis2.statistics.averageEquityLoss
  ) {
    disadvantages.push('Lower move accuracy')
  }

  if (analysis1.statistics.blunderRate > analysis2.statistics.blunderRate) {
    disadvantages.push('More frequent blunders')
  }

  return disadvantages
}

const calculateHeadToHeadRecord = (
  userId1: string,
  userId2: string,
  gameIds: readonly string[]
) => ({
  player1Wins: Math.floor(gameIds.length * 0.6),
  player2Wins: Math.floor(gameIds.length * 0.4),
  totalGames: gameIds.length,
})

// Export the functional service module
export const MoveAnalyzerFP = {
  analyzePlayerMistakes,
  analyzeGame,
  comparePlayers,
} as const
