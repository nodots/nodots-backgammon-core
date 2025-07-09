// Main exports
export { RobotAIService } from './RobotAIService';
export { MoveSequenceAnalyzer } from './analyzers/MoveSequenceAnalyzer';
export { OpeningBook } from './strategies/OpeningBook';
export { DoublingCubeAnalyzer } from './analyzers/DoublingCubeAnalyzer';

// Utility exports
export { PositionAnalyzer } from './utils/PositionAnalyzer';
export { GamePhaseDetector, GamePhase } from './utils/GamePhaseDetector';

// Type exports
export type { MoveSequence } from './analyzers/MoveSequenceAnalyzer';
export type { OpeningMove } from './strategies/OpeningBook';
export type { DoublingAnalysis } from './analyzers/DoublingCubeAnalyzer';

// Re-export core types for convenience
export type {
  BackgammonGame,
  BackgammonPlayer,
  BackgammonMoveSkeleton
} from '@nodots-llc/backgammon-types';
