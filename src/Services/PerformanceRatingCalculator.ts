import { BackgammonGame } from '@nodots-llc/backgammon-types'
import type { MoveHint, MoveStep } from '@nodots-llc/gnubg-hints'
import {
  buildHintContextFromGame,
  GnubgColorNormalization,
  gnubgHints,
} from '@nodots-llc/backgammon-ai'
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

interface ExecutedMoveStep extends MoveStep {}

export class PerformanceRatingCalculator {
  constructor() {}

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

      const isAvailable = await gnubgHints.isAvailable()
      if (!isAvailable) {
        throw new Error(
          `${gnubgHints.getBuildInstructions()}\n\nGNU Backgammon hints are required for performance rating analysis.`
        )
      }

      const playerStats: Record<string, PlayerPR> = {}

      for (let i = 0; i < moveActions.length; i++) {
        const action = moveActions[i]
        const gameState = gameStates[i]

        if (!gameState) {
          logger.warn(`No game state available for move ${i}`)
          continue
        }

        if (!playerStats[action.player]) {
          playerStats[action.player] = {
            player: action.player,
            totalMoves: 0,
            analyzedMoves: 0,
            totalEquityLoss: 0,
            errors: { doubtful: 0, error: 0, blunder: 0, veryBad: 0 },
            averageEquityLoss: 0,
            performanceRating: 0,
          }
        }

        playerStats[action.player].totalMoves++

        try {
          const diceTuple: [number, number] = [
            action.dice?.[0] ?? 0,
            action.dice?.[1] ?? 0,
          ]

          logger.info(`Analyzing move ${i + 1} by ${action.player}`)

          const moveAnalysis = await this.analyzeMoveWithGnuBG(
            gameState,
            diceTuple,
            action.move,
            action.player,
            i + 1,
          )

          if (moveAnalysis) {
            playerStats[action.player].analyzedMoves++
            playerStats[action.player].totalEquityLoss += moveAnalysis.equityLoss

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

      for (const player of Object.values(playerStats)) {
        if (player.analyzedMoves > 0) {
          player.averageEquityLoss =
            player.totalEquityLoss / player.analyzedMoves
          player.performanceRating = player.averageEquityLoss * 500
        }
      }

      logger.info(`PR calculation complete for game ${gameId}`)

      return {
        gameId,
        playerResults: playerStats,
        analysisComplete: true,
      }
    } catch (error) {
      logger.error(`PR calculation failed for game ${gameId}:`, error)
      return {
        gameId,
        playerResults: {},
        analysisComplete: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async analyzeMoveWithGnuBG(
    gameState: BackgammonGame,
    dice: [number, number],
    moveExecuted: any,
    playerId: string,
    moveNumber: number,
  ): Promise<PRMoveAnalysis | null> {
    try {
      const { request, normalization } = buildHintContextFromGame(gameState, {
        dice,
      })

      const hints = await gnubgHints.getMoveHints(request, 12)
      if (!Array.isArray(hints) || hints.length === 0) {
        logger.warn('No hints returned for PR analysis')
        return null
      }

      const bestHint = hints[0]
      const actualStep = this.extractActualMoveStep(
        moveExecuted,
        playerId,
        gameState,
        normalization,
      )
      const actualHint = actualStep
        ? this.findHintForStep(hints, actualStep)
        : undefined

      const bestEquity = bestHint?.equity ?? null
      const actualEquity = actualHint?.equity ?? null

      if (bestEquity === null || actualEquity === null) {
        logger.warn(
          `Unable to determine equities for move ${moveNumber}: best=${bestEquity}, actual=${actualEquity}`,
        )
        return null
      }

      const equityLoss = Math.max(0, bestEquity - actualEquity)
      const errorType = this.classifyError(equityLoss)

      return {
        player: playerId,
        moveNumber,
        positionId: exportToGnuPositionId(gameState),
        moveExecuted: actualStep ? this.formatMoveStep(actualStep) : 'unknown',
        bestMove: this.formatHint(bestHint),
        equityLoss,
        errorType,
      }
    } catch (error) {
      logger.warn(`GNU BG analysis failed for move ${moveNumber}: ${error}`)
      return null
    }
  }

  private extractActualMoveStep(
    move: any,
    playerId: string,
    gameState: BackgammonGame,
    normalization: GnubgColorNormalization,
  ): ExecutedMoveStep | null {
    const payload = move?.makeMove ?? move

    if (!payload) {
      return null
    }

    const executingPlayer = gameState.players.find((p) => p.id === playerId)
    if (!executingPlayer) {
      return null
    }

    const normalizedColor = normalization.toGnu[executingPlayer.color]
    if (!normalizedColor) {
      return null
    }

    const moveKind = (payload.moveKind || 'point-to-point') as MoveStep['moveKind']
    const originPosition = typeof payload.originPosition === 'number'
      ? payload.originPosition
      : moveKind === 'reenter'
        ? 0
        : null
    const destinationPosition = typeof payload.destinationPosition === 'number'
      ? payload.destinationPosition
      : moveKind === 'bear-off'
        ? 0
        : null

    if (originPosition === null || destinationPosition === null) {
      return null
    }

    const fromContainer: MoveStep['fromContainer'] = moveKind === 'reenter' ? 'bar' : 'point'
    const toContainer: MoveStep['toContainer'] = moveKind === 'bear-off' ? 'off' : 'point'

    return {
      player: normalizedColor,
      moveKind,
      isHit: Boolean(payload.isHit),
      from: originPosition,
      to: destinationPosition,
      fromContainer,
      toContainer,
    }
  }

  private findHintForStep(
    hints: MoveHint[],
    target: MoveStep,
  ): MoveHint | undefined {
    return hints.find((hint) =>
      hint.moves.some((step) => this.stepsEqual(step, target)),
    )
  }

  private stepsEqual(a: MoveStep, b: MoveStep): boolean {
    return (
      a.from === b.from &&
      a.to === b.to &&
      a.fromContainer === b.fromContainer &&
      a.toContainer === b.toContainer &&
      a.moveKind === b.moveKind
    )
  }

  private formatHint(hint: MoveHint): string {
    if (!hint.moves || hint.moves.length === 0) {
      return 'unknown'
    }

    return hint.moves
      .map((step) => this.formatMoveStep(step))
      .join(' ')
  }

  private formatMoveStep(step: MoveStep): string {
    if (step.fromContainer === 'bar') {
      return `bar/${step.to}`
    }
    if (step.toContainer === 'off') {
      return `${step.from}/off`
    }
    return `${step.from}/${step.to}`
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
