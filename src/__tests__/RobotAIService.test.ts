import { RobotAIService } from '../RobotAIService';
import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types';

describe('RobotAIService', () => {
  let aiService: RobotAIService;

  beforeEach(() => {
    aiService = new RobotAIService();
  });

  describe('plugin metadata', () => {
    it('should have correct plugin information', () => {
      expect(aiService.name).toBe('nodots-ai-engine');
      expect(aiService.version).toBe('2.2.1');
      expect(aiService.description).toContain('Advanced AI engine');
    });
  });

  describe('capabilities', () => {
    it('should support all advanced features', () => {
      const capabilities = aiService.getCapabilities();
      
      expect(capabilities.supportsPositionEvaluation).toBe(true);
      expect(capabilities.supportsMoveExplanation).toBe(true);
      expect(capabilities.supportsOpeningBook).toBe(true);
      expect(capabilities.supportsThreatAnalysis).toBe(true);
      expect(capabilities.supportsMultiMoveSequencing).toBe(true);
      expect(capabilities.supportsGamePhaseRecognition).toBe(true);
    });

    it('should support all difficulty levels', () => {
      const difficulties = aiService.getSupportedDifficulties();
      
      expect(difficulties).toContain('beginner');
      expect(difficulties).toContain('intermediate');
      expect(difficulties).toContain('advanced');
      expect(difficulties.length).toBe(3);
    });
  });

  describe('constructor', () => {
    it('should create service with default components', () => {
      const service = new RobotAIService();
      expect(service).toBeDefined();
    });

    it('should accept custom components', () => {
      const mockMoveAnalyzer = {} as any;
      const mockOpeningBook = {} as any;
      const mockDoublingAnalyzer = {} as any;
      
      const service = new RobotAIService({
        moveSequenceAnalyzer: mockMoveAnalyzer,
        openingBook: mockOpeningBook,
        doublingCubeAnalyzer: mockDoublingAnalyzer
      });
      
      expect(service).toBeDefined();
    });
  });
});