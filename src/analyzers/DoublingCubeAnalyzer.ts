import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types';
import { RobotSkillLevel } from '@nodots-llc/backgammon-core/src/Robot';
import { PositionAnalyzer } from '../utils/PositionAnalyzer';

export interface DoublingAnalysis {
  equity: number;
  marketWindow: number;
  shouldDouble: boolean;
  shouldTake: boolean;
  confidence: number;
}

export class DoublingCubeAnalyzer {
  shouldOfferDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): boolean {
    const analysis = this.analyzeDoublingPosition(gameState);
    
    switch (difficulty) {
      case 'beginner':
        return analysis.equity > 0.6; // Conservative doubling
      case 'intermediate':
        return analysis.equity > 0.5; // Standard doubling
      case 'advanced':
        return analysis.equity > 0.4 && analysis.marketWindow > 0.1; // Aggressive doubling
      default:
        return false;
    }
  }

  shouldAcceptDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): boolean {
    const analysis = this.analyzeDoublingPosition(gameState);
    
    switch (difficulty) {
      case 'beginner':
        return analysis.equity > -0.3; // Often takes
      case 'intermediate':
        return analysis.equity > -0.2; // Standard take/pass
      case 'advanced':
        return analysis.equity > -0.1; // Sophisticated take/pass
      default:
        return true;
    }
  }

  analyzeDoublingPosition(gameState: BackgammonGame): DoublingAnalysis {
    const activePlayer = gameState.activePlayer;
    if (!activePlayer) {
      return {
        equity: 0,
        marketWindow: 0,
        shouldDouble: false,
        shouldTake: false,
        confidence: 0
      };
    }

    const equity = this.calculateEquity(gameState, activePlayer);
    const marketWindow = this.calculateMarketWindow(gameState, activePlayer);
    
    return {
      equity,
      marketWindow,
      shouldDouble: equity > 0.5,
      shouldTake: equity > -0.2,
      confidence: this.calculateConfidence(gameState)
    };
  }

  private calculateEquity(gameState: BackgammonGame, player: BackgammonPlayer): number {
    // Calculate position equity (winning probability)
    const myPipCount = PositionAnalyzer.calculatePipCount(gameState, player);
    const opponent = gameState.players.find(p => p.color !== player.color);
    const opponentPipCount = opponent ? PositionAnalyzer.calculatePipCount(gameState, opponent) : 0;
    
    // Simple equity calculation based on pip count difference
    const pipDifference = opponentPipCount - myPipCount;
    const equity = Math.tanh(pipDifference / 50); // Normalize to [-1, 1]
    
    return equity;
  }

  private calculateMarketWindow(gameState: BackgammonGame, player: BackgammonPlayer): number {
    // Calculate market window (range where doubling is correct)
    // This is a simplified implementation
    return 0.2; // Implementation needed
  }

  private calculateConfidence(gameState: BackgammonGame): number {
    // Calculate confidence in the analysis
    // This could be based on position complexity, game phase, etc.
    return 0.8; // Implementation needed
  }
}