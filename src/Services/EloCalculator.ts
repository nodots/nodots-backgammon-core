import type { EloConfig, EloCalculationResult } from '@nodots-llc/backgammon-types'
import { DEFAULT_ELO_CONFIG } from '@nodots-llc/backgammon-types'

/**
 * Standard ELO rating calculator for backgammon.
 * Pure math — no database or AI dependencies.
 */
export class EloCalculator {
  private config: EloConfig

  constructor(config: EloConfig = DEFAULT_ELO_CONFIG) {
    this.config = config
  }

  /**
   * Calculate expected score (probability of winning) for a player.
   * Returns a value between 0 and 1.
   */
  expectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  }

  /**
   * Determine K-factor based on rating and games played.
   * New players (< 30 games): K=32 (volatile, allows rapid convergence)
   * Elite players (2100+): K=10 (stable, small adjustments)
   * Everyone else: K=16 (standard)
   */
  getKFactor(rating: number, gamesPlayed: number): number {
    if (gamesPlayed < this.config.thresholds.newPlayerGames) {
      return this.config.kFactorNew
    }
    if (rating >= this.config.thresholds.eliteRating) {
      return this.config.kFactorElite
    }
    return this.config.kFactorEstablished
  }

  /**
   * Calculate new ELO rating after a game.
   * @param playerRating - Current rating of the player
   * @param opponentRating - Current rating of the opponent
   * @param actualScore - 1 for win, 0 for loss
   * @param gamesPlayed - Number of games the player has completed (for K-factor)
   */
  calculate(
    playerRating: number,
    opponentRating: number,
    actualScore: number,
    gamesPlayed: number
  ): EloCalculationResult {
    const expected = this.expectedScore(playerRating, opponentRating)
    const kFactor = this.getKFactor(playerRating, gamesPlayed)
    const ratingChange = Math.round(kFactor * (actualScore - expected))
    const newRating = playerRating + ratingChange

    return {
      previousRating: playerRating,
      newRating,
      ratingChange,
      expectedScore: expected,
      actualScore,
      kFactor,
      opponentRating,
    }
  }

  /**
   * Convert a Performance Rating (PR) to an approximate ELO rating.
   * Uses piecewise linear interpolation between anchor points.
   *
   * Anchor points (PR -> ELO):
   *   1  -> 2100  (Grandmaster)
   *   2  -> 1900  (Expert)
   *   5  -> 1700  (Advanced)
   *   8  -> 1500  (Intermediate)
   *  12  -> 1300  (Beginner)
   *  15  -> 1200  (Novice)
   *  20  -> 1100  (Bot)
   */
  static prToElo(averagePR: number): number {
    const anchors: Array<[number, number]> = [
      [1, 2100],
      [2, 1900],
      [5, 1700],
      [8, 1500],
      [12, 1300],
      [15, 1200],
      [20, 1100],
    ]

    // Clamp to range
    if (averagePR <= anchors[0][0]) return anchors[0][1]
    if (averagePR >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1]

    // Find the two anchor points that bracket averagePR
    for (let i = 0; i < anchors.length - 1; i++) {
      const [pr1, elo1] = anchors[i]
      const [pr2, elo2] = anchors[i + 1]
      if (averagePR >= pr1 && averagePR <= pr2) {
        const t = (averagePR - pr1) / (pr2 - pr1)
        return Math.round(elo1 + t * (elo2 - elo1))
      }
    }

    // Fallback (should not reach here given clamp above)
    return this.prototype ? 1500 : 1500
  }
}
