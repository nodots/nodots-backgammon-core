import { BackgammonGame } from '@nodots-llc/backgammon-types'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { logger } from '../utils/logger'

export interface PRMoveAnalysis {
  player: string
  moveNumber: number
  positionId: string
  moveExecuted: string
  bestMove: string
  equityLoss: number
  errorType: 'none' | 'doubtful' | 'error' | 'blunder' | 'very_bad'
}

export interface PlayerPR {
  player: string
  totalMoves: number
  analyzedMoves: number
  totalEquityLoss: number
  errors: {
    doubtful: number
    error: number
    blunder: number
    veryBad: number
  }
  averageEquityLoss: number
  performanceRating: number
}

export interface PRCalculationResult {
  gameId: string
  playerResults: Record<string, PlayerPR>
  analysisComplete: boolean
  error?: string
}

export class PerformanceRatingCalculator {
  private gnubgIntegration: any

  constructor(gnubgIntegration: any) {
    this.gnubgIntegration = gnubgIntegration
  }

  /**
   * Calculate Performance Rating for all players in a game
   */
  async calculateGamePR(
    gameId: string,
    gameStates: BackgammonGame[],
    moveActions: Array<{ player: string, move: any, dice?: number[] }>
  ): Promise<PRCalculationResult> {
    try {
      logger.info(`Starting PR calculation for game ${gameId}`)

      // Check if GNU BG is available
      const isAvailable = await this.gnubgIntegration.isAvailable()
      if (!isAvailable) {
        throw new Error('GNU Backgammon is not available for position analysis')
      }

      // Initialize player stats
      const playerStats: Record<string, PlayerPR> = {}
      
      // Process each move action
      for (let i = 0; i < moveActions.length; i++) {
        const action = moveActions[i]
        const gameState = gameStates[i]
        
        if (!gameState) {
          logger.warn(`No game state available for move ${i}`)
          continue
        }

        // Initialize player if not exists
        if (!playerStats[action.player]) {
          playerStats[action.player] = {
            player: action.player,
            totalMoves: 0,
            analyzedMoves: 0,
            totalEquityLoss: 0,
            errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 },
            averageEquityLoss: 0,
            performanceRating: 0
          }
        }

        playerStats[action.player].totalMoves++

        try {
          // Generate position ID for analysis
          const positionId = exportToGnuPositionId(gameState)
          const dice = action.dice || [1, 1]

          logger.info(`Analyzing move ${i + 1} by ${action.player}, position: ${positionId}`)

          // Get GNU BG analysis
          const moveAnalysis = await this.analyzeMoveWithGnuBG(
            positionId,
            dice,
            action.move,
            action.player,
            i + 1
          )

          // Update player stats
          if (moveAnalysis) {
            playerStats[action.player].analyzedMoves++
            playerStats[action.player].totalEquityLoss += moveAnalysis.equityLoss

            // Count error types
            switch (moveAnalysis.errorType) {
              case 'doubtful':
                playerStats[action.player].errors.doubtful++
                break
              case 'error':
                playerStats[action.player].errors.error++
                break
              case 'blunder':
                playerStats[action.player].errors.blunder++
                break
              case 'very_bad':
                playerStats[action.player].errors.veryBad++
                break
            }
          }
        } catch (error) {
          logger.warn(`Failed to analyze move ${i + 1}: ${error}`)
        }
      }

      // Calculate final PR for each player
      for (const player of Object.values(playerStats)) {
        if (player.analyzedMoves > 0) {
          player.averageEquityLoss = player.totalEquityLoss / player.analyzedMoves
          player.performanceRating = player.averageEquityLoss * 500
        }
      }

      logger.info(`PR calculation complete for game ${gameId}`)
      
      return {
        gameId,
        playerResults: playerStats,
        analysisComplete: true
      }
    } catch (error) {
      logger.error(`PR calculation failed for game ${gameId}:`, error)
      return {
        gameId,
        playerResults: {},
        analysisComplete: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Analyze a single move using GNU Backgammon
   */
  private async analyzeMoveWithGnuBG(
    positionId: string,
    dice: number[],
    moveExecuted: any,
    player: string,
    moveNumber: number
  ): Promise<PRMoveAnalysis | null> {
    try {
      // Execute GNU BG analysis
      const commands = [
        'new game',
        `set board ${positionId}`,
        `set dice ${dice[0]} ${dice[1]}`,
        'hint'
      ]

      const hintOutput = await this.gnubgIntegration.executeCommand(commands)
      const { moves, bestEquity, actualEquity } = this.parseHintOutput(hintOutput, moveExecuted)

      if (bestEquity !== null && actualEquity !== null) {
        const equityLoss = Math.max(0, bestEquity - actualEquity)
        const errorType = this.classifyError(equityLoss)

        return {
          player,
          moveNumber,
          positionId,
          moveExecuted: String(moveExecuted),
          bestMove: moves.length > 0 ? moves[0].move : 'unknown',
          equityLoss,
          errorType
        }
      }

      return null
    } catch (error) {
      logger.warn(`GNU BG analysis failed for move ${moveNumber}: ${error}`)
      return null
    }
  }

  /**
   * Parse GNU Backgammon hint output
   */
  private parseHintOutput(output: string, actualMove: any): {
    moves: Array<{ move: string, equity: number }>,
    bestEquity: number | null,
    actualEquity: number | null
  } {
    const lines = output.split('\n')
    const moves: Array<{ move: string, equity: number }> = []
    let bestEquity: number | null = null
    let actualEquity: number | null = null

    // Parse the hint table
    let inTable = false
    for (const line of lines) {
      // Look for table header
      if (line.includes('Rank') && line.includes('Move') && line.includes('Equity')) {
        inTable = true
        continue
      }

      if (inTable) {
        // Parse move lines (format: "1. Type Equity Move")
        const match = line.match(/^\s*(\d+)\.\s+(\S+)\s+([-\d.]+)\s+(.+)/)
        if (match) {
          const [, rank, type, equity, move] = match
          const moveData = {
            move: move.trim(),
            equity: parseFloat(equity)
          }
          moves.push(moveData)

          // First move is best
          if (parseInt(rank) === 1) {
            bestEquity = moveData.equity
          }

          // Try to match actual move (simplified matching)
          if (this.moveMatches(moveData.move, actualMove)) {
            actualEquity = moveData.equity
          }
        } else if (line.trim() === '') {
          break // End of table
        }
      }
    }

    // If we couldn't find the actual move, default to best
    if (actualEquity === null && bestEquity !== null) {
      actualEquity = bestEquity
    }

    return { moves, bestEquity, actualEquity }
  }

  /**
   * Simple move matching logic (can be improved)
   */
  private moveMatches(gnuMove: string, actualMove: any): boolean {
    // Very basic matching - this could be improved significantly
    const actualMoveStr = String(actualMove)
    return gnuMove.includes(actualMoveStr) || actualMoveStr.includes(gnuMove)
  }

  /**
   * Classify error type based on equity loss
   */
  private classifyError(equityLoss: number): 'none' | 'doubtful' | 'error' | 'blunder' | 'very_bad' {
    if (equityLoss < 0.020) return 'none'
    if (equityLoss < 0.040) return 'doubtful'
    if (equityLoss < 0.080) return 'error'
    if (equityLoss < 0.160) return 'blunder'
    return 'very_bad'
  }

  /**
   * Get skill level description from PR
   */
  static getSkillLevel(pr: number): string {
    if (pr <= 2.5) return 'World Class'
    if (pr <= 5) return 'Expert'
    if (pr <= 7.5) return 'Advanced'
    if (pr <= 12.5) return 'Intermediate'
    if (pr <= 17.5) return 'Casual'
    return 'Beginner'
  }
}