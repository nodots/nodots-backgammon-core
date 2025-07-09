import { BackgammonGame, BackgammonPlayer, BackgammonMoveDirection, BackgammonMoveSkeleton } from '@nodots-llc/backgammon-types'
import { BackgammonAIPlugin, AICapabilities } from '../interfaces/AIPlugin'
import { RobotSkillLevel } from '../../Robot'
import { Game } from '../../Game'
import { PositionAnalyzer } from '../utils/PositionAnalyzer'

export class BasicAIPlugin implements BackgammonAIPlugin {
  name = 'basic-ai';
  version = '1.0.0';
  description = 'Basic AI with heuristic-based move selection using direction-based positioning';
  
  async generateMove(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<BackgammonMoveSkeleton> {
    const possibleMovesResult = Game.getPossibleMoves(gameState);
    
    if (!possibleMovesResult.success || !possibleMovesResult.possibleMoves) {
      throw new Error('No possible moves available');
    }
    
    const possibleMoves = possibleMovesResult.possibleMoves;
    
    switch (difficulty) {
      case 'beginner':
        return this.selectBeginnerMove(possibleMoves, gameState);
      case 'intermediate':
        return this.selectIntermediateMove(possibleMoves, gameState);
      case 'advanced':
        return this.selectAdvancedMove(possibleMoves, gameState);
      default:
        return possibleMoves[0];
    }
  }
  
  async shouldOfferDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<boolean> {
    // Basic doubling logic - can be enhanced
    const activePlayer = gameState.activePlayer;
    if (!activePlayer) return false;
    
    const pipCount = PositionAnalyzer.calculatePipCount(gameState, activePlayer);
    const opponent = gameState.players.find(p => p.id !== activePlayer.id);
    if (!opponent) return false;
    
    const opponentPipCount = PositionAnalyzer.calculatePipCount(gameState, opponent);
    
    // Simple heuristic: offer double if significantly ahead
    return pipCount < opponentPipCount - 20;
  }
  
  async shouldAcceptDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<boolean> {
    // Basic accept logic - can be enhanced
    const activePlayer = gameState.activePlayer;
    if (!activePlayer) return false;
    
    const pipCount = PositionAnalyzer.calculatePipCount(gameState, activePlayer);
    const opponent = gameState.players.find(p => p.id !== activePlayer.id);
    if (!opponent) return false;
    
    const opponentPipCount = PositionAnalyzer.calculatePipCount(gameState, opponent);
    
    // Simple heuristic: accept if not too far behind
    return pipCount < opponentPipCount + 30;
  }
  
  getSupportedDifficulties(): RobotSkillLevel[] {
    return ['beginner', 'intermediate', 'advanced'];
  }
  
  getCapabilities(): AICapabilities {
    return {
      supportsPositionEvaluation: false,
      supportsMoveExplanation: false,
      supportsOpeningBook: false,
      supportsThreatAnalysis: false,
      supportsMultiMoveSequencing: false,
      supportsGamePhaseRecognition: false
    };
  }
  
  private selectBeginnerMove(possibleMoves: any[], gameState: BackgammonGame): any {
    // Simple random selection for beginners
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }
  
  private selectIntermediateMove(possibleMoves: any[], gameState: BackgammonGame): any {
    const activePlayer = gameState.activePlayer;
    if (!activePlayer) return possibleMoves[0];

    const direction = activePlayer.direction; // CRITICAL: Use direction

    const scoredMoves = possibleMoves.map((move) => {
      let score = 0;

      // Get positions from player's direction perspective
      const originPos = typeof move.origin.position === 'object'
        ? move.origin.position[direction] // Use player's direction!
        : 25; // Bar

      const destPos = typeof move.destination.position === 'object'
        ? move.destination.position[direction] // Use player's direction!
        : 0; // Bear off

      // 1. Progress scoring - all players move from higher to lower numbers
      score += (originPos - destPos) * 15;

      // 2. Prioritize bearing off moves
      if (move.destination.kind === 'bear-off') {
        score += 100;
      }

      // 3. Safety - penalty for leaving blots
      if (move.origin.checkers?.length === 1) {
        score -= 60;
      }

      // 4. Bonus for making points
      if (move.destination.checkers?.length === 1 &&
          move.destination.checkers[0].color === activePlayer.color) {
        score += 30;
      }

      // 5. Escape from opponent's home board (always 19-24 from player's perspective)
      if (originPos >= 19 && originPos <= 24) {
        score += 20;
      }

      // 6. Runner moves (always 22-24 from player's perspective)
      if (originPos >= 22 && originPos <= 24) {
        score += 5;
      }

      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }
  
  private selectAdvancedMove(possibleMoves: any[], gameState: BackgammonGame): any {
    const activePlayer = gameState.activePlayer;
    if (!activePlayer) return possibleMoves[0];

    const direction = activePlayer.direction; // CRITICAL: Use direction

    const scoredMoves = possibleMoves.map((move) => {
      let score = 0;

      // Get positions from player's direction perspective
      const originPos = typeof move.origin.position === 'object'
        ? move.origin.position[direction] // Use player's direction!
        : 25;

      const destPos = typeof move.destination.position === 'object'
        ? move.destination.position[direction] // Use player's direction!
        : 0;

      // 1. Progress scoring - all players move high→low
      score += (originPos - destPos) * 12;

      // 2. Bear-off priority
      if (move.destination.kind === 'bear-off') {
        score += 150;
      }

      // 3. Advanced safety evaluation
      if (move.origin.checkers?.length === 1) {
        // Blots in opponent's home (19-24) are more dangerous
        const isInOpponentHome = originPos >= 19 && originPos <= 24;
        score -= isInOpponentHome ? 50 : 35;
      }

      // 4. Hitting opponent's blots
      if (move.destination.checkers?.length === 1 &&
          move.destination.checkers[0].color !== activePlayer.color) {
        score += 60;
      }

      // 5. Building points
      if (move.destination.checkers?.length >= 1 &&
          move.destination.checkers[0].color === activePlayer.color) {
        score += 25;
      }

      // 6. Escape priority from opponent's home board (19-24)
      if (originPos >= 19 && originPos <= 24) {
        score += 40;
      }

      // 7. Avoid over-stacking
      if (move.destination.checkers?.length >= 3) {
        score -= 10;
      }

      // 8. Runner strategy (22-24)
      if (originPos >= 22 && originPos <= 24 && move.origin.checkers?.length > 1) {
        score += 15;
      }

      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }
}