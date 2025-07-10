import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { PositionAnalyzer } from './PositionAnalyzer'

export enum GamePhase {
  OPENING = 'opening',
  MIDDLE_GAME = 'middle_game',
  RACE = 'race',
  BEAR_OFF = 'bear_off',
  BACKGAME = 'backgame',
  BLITZ = 'blitz',
}

export class GamePhaseDetector {
  static identifyPhase(gameState: BackgammonGame): GamePhase {
    const players = gameState.players
    const analysis = players.map((player) => ({
      player,
      distribution: PositionAnalyzer.evaluateDistribution(gameState, player),
      pipCount: PositionAnalyzer.calculatePipCount(gameState, player),
      blotCount: PositionAnalyzer.getBlotCount(gameState, player),
      primeLength: PositionAnalyzer.getPrimeLength(gameState, player),
    }))

    // Opening phase - true starting position only
    if (this.isStandardOpeningPosition(gameState)) {
      return GamePhase.OPENING
    }

    // Bear-off phase - all checkers in home board
    if (
      analysis.some(
        (a) =>
          a.distribution.homeBoardCheckers >= 10 &&
          a.distribution.outerBoardCheckers === 0 &&
          a.distribution.opponentHomeBoardCheckers === 0
      )
    ) {
      return GamePhase.BEAR_OFF
    }

    // Backgame - anchors in opponent's home board
    if (analysis.some((a) => a.distribution.opponentHomeBoardCheckers >= 4)) {
      return GamePhase.BACKGAME
    }

    // Blitz - many blots and aggressive play
    if (
      analysis.some((a) => a.blotCount >= 3 && a.distribution.barCheckers >= 1)
    ) {
      return GamePhase.BLITZ
    }

    // Race phase - no contact
    if (PositionAnalyzer.isInRace(gameState)) {
      return GamePhase.RACE
    }

    return GamePhase.MIDDLE_GAME
  }

  static isStandardOpeningPosition(gameState: BackgammonGame): boolean {
    // Generate a reference board for the current player color/directions
    const refBoard = require('../../Board').Board.createBoardForPlayers(
      'black',
      'white'
    )
    const points = require('../../Board').Board.getPoints(gameState.board)
    const refPoints = require('../../Board').Board.getPoints(refBoard)
    // Compare each point's checker color and count
    for (let i = 0; i < points.length; i++) {
      const a = points[i].checkers
      const b = refPoints[i].checkers
      if (a.length !== b.length) return false
      for (let j = 0; j < a.length; j++) {
        if (a[j].color !== b[j].color) return false
      }
    }
    // Check bar and off are empty
    const bar = gameState.board.bar
    const off = gameState.board.off
    if (bar.clockwise.checkers.length || bar.counterclockwise.checkers.length)
      return false
    if (off.clockwise.checkers.length || off.counterclockwise.checkers.length)
      return false
    return true
  }

  /**
   * Get detailed phase analysis for both players
   */
  static getDetailedPhaseAnalysis(gameState: BackgammonGame): {
    phase: GamePhase
    playerAnalysis: Array<{
      player: BackgammonPlayer
      distribution: any
      pipCount: number
      blotCount: number
      primeLength: number
      anchors: number[]
    }>
  } {
    const players = gameState.players
    const playerAnalysis = players.map((player) => ({
      player,
      distribution: PositionAnalyzer.evaluateDistribution(gameState, player),
      pipCount: PositionAnalyzer.calculatePipCount(gameState, player),
      blotCount: PositionAnalyzer.getBlotCount(gameState, player),
      primeLength: PositionAnalyzer.getPrimeLength(gameState, player),
      anchors: PositionAnalyzer.findAnchorPositions(gameState, player),
    }))

    const phase = this.identifyPhase(gameState)

    return {
      phase,
      playerAnalysis,
    }
  }

  /**
   * Check if game is in endgame phase
   */
  static isEndgame(gameState: BackgammonGame): boolean {
    const phase = this.identifyPhase(gameState)
    return phase === GamePhase.BEAR_OFF || phase === GamePhase.RACE
  }

  /**
   * Check if game is in opening phase
   */
  static isOpening(gameState: BackgammonGame): boolean {
    return this.identifyPhase(gameState) === GamePhase.OPENING
  }

  /**
   * Check if game is in middle game
   */
  static isMiddleGame(gameState: BackgammonGame): boolean {
    const phase = this.identifyPhase(gameState)
    return (
      phase === GamePhase.MIDDLE_GAME ||
      phase === GamePhase.BLITZ ||
      phase === GamePhase.BACKGAME
    )
  }
}
