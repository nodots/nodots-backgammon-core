import { BackgammonGame, BackgammonPlayer, BackgammonMoveDirection, BackgammonMoveSkeleton } from '@nodots-llc/backgammon-types'
import { RobotSkillLevel } from '../../Robot'

export interface BackgammonAIPlugin {
  // Plugin metadata
  name: string;
  version: string;
  description: string;
  
  // Core AI methods (required)
  generateMove(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<BackgammonMoveSkeleton>;
  shouldOfferDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<boolean>;
  shouldAcceptDouble(gameState: BackgammonGame, difficulty: RobotSkillLevel): Promise<boolean>;
  
  // Plugin capabilities
  getSupportedDifficulties(): RobotSkillLevel[];
  getCapabilities(): AICapabilities;
  
  // Optional advanced features
  evaluatePosition?(gameState: BackgammonGame): Promise<number>;
  explainMove?(move: BackgammonMoveSkeleton, gameState: BackgammonGame): Promise<string>;
  getOpeningRecommendation?(roll: number[], gameState: BackgammonGame): Promise<BackgammonMoveSkeleton>;
  analyzeThreat?(gameState: BackgammonGame, player: BackgammonPlayer): Promise<ThreatAnalysis>;
}

export interface AICapabilities {
  supportsPositionEvaluation: boolean;
  supportsMoveExplanation: boolean;
  supportsOpeningBook: boolean;
  supportsThreatAnalysis: boolean;
  supportsMultiMoveSequencing: boolean;
  supportsGamePhaseRecognition: boolean;
}

export interface ThreatAnalysis {
  blitzThreat: number;
  backgameThreat: number;
  racingAdvantage: number;
  vulnerableBlots: number[];
  escapeRoutes: number[];
}

export interface Position {
  position: number;
  direction: BackgammonMoveDirection;
}