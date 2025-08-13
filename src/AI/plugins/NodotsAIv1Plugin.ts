import {
  BackgammonGame,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import { Game } from '../../Game'
import { RobotSkillLevel } from '../../Robot'
import { logger } from '../../utils/logger'
import { AICapabilities, BackgammonAIPlugin } from '../interfaces/AIPlugin'

/**
 * Nodots Backgammon AI v1 Plugin
 * 
 * This is the foundation for developing our own AI system.
 * Features:
 * - Standard opening book for common rolls
 * - Basic heuristics like "always make the 5 point"
 * - Special handling for key rolls like [6,5], [5,5], [3,1], [4,2]
 */
export class NodotsAIv1Plugin implements BackgammonAIPlugin {
  name = 'nodots-ai-v1'
  version = '1.0.0'
  description = 'Nodots Backgammon AI v1 with opening book and fundamental heuristics'

  // Opening book for standard backgammon rolls
  private readonly openingBook: Record<string, string[]> = {
    // Classic opening moves (from white's perspective)
    '6-5': ['24/13'], // Runner
    '6-4': ['24/14'], // Runner  
    '6-3': ['24/15'], // Runner
    '6-2': ['24/16'], // Runner
    '6-1': ['13/7', '8/7'], // Split and make bar point
    
    '5-5': ['24/14', '24/14', '13/8', '13/8'], // Double 5s - two runners, two to 8 point
    '5-4': ['24/15'], // Runner
    '5-3': ['24/16'], // Runner  
    '5-2': ['24/17'], // Runner
    '5-1': ['24/18'], // Runner

    '4-4': ['24/16', '24/16', '13/9', '13/9'], // Double 4s
    '4-3': ['24/16'], // Runner
    '4-2': ['8/4', '6/4'], // Make the 4 point
    '4-1': ['24/20', '13/12'], // Conservative

    '3-3': ['24/18', '24/18', '13/10', '13/10'], // Double 3s
    '3-2': ['24/18'], // Runner
    '3-1': ['8/5', '6/5'], // Make the 5 point - THE classic opening

    '2-2': ['24/18', '24/18', '13/11', '13/11'], // Double 2s  
    '2-1': ['24/21'], // Runner

    '1-1': ['24/18', '24/18', '13/12', '13/12'], // Double 1s
  }

  async generateMove(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<BackgammonMoveSkeleton> {
    try {
      const possibleMovesResult = Game.getPossibleMoves(gameState)

      if (!possibleMovesResult.success || !possibleMovesResult.possibleMoves) {
        throw new Error('No possible moves available')
      }

      const possibleMoves = possibleMovesResult.possibleMoves
      const activePlayer = gameState.activePlayer

      if (!activePlayer || !activePlayer.dice) {
        return possibleMoves[0]
      }

      // Check if this is an opening move (both players haven't moved much)
      if (this.isOpeningPosition(gameState)) {
        const openingMove = this.selectOpeningMove(gameState, possibleMoves)
        if (openingMove) {
          logger.info(`🧠 NBG-v1 using opening book move`)
          return openingMove
        }
      }

      // Apply basic heuristics for non-opening positions
      return this.selectHeuristicMove(possibleMoves, gameState, difficulty)

    } catch (error) {
      logger.error('Error in NodotsAIv1Plugin.generateMove:', error)
      // Fallback to first available move
      const possibleMovesResult = Game.getPossibleMoves(gameState)
      if (possibleMovesResult.success && possibleMovesResult.possibleMoves && possibleMovesResult.possibleMoves.length > 0) {
        return possibleMovesResult.possibleMoves[0]
      }
      throw new Error('No moves available')
    }
  }

  async shouldOfferDouble(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<boolean> {
    // Conservative doubling for v1 - only double with significant advantage
    const activePlayer = gameState.activePlayer
    const opponent = gameState.players.find(p => p.id !== activePlayer?.id)
    
    if (!activePlayer || !opponent) return false

    // Very conservative - only offer double in clearly winning positions
    // This is a placeholder for more sophisticated evaluation
    return false
  }

  async shouldAcceptDouble(
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): Promise<boolean> {
    // Conservative acceptance - accept unless clearly losing
    const activePlayer = gameState.activePlayer
    const opponent = gameState.players.find(p => p.id !== activePlayer?.id)
    
    if (!activePlayer || !opponent) return false

    // Conservative acceptance - only drop if hopeless
    // This is a placeholder for more sophisticated evaluation
    return true
  }

  getSupportedDifficulties(): RobotSkillLevel[] {
    return ['beginner', 'intermediate', 'advanced']
  }

  getCapabilities(): AICapabilities {
    return {
      supportsPositionEvaluation: false,
      supportsMoveExplanation: true,
      supportsOpeningBook: true,
      supportsThreatAnalysis: false,
      supportsMultiMoveSequencing: true,
      supportsGamePhaseRecognition: true,
    }
  }

  /**
   * Check if this is still an opening position
   */
  private isOpeningPosition(gameState: BackgammonGame): boolean {
    // Simple heuristic: if this is the first move of the game
    // In a more sophisticated version, we'd check if players have made minimal moves
    
    // For now, assume any position where most checkers are still on starting points
    // is an opening position
    if (!gameState.board) return false

    const activePlayer = gameState.activePlayer
    if (!activePlayer) return false

    // Check if this looks like early in the game
    // This is a simplified check - in practice we'd want more sophisticated detection
    return true // For now, always try opening book first
  }

  /**
   * Select a move from the opening book if available
   */
  private selectOpeningMove(
    gameState: BackgammonGame,
    possibleMoves: any[]
  ): any | null {
    const activePlayer = gameState.activePlayer
    if (!activePlayer || !activePlayer.dice) return null

    const roll = activePlayer.dice.currentRoll
    if (!roll || roll.length !== 2) return null

    // Sort roll for consistent lookup
    const sortedRoll = [...roll].sort((a, b) => b - a)
    const rollKey = `${sortedRoll[0]}-${sortedRoll[1]}`

    logger.debug(`Looking for opening move for roll: ${rollKey}`)

    const bookMoves = this.openingBook[rollKey]
    if (!bookMoves) {
      logger.debug(`No opening book entry for roll: ${rollKey}`)
      return null
    }

    // Try to match book moves with possible moves
    // This is a simplified matching - in practice we'd need more sophisticated move parsing
    logger.debug(`Found opening book moves: ${bookMoves.join(', ')}`)
    
    // For special rolls, apply the specific strategies
    if (rollKey === '3-1') {
      // Make the 5 point - look for moves from 8 to 5 and 6 to 5
      return this.findMakePointMove(possibleMoves, 5, activePlayer)
    } else if (rollKey === '4-2') {
      // Make the 4 point - look for moves from 8 to 4 and 6 to 4
      return this.findMakePointMove(possibleMoves, 4, activePlayer)
    } else if (rollKey === '6-1') {
      // Split and make bar point - prioritize making the 7 point
      return this.findMakePointMove(possibleMoves, 7, activePlayer) || this.findRunnerMove(possibleMoves, activePlayer)
    } else if (rollKey === '6-5') {
      // Runner move - escape a back checker
      return this.findRunnerMove(possibleMoves, activePlayer)
    }

    // For other rolls, look for moves that match the book suggestions
    return this.findBestMatchingMove(possibleMoves, bookMoves, activePlayer)
  }

  /**
   * Find a move that makes a specific point
   */
  private findMakePointMove(possibleMoves: any[], targetPoint: number, activePlayer: BackgammonPlayer): any | null {
    const direction = activePlayer.direction

    // Look for moves that land on the target point from player's perspective
    const makingMoves = possibleMoves.filter(move => {
      if (!move.destination || move.destination.kind !== 'point') return false
      
      const destPos = typeof move.destination.position === 'object' 
        ? move.destination.position[direction]
        : 0

      return destPos === targetPoint
    })

    if (makingMoves.length > 0) {
      logger.info(`🎯 NBG-v1 making the ${targetPoint} point`)
      return makingMoves[0]
    }

    return null
  }

  /**
   * Find a runner move (escaping a back checker)
   */
  private findRunnerMove(possibleMoves: any[], activePlayer: BackgammonPlayer): any | null {
    const direction = activePlayer.direction

    // Look for moves from the back points (24, 23, 22, etc.)
    const runnerMoves = possibleMoves.filter(move => {
      if (!move.origin || move.origin.kind !== 'point') return false
      
      const originPos = typeof move.origin.position === 'object'
        ? move.origin.position[direction]
        : 25

      // Runner moves come from the opponent's home board (positions 19-24)
      return originPos >= 19 && originPos <= 24
    })

    if (runnerMoves.length > 0) {
      logger.info(`🏃 NBG-v1 making runner move`)
      // Prefer moves that advance the most
      runnerMoves.sort((a, b) => {
        const aOrigin = typeof a.origin.position === 'object' ? a.origin.position[direction] : 25
        const aDest = typeof a.destination.position === 'object' ? a.destination.position[direction] : 0
        const bOrigin = typeof b.origin.position === 'object' ? b.origin.position[direction] : 25
        const bDest = typeof b.destination.position === 'object' ? b.destination.position[direction] : 0
        
        const aProgress = aOrigin - aDest
        const bProgress = bOrigin - bDest
        
        return bProgress - aProgress // More progress first
      })
      
      return runnerMoves[0]
    }

    return null
  }

  /**
   * Find the best matching move from the opening book
   */
  private findBestMatchingMove(possibleMoves: any[], bookMoves: string[], activePlayer: BackgammonPlayer): any | null {
    // This is a simplified implementation
    // In practice, we'd need to parse the book move notation (e.g., "24/13") 
    // and match it to the actual possible moves
    
    logger.debug(`Trying to match ${possibleMoves.length} possible moves with book moves: ${bookMoves.join(', ')}`)
    
    // For now, return the first possible move as a fallback
    // TODO: Implement proper move notation parsing and matching
    return possibleMoves[0]
  }

  /**
   * Select move using basic heuristics for non-opening positions
   */
  private selectHeuristicMove(
    possibleMoves: any[],
    gameState: BackgammonGame,
    difficulty: RobotSkillLevel
  ): any {
    const activePlayer = gameState.activePlayer
    if (!activePlayer) return possibleMoves[0]

    const direction = activePlayer.direction

    const scoredMoves = possibleMoves.map((move) => {
      let score = 0

      const originPos =
        typeof move.origin.position === 'object'
          ? move.origin.position[direction]
          : 25

      const destPos =
        typeof move.destination.position === 'object'
          ? move.destination.position[direction]
          : 0

      // 1. HIGHEST PRIORITY: Bear-off moves
      if (move.destination.kind === 'bear-off') {
        score += 300
      }

      // 2. HIGH PRIORITY: Make key points (5, 4, 7, 20, 21)
      if (move.destination.kind === 'point') {
        if ([5, 4, 7, 20, 21].includes(destPos)) {
          score += 100
        }
      }

      // 3. Progress scoring - advance checkers toward home
      score += (originPos - destPos) * 20

      // 4. SAFETY: Heavy penalty for leaving blots
      if (move.origin.checkers?.length === 1) {
        const isInOpponentHome = originPos >= 19 && originPos <= 24
        score -= isInOpponentHome ? 80 : 50
      }

      // 5. AGGRESSIVE: Reward hitting opponent blots
      if (
        move.destination.checkers?.length === 1 &&
        move.destination.checkers[0].color !== activePlayer.color
      ) {
        score += 90
      }

      // 6. BUILDING: Reward making points (landing on own checker)
      if (
        move.destination.checkers?.length === 1 &&
        move.destination.checkers[0].color === activePlayer.color
      ) {
        score += 60
      }

      // 7. ESCAPE: High priority for escaping from opponent's home board
      if (originPos >= 19 && originPos <= 24) {
        score += 70
      }

      // 8. PRIME BUILDING: Bonus for moves that build consecutive points
      if (this.helpsBuildPrime(move, gameState, activePlayer)) {
        score += 40
      }

      return { move, score }
    })

    // Sort by score and return the best move
    scoredMoves.sort((a, b) => b.score - a.score)
    
    const selectedMove = scoredMoves[0].move
    logger.info(`🧠 NBG-v1 selected move with score: ${scoredMoves[0].score}`)
    
    return selectedMove
  }

  /**
   * Check if a move helps build a prime (consecutive points)
   */
  private helpsBuildPrime(move: any, gameState: BackgammonGame, activePlayer: BackgammonPlayer): boolean {
    if (!move.destination || move.destination.kind !== 'point') return false
    
    const direction = activePlayer.direction
    const destPos = typeof move.destination.position === 'object' 
      ? move.destination.position[direction]
      : 0

    // Check if landing on this point creates or extends consecutive owned points
    // This is a simplified implementation - full prime detection would be more complex
    
    if (destPos >= 7 && destPos <= 12) {
      // Building in the outer board is good for primes
      return true
    }

    return false
  }

  /**
   * Explain the reasoning behind a move (future enhancement)
   */
  async explainMove(move: BackgammonMoveSkeleton, gameState: BackgammonGame): Promise<string> {
    return "Move selected using Nodots AI v1 heuristics including opening book and basic strategy."
  }
}