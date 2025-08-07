import {
  BackgammonGame,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Game } from '../../Game'
import { RobotSkillLevel } from '../../Robot'
import { logger } from '../../utils/logger'
import { AICapabilities, BackgammonAIPlugin } from '../interfaces/AIPlugin'

/**
 * BlotRobotAIPlugin - Specialized AI strategy that intentionally leaves blots (single vulnerable checkers)
 * 
 * Purpose: This AI is designed specifically for testing hit scenarios and undo functionality.
 * It prioritizes moves that create hitting opportunities for the opponent by:
 * 1. Leaving single checkers exposed (blots) whenever possible
 * 2. Avoiding building safe positions or blocking points
 * 3. Making moves that maximize opponent hit opportunities
 * 
 * This creates reliable, repeatable test scenarios where hits occur naturally and quickly,
 * making undo bug reproduction much more consistent.
 */
export class BlotRobotAIPlugin implements BackgammonAIPlugin {
  name = 'blot-robot'
  version = '1.0.0'
  description = 'AI that intentionally leaves blots to facilitate hit testing - optimized for undo bug reproduction'

  async generateMove(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<BackgammonMoveSkeleton> {
    const possibleMovesResult = Game.getPossibleMoves(gameState)

    if (!possibleMovesResult.success || !possibleMovesResult.possibleMoves) {
      throw new Error('No possible moves available')
    }

    const possibleMoves = possibleMovesResult.possibleMoves
    
    logger.info(`🎯 BlotRobot analyzing ${possibleMoves.length} possible moves to create hit opportunities`)

    // Always use blot-leaving strategy regardless of difficulty for consistent testing
    return this.selectBlotLeavingMove(possibleMoves, gameState)
  }

  /**
   * Public method for Robot class to use directly with possibleMoves
   * This allows the Robot class to call BlotRobot strategy without going through the full AI plugin system
   */
  static selectBlotMove(
    possibleMoves: any[],
    gameState: BackgammonGame
  ): any {
    const plugin = new BlotRobotAIPlugin()
    return plugin.selectBlotLeavingMove(possibleMoves, gameState)
  }

  async shouldOfferDouble(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<boolean> {
    // BlotRobot never offers doubles - it wants to create hitting scenarios, not end games quickly
    return false
  }

  async shouldAcceptDouble(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<boolean> {
    // BlotRobot always accepts doubles - more opportunities for hits in higher stakes games
    return true
  }

  getSupportedDifficulties(): RobotSkillLevel[] {
    return ['beginner', 'intermediate', 'advanced']
  }

  getCapabilities(): AICapabilities {
    return {
      supportsPositionEvaluation: false,
      supportsMoveExplanation: true, // Can explain why it's leaving blots
      supportsOpeningBook: false,
      supportsThreatAnalysis: false,
      supportsMultiMoveSequencing: false,
      supportsGamePhaseRecognition: false,
    }
  }

  async explainMove(
    move: BackgammonMoveSkeleton,
    gameState: BackgammonGame
  ): Promise<string> {
    const activePlayer = gameState.activePlayer
    if (!activePlayer) return 'No active player available'

    const originPos = typeof move.origin.position === 'object' 
      ? move.origin.position[activePlayer.direction]
      : 25

    const destPos = typeof move.destination.position === 'object'
      ? move.destination.position[activePlayer.direction] 
      : 0

    // Check if this move leaves a blot
    const leavesBlot = move.origin.checkers?.length === 1
    const createsSafePosition = move.destination.checkers?.length === 1 && 
      move.destination.checkers[0].color === activePlayer.color

    if (leavesBlot) {
      return `BlotRobot deliberately leaves a blot at position ${originPos} to create hit opportunities for opponent`
    } else if (!createsSafePosition) {
      return `BlotRobot avoids building safe positions, moving from ${originPos} to ${destPos} to stay vulnerable`
    } else {
      return `BlotRobot makes necessary move from ${originPos} to ${destPos} (limited options available)`
    }
  }

  /**
   * Core blot-leaving strategy: Prioritize moves that create hit opportunities for opponent
   */
  private selectBlotLeavingMove(
    possibleMoves: any[],
    gameState: BackgammonGame
  ): any {
    const activePlayer = gameState.activePlayer
    if (!activePlayer) return possibleMoves[0]

    const direction = activePlayer.direction

    logger.info(`🎯 BlotRobot using ${direction} direction for position analysis`)

    const scoredMoves = possibleMoves.map((move, index) => {
      let score = 0

      const originPos = typeof move.origin.position === 'object'
        ? move.origin.position[direction]
        : 25 // Bar

      const destPos = typeof move.destination.position === 'object'
        ? move.destination.position[direction]
        : 0 // Bear off

      logger.debug(`🎯 BlotRobot analyzing move ${index + 1}: ${originPos} → ${destPos}`)

      // 1. HIGHEST PRIORITY: Leaving blots (single checkers exposed)
      if (move.origin.checkers?.length === 1) {
        score += 1000 // Massive bonus for leaving blots
        logger.debug(`  ✅ BLOT BONUS: +1000 for leaving single checker exposed at ${originPos}`)
      }

      // 2. SECOND PRIORITY: Avoid building safe positions
      // Penalty for landing on a point with own checker (making it safe)
      if (move.destination.checkers?.length === 1 && 
          move.destination.checkers[0].color === activePlayer.color) {
        score -= 500 // Large penalty for making points safe
        logger.debug(`  ❌ SAFETY PENALTY: -500 for building safe position at ${destPos}`)
      }

      // 3. THIRD PRIORITY: Spread checkers to create more blots
      // Bonus for landing on empty points (creating isolated checkers)
      if (move.destination.checkers?.length === 0) {
        score += 300 // Bonus for creating new blots
        logger.debug(`  ✅ NEW BLOT BONUS: +300 for landing on empty point ${destPos}`)
      }

      // 4. AVOID bearing off early - we want to stay on the board for hits
      if (move.destination.kind === 'bear-off') {
        score -= 200 // Penalty for bearing off (but don't completely avoid it)
        logger.debug(`  ❌ BEAR-OFF PENALTY: -200 for removing checker from board`)
      }

      // 5. PREFER moves that enter opponent's home board (high risk positions)
      if (originPos <= 6 || destPos <= 6) {
        score += 100 // Bonus for risky positions
        logger.debug(`  ✅ RISK BONUS: +100 for position in opponent's home board`)
      }

      // 6. AVOID stacking checkers (multiple checkers on same point)
      if (move.destination.checkers?.length >= 2 && 
          move.destination.checkers[0].color === activePlayer.color) {
        score -= 150 // Penalty for stacking
        logger.debug(`  ❌ STACKING PENALTY: -150 for adding to stack at ${destPos}`)
      }

      // 7. Small progress bonus to ensure some forward movement
      const progress = originPos - destPos
      if (progress > 0) {
        score += progress * 5 // Small bonus for forward progress
        logger.debug(`  ➡️  PROGRESS BONUS: +${progress * 5} for ${progress} points forward`)
      }

      logger.debug(`  🎯 Move ${index + 1} total score: ${score}`)

      return { move, score, originPos, destPos }
    })

    // Sort by score (highest first) and return the best blot-leaving move
    scoredMoves.sort((a, b) => b.score - a.score)
    
    const selectedMove = scoredMoves[0]
    logger.info(`🎯 BlotRobot selected move: ${selectedMove.originPos} → ${selectedMove.destPos} (score: ${selectedMove.score})`)

    // Log why this move was chosen for testing transparency
    if (selectedMove.score >= 1000) {
      logger.info(`🎯 BlotRobot reasoning: Selected move that leaves a blot for opponent to hit`)
    } else if (selectedMove.score >= 300) {
      logger.info(`🎯 BlotRobot reasoning: Selected move that creates new vulnerable position`)
    } else {
      logger.info(`🎯 BlotRobot reasoning: Selected least safe option from available moves`)
    }

    return selectedMove.move
  }
}