import { BackgammonGame, BackgammonPlayer, BackgammonMoveDirection } from '@nodots-llc/backgammon-types'
import { Game, Player, Board } from '../../index'
import { PositionAnalyzer } from '../utils/PositionAnalyzer'

describe('Position Analysis Direction Independence', () => {
  test('pip count calculation matches regardless of direction', () => {
    // Create a game with white clockwise, black counterclockwise
    const players = [
      Player.initialize('white', 'clockwise', undefined, 'player1', 'rolling', true),
      Player.initialize('black', 'counterclockwise', undefined, 'player2', 'inactive', true)
    ];
    
    const game = Game.initialize(players as any) as BackgammonGame;
    
    // Calculate pip counts for both players
    const whitePipCount = PositionAnalyzer.calculatePipCount(game, players[0]);
    const blackPipCount = PositionAnalyzer.calculatePipCount(game, players[1]);
    
    // Both players should have the same pip count (121) regardless of direction
    expect(whitePipCount).toBe(121);
    expect(blackPipCount).toBe(121);
  });
  
  test('distribution analysis uses player direction', () => {
    const players = [
      Player.initialize('white', 'clockwise', undefined, 'player1', 'rolling', true),
      Player.initialize('black', 'counterclockwise', undefined, 'player2', 'inactive', true)
    ];
    
    const game = Game.initialize(players as any) as BackgammonGame;
    
    // Analyze distribution for both players
    const whiteDistribution = PositionAnalyzer.evaluateDistribution(game, players[0]);
    const blackDistribution = PositionAnalyzer.evaluateDistribution(game, players[1]);
    
    // Both players should have the same distribution metrics
    expect(whiteDistribution.homeBoardCheckers).toBe(blackDistribution.homeBoardCheckers);
    expect(whiteDistribution.outerBoardCheckers).toBe(blackDistribution.outerBoardCheckers);
    expect(whiteDistribution.opponentHomeBoardCheckers).toBe(blackDistribution.opponentHomeBoardCheckers);
  });
  
  test('position helper methods work correctly', () => {
    // Test position helper methods
    expect(PositionAnalyzer.isInHomeBoard(1)).toBe(true);
    expect(PositionAnalyzer.isInHomeBoard(6)).toBe(true);
    expect(PositionAnalyzer.isInHomeBoard(7)).toBe(false);
    
    expect(PositionAnalyzer.isInOuterBoard(7)).toBe(true);
    expect(PositionAnalyzer.isInOuterBoard(12)).toBe(true);
    expect(PositionAnalyzer.isInOuterBoard(6)).toBe(false);
    
    expect(PositionAnalyzer.isInOpponentHomeBoard(19)).toBe(true);
    expect(PositionAnalyzer.isInOpponentHomeBoard(24)).toBe(true);
    expect(PositionAnalyzer.isInOpponentHomeBoard(18)).toBe(false);
  });
  
  test('getPositionFromDirection helper works', () => {
    const point = {
      position: {
        clockwise: 12,
        counterclockwise: 13
      }
    };
    
    expect(PositionAnalyzer.getPositionFromDirection(point, 'clockwise')).toBe(12);
    expect(PositionAnalyzer.getPositionFromDirection(point, 'counterclockwise')).toBe(13);
  });
});