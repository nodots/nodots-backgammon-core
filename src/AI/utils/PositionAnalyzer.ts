import { BackgammonGame, BackgammonPlayer, BackgammonMoveDirection, BackgammonChecker } from '@nodots-llc/backgammon-types'
import { Board } from '../../Board'

export interface DistributionMetrics {
  homeBoardCheckers: number;        // Positions 1-6 from player's direction
  outerBoardCheckers: number;       // Positions 7-12 from player's direction
  opponentHomeBoardCheckers: number; // Positions 19-24 from player's direction
  barCheckers: number;
  bearOffCheckers: number;
  averagePosition: number;
  distribution: number[]; // checkers per position (1-24 from player's direction)
}

export class PositionAnalyzer {
  /**
   * CRITICAL: Always use player.direction for position calculations
   */
  static calculatePipCount(gameState: BackgammonGame, player: BackgammonPlayer): number {
    let pipCount = 0;
    const direction = player.direction; // NOT player.color!
    
    // Count checkers on points
    const points = Board.getPoints(gameState.board);
    points.forEach(point => {
      const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
      if (playerCheckers.length > 0) {
        const position = point.position[direction]; // Use player's direction
        pipCount += playerCheckers.length * position;
      }
    });
    
    // Count checkers on bar (value = 25)
    const bar = gameState.board.bar[direction];
    const barCheckers = bar.checkers.filter((c: BackgammonChecker) => c.color === player.color);
    pipCount += barCheckers.length * 25;
    
    return pipCount;
  }
  
  /**
   * Find anchor positions (2+ checkers in opponent's home board)
   * Opponent's home board is ALWAYS positions 19-24 from player's direction
   */
  static findAnchorPositions(gameState: BackgammonGame, player: BackgammonPlayer): number[] {
    const anchors: number[] = [];
    const direction = player.direction; // Use direction
    const points = Board.getPoints(gameState.board);
    
    points.forEach(point => {
      const position = point.position[direction]; // Player's positional perspective
      
      // Opponent's home board is always 19-24 from player's direction
      if (position >= 19 && position <= 24) {
        const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
        if (playerCheckers.length >= 2) {
          anchors.push(position);
        }
      }
    });
    
    return anchors.sort((a, b) => a - b);
  }
  
  /**
   * Evaluate checker distribution across board sections
   * All sections defined from player's directional perspective
   */
  static evaluateDistribution(gameState: BackgammonGame, player: BackgammonPlayer): DistributionMetrics {
    const direction = player.direction; // Use direction
    const points = Board.getPoints(gameState.board);
    const distribution = new Array(25).fill(0); // positions 1-24 + bar
    
    let homeBoardCheckers = 0;        // Positions 1-6
    let outerBoardCheckers = 0;       // Positions 7-12  
    let opponentHomeBoardCheckers = 0; // Positions 19-24
    let totalPosition = 0;
    let totalCheckers = 0;
    
    // Analyze points using player's direction
    points.forEach(point => {
      const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
      if (playerCheckers.length > 0) {
        const position = point.position[direction]; // Player's perspective
        distribution[position] = playerCheckers.length;
        totalPosition += position * playerCheckers.length;
        totalCheckers += playerCheckers.length;
        
        // Categorize by board section (same for all players)
        if (position >= 1 && position <= 6) {
          homeBoardCheckers += playerCheckers.length;
        } else if (position >= 7 && position <= 12) {
          outerBoardCheckers += playerCheckers.length;
        } else if (position >= 19 && position <= 24) {
          opponentHomeBoardCheckers += playerCheckers.length;
        }
      }
    });
    
    // Count bar checkers
    const bar = gameState.board.bar[direction];
    const barCheckers = bar.checkers.filter((c: BackgammonChecker) => c.color === player.color).length;
    distribution[0] = barCheckers;
    
    // Count bear-off checkers
    const bearOff = gameState.board.off[direction];
    const bearOffCheckers = bearOff.checkers.filter((c: BackgammonChecker) => c.color === player.color).length;
    
    return {
      homeBoardCheckers,
      outerBoardCheckers,
      opponentHomeBoardCheckers,
      barCheckers,
      bearOffCheckers,
      averagePosition: totalCheckers > 0 ? totalPosition / totalCheckers : 0,
      distribution
    };
  }
  
  /**
   * Calculate prime length (consecutive points owned)
   */
  static getPrimeLength(gameState: BackgammonGame, player: BackgammonPlayer): number {
    const direction = player.direction; // Use direction
    const points = Board.getPoints(gameState.board);
    const playerPoints = new Set<number>();
    
    // Find all points owned by player (2+ checkers)
    points.forEach(point => {
      const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
      if (playerCheckers.length >= 2) {
        playerPoints.add(point.position[direction]); // Player's perspective
      }
    });
    
    // Find longest consecutive sequence
    let maxPrime = 0;
    let currentPrime = 0;
    
    for (let pos = 1; pos <= 24; pos++) {
      if (playerPoints.has(pos)) {
        currentPrime++;
        maxPrime = Math.max(maxPrime, currentPrime);
      } else {
        currentPrime = 0;
      }
    }
    
    return maxPrime;
  }
  
  /**
   * Count vulnerable blots (single checkers)
   */
  static getBlotCount(gameState: BackgammonGame, player: BackgammonPlayer): number {
    const points = Board.getPoints(gameState.board);
    let blotCount = 0;
    
    points.forEach(point => {
      const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
      if (playerCheckers.length === 1) {
        blotCount++;
      }
    });
    
    return blotCount;
  }
  
  /**
   * Detect if game is in racing phase (no contact)
   */
  static isInRace(gameState: BackgammonGame): boolean {
    const players = gameState.players; // Corrected from 'game' to 'gameState'
    const points = Board.getPoints(gameState.board);
    
    // Find highest position for each player from their perspective
    const playerPositions = players.map(player => {
      const direction = player.direction; // Use each player's direction
      let maxPosition = 0;
      
      points.forEach(point => {
        const playerCheckers = point.checkers.filter((c: BackgammonChecker) => c.color === player.color);
        if (playerCheckers.length > 0) {
          const position = point.position[direction]; // Player's perspective
          maxPosition = Math.max(maxPosition, position);
        }
      });
      
      return maxPosition;
    });
    
    // Simple race detection - both players' furthest checkers are in home quadrant
    return playerPositions.every(pos => pos < 13);
  }
  
  /**
   * Get position from player's directional perspective
   */
  static getPositionFromDirection(point: any, direction: BackgammonMoveDirection): number {
    return typeof point.position === 'object' ? point.position[direction] : 0;
  }
  
  /**
   * Check if position is in opponent's home board (19-24 from player's direction)
   */
  static isInOpponentHomeBoard(position: number): boolean {
    return position >= 19 && position <= 24;
  }
  
  /**
   * Check if position is in player's home board (1-6 from player's direction)
   */
  static isInHomeBoard(position: number): boolean {
    return position >= 1 && position <= 6;
  }
  
  /**
   * Check if position is in outer board (7-12 from player's direction)
   */
  static isInOuterBoard(position: number): boolean {
    return position >= 7 && position <= 12;
  }
}