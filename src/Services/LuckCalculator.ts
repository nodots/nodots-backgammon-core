/**
 * Luck Calculator Service
 *
 * Calculates luck values for backgammon rolls by comparing the equity of the
 * actual roll against the expected equity across all possible rolls.
 *
 * Luck = (equity with actual roll) - (expected equity across all rolls)
 *
 * Positive luck means the roll was better than average (a "joker")
 * Negative luck means the roll was worse than average (an "anti-joker")
 */

import type {
  BackgammonColor,
  RollLuck,
  PlayerLuckSummary,
  GameLuckAnalysis,
  LuckThresholds,
  LuckClassification,
} from '@nodots-llc/backgammon-types'
import { DEFAULT_LUCK_THRESHOLDS } from '@nodots-llc/backgammon-types'
import { logger } from '../utils/logger'

/**
 * All 21 distinct dice combinations with their probabilities
 * Doubles have probability 1/36, non-doubles have probability 2/36
 */
export const ALL_DICE_COMBINATIONS: Array<{
  dice: [number, number]
  probability: number
}> = [
  // Doubles (1/36 each)
  { dice: [1, 1], probability: 1 / 36 },
  { dice: [2, 2], probability: 1 / 36 },
  { dice: [3, 3], probability: 1 / 36 },
  { dice: [4, 4], probability: 1 / 36 },
  { dice: [5, 5], probability: 1 / 36 },
  { dice: [6, 6], probability: 1 / 36 },
  // Non-doubles (2/36 each)
  { dice: [1, 2], probability: 2 / 36 },
  { dice: [1, 3], probability: 2 / 36 },
  { dice: [1, 4], probability: 2 / 36 },
  { dice: [1, 5], probability: 2 / 36 },
  { dice: [1, 6], probability: 2 / 36 },
  { dice: [2, 3], probability: 2 / 36 },
  { dice: [2, 4], probability: 2 / 36 },
  { dice: [2, 5], probability: 2 / 36 },
  { dice: [2, 6], probability: 2 / 36 },
  { dice: [3, 4], probability: 2 / 36 },
  { dice: [3, 5], probability: 2 / 36 },
  { dice: [3, 6], probability: 2 / 36 },
  { dice: [4, 5], probability: 2 / 36 },
  { dice: [4, 6], probability: 2 / 36 },
  { dice: [5, 6], probability: 2 / 36 },
]

// Interface for hint provider (injected dependency)
export interface HintProvider {
  getHintsFromPositionId(
    positionId: string,
    dice: [number, number],
    maxHints?: number
  ): Promise<Array<{ equity: number }>>
}

// Lazy-loaded hint provider
let hintProvider: HintProvider | null = null

async function getHintProvider(): Promise<HintProvider> {
  if (!hintProvider) {
    // Dynamic import to avoid circular dependencies
    const moduleName = '@nodots-llc/gnubg-hints'
    const gnubg = await (Function('m', 'return import(m)')(moduleName) as Promise<any>)
    await gnubg.GnuBgHints.initialize()
    hintProvider = {
      getHintsFromPositionId: async (positionId, dice, maxHints = 1) => {
        return gnubg.GnuBgHints.getHintsFromPositionId(positionId, dice, maxHints)
      },
    }
  }
  return hintProvider
}

// Allow tests to inject a mock hint provider
export function setHintProviderForTesting(provider: HintProvider | null): void {
  hintProvider = provider
}

/**
 * Classify a luck value based on thresholds
 */
export function classifyLuck(
  luck: number,
  thresholds: LuckThresholds = DEFAULT_LUCK_THRESHOLDS
): LuckClassification {
  if (luck >= thresholds.joker) {
    return 'joker'
  } else if (luck <= thresholds.antiJoker) {
    return 'anti-joker'
  }
  return 'normal'
}

/**
 * Calculate the expected equity across all possible dice rolls for a position
 */
export async function calculateExpectedEquity(
  positionId: string
): Promise<number> {
  const provider = await getHintProvider()
  let expectedEquity = 0

  // Get best equity for each possible roll and weight by probability
  const equityPromises = ALL_DICE_COMBINATIONS.map(async ({ dice, probability }) => {
    try {
      const hints = await provider.getHintsFromPositionId(positionId, dice, 1)
      if (hints && hints.length > 0) {
        return hints[0].equity * probability
      }
      return 0
    } catch (error) {
      logger.warn(`Failed to get hints for dice ${dice}: ${error}`)
      return 0
    }
  })

  const weightedEquities = await Promise.all(equityPromises)
  expectedEquity = weightedEquities.reduce((sum, eq) => sum + eq, 0)

  return expectedEquity
}

/**
 * Calculate luck for a single roll
 */
export async function calculateRollLuck(
  positionId: string,
  dice: [number, number],
  moveNumber: number,
  playerColor: BackgammonColor,
  thresholds: LuckThresholds = DEFAULT_LUCK_THRESHOLDS
): Promise<RollLuck> {
  const provider = await getHintProvider()

  // Get equity for actual roll
  const hints = await provider.getHintsFromPositionId(positionId, dice, 1)
  const actualEquity = hints && hints.length > 0 ? hints[0].equity : 0

  // Calculate expected equity across all rolls
  const expectedEquity = await calculateExpectedEquity(positionId)

  // Luck = actual - expected
  const luck = actualEquity - expectedEquity

  return {
    dice,
    luck,
    actualEquity,
    expectedEquity,
    classification: classifyLuck(luck, thresholds),
    moveNumber,
    playerColor,
  }
}

/**
 * Luck Calculator class for analyzing games
 */
export class LuckCalculator {
  private thresholds: LuckThresholds

  constructor(thresholds: LuckThresholds = DEFAULT_LUCK_THRESHOLDS) {
    this.thresholds = thresholds
  }

  /**
   * Calculate luck for a single roll
   */
  async calculateRollLuck(
    positionId: string,
    dice: [number, number],
    moveNumber: number,
    playerColor: BackgammonColor
  ): Promise<RollLuck> {
    return calculateRollLuck(positionId, dice, moveNumber, playerColor, this.thresholds)
  }

  /**
   * Calculate luck summary for a player from their rolls
   */
  calculatePlayerSummary(
    userId: string,
    playerColor: BackgammonColor,
    rolls: RollLuck[]
  ): PlayerLuckSummary {
    const playerRolls = rolls.filter(r => r.playerColor === playerColor)
    const totalLuck = playerRolls.reduce((sum, r) => sum + r.luck, 0)
    const jokerCount = playerRolls.filter(r => r.classification === 'joker').length
    const antiJokerCount = playerRolls.filter(r => r.classification === 'anti-joker').length

    return {
      userId,
      playerColor,
      totalLuck,
      rollCount: playerRolls.length,
      jokerCount,
      antiJokerCount,
      averageLuck: playerRolls.length > 0 ? totalLuck / playerRolls.length : 0,
    }
  }

  /**
   * Analyze luck for an entire game
   * @param gameId - Game identifier
   * @param rolls - Array of roll data with position IDs
   * @param players - Map of player IDs to colors
   */
  async analyzeGame(
    gameId: string,
    rolls: Array<{
      positionId: string
      dice: [number, number]
      moveNumber: number
      playerId: string
      playerColor: BackgammonColor
    }>,
    playerMap: Map<string, { userId: string; color: BackgammonColor }>
  ): Promise<GameLuckAnalysis> {
    try {
      // Calculate luck for each roll
      const rollLucks: RollLuck[] = []

      for (const roll of rolls) {
        try {
          const rollLuck = await this.calculateRollLuck(
            roll.positionId,
            roll.dice,
            roll.moveNumber,
            roll.playerColor
          )
          rollLucks.push(rollLuck)
        } catch (error) {
          logger.warn(
            `Failed to calculate luck for move ${roll.moveNumber}: ${error}`
          )
        }
      }

      // Build player summaries
      const playerSummaries: PlayerLuckSummary[] = []
      for (const [_playerId, player] of playerMap) {
        const summary = this.calculatePlayerSummary(
          player.userId,
          player.color,
          rollLucks
        )
        playerSummaries.push(summary)
      }

      return {
        gameId,
        players: playerSummaries,
        rolls: rollLucks,
        analysisComplete: true,
        thresholds: this.thresholds,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Luck analysis failed for game ${gameId}: ${errorMessage}`)
      return {
        gameId,
        players: [],
        analysisComplete: false,
        thresholds: this.thresholds,
        error: errorMessage,
      }
    }
  }
}

// Default calculator instance
export const luckCalculator = new LuckCalculator()
