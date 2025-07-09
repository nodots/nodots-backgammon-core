import { BackgammonGame } from '@nodots-llc/backgammon-types';

export enum GamePhase {
  OPENING = 'opening',
  MIDDLE_GAME = 'middle_game',
  RACE = 'race',
  BEAR_OFF = 'bear_off',
  BACKGAME = 'backgame',
  BLITZ = 'blitz'
}

export class GamePhaseDetector {
  // Re-export core game phase detection
  static identifyPhase = require('@nodots-llc/backgammon-core').GamePhaseDetector.identifyPhase;

  // AI-specific phase analysis
  static getPhaseStrategy(phase: GamePhase): string {
    switch (phase) {
      case GamePhase.OPENING:
        return 'Control key points, establish anchors, avoid blots';
      case GamePhase.MIDDLE_GAME:
        return 'Build primes, hit blots, maintain flexibility';
      case GamePhase.RACE:
        return 'Maximize pip count advantage, efficient bear-off preparation';
      case GamePhase.BEAR_OFF:
        return 'Efficient bear-off, avoid getting hit';
      case GamePhase.BACKGAME:
        return 'Maintain anchors, create backgame opportunities';
      case GamePhase.BLITZ:
        return 'Aggressive hitting, maintain pressure';
      default:
        return 'Adapt to position';
    }
  }
}