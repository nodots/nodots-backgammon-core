import { BackgammonGame, BackgammonMoveSkeleton } from '@nodots-llc/backgammon-types';

export interface OpeningMove {
  roll: number[];
  move: BackgammonMoveSkeleton;
  explanation: string;
  strategicValue: number;
}

export class OpeningBook {
  private openingMoves: Map<string, OpeningMove[]> = new Map();

  constructor() {
    this.initializeOpeningBook();
  }

  getBestOpeningMove(roll: number[], gameState: BackgammonGame): BackgammonMoveSkeleton {
    const rollKey = this.getRollKey(roll);
    const moves = this.openingMoves.get(rollKey);
    
    if (!moves || moves.length === 0) {
      // Fallback to basic move generation
      return this.generateBasicOpeningMove(roll, gameState);
    }
    
    // Select best opening move based on position
    const bestMove = this.selectBestOpeningMove(moves, gameState);
    return bestMove.move;
  }

  getOpeningPrinciples(roll: number[]): string[] {
    const rollKey = this.getRollKey(roll);
    const moves = this.openingMoves.get(rollKey);
    
    if (!moves) return ['Make progress toward home board'];
    
    return moves.map(move => move.explanation);
  }

  private initializeOpeningBook(): void {
    // Initialize with standard opening moves
    // This is a simplified version - real implementation would have extensive opening theory
    
    // 6-1 opening
    this.addOpeningMove([6, 1], {
      roll: [6, 1],
      move: {} as BackgammonMoveSkeleton, // Would be actual move
      explanation: 'Split back checkers and establish anchor',
      strategicValue: 85
    });
    
    // 5-2 opening
    this.addOpeningMove([5, 2], {
      roll: [5, 2],
      move: {} as BackgammonMoveSkeleton,
      explanation: 'Make 5-point and advance runner',
      strategicValue: 80
    });
    
    // Add more opening moves...
  }

  private addOpeningMove(roll: number[], openingMove: OpeningMove): void {
    const rollKey = this.getRollKey(roll);
    if (!this.openingMoves.has(rollKey)) {
      this.openingMoves.set(rollKey, []);
    }
    this.openingMoves.get(rollKey)!.push(openingMove);
  }

  private getRollKey(roll: number[]): string {
    return `${roll[0]}-${roll[1]}`;
  }

  private selectBestOpeningMove(moves: OpeningMove[], gameState: BackgammonGame): OpeningMove {
    // Select best move based on current position
    return moves.reduce((best, current) => 
      current.strategicValue > best.strategicValue ? current : best
    );
  }

  private generateBasicOpeningMove(roll: number[], gameState: BackgammonGame): BackgammonMoveSkeleton {
    // Fallback move generation for rolls not in opening book
    // This would use basic heuristics
    return {} as BackgammonMoveSkeleton; // Implementation needed
  }
}