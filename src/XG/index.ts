export { XGParser } from './parser'
export { XGSerializer } from './serializer'
export { XGConverter } from './converter'

// Service class that combines all XG functionality
import { XGParser } from './parser'
import { XGSerializer } from './serializer'
import { XGConverter } from './converter'
import {
  BackgammonGame,
  XGMatch,
  XGParseResult,
  XGMatchHeader
} from '@nodots-llc/backgammon-types'

export class XGService {
  /**
   * Import XG file content and convert to Nodots games
   */
  public static async importXGFile(content: string): Promise<{
    success: boolean
    games: BackgammonGame[]
    errors: string[]
    warnings: string[]
    metadata?: XGMatch['metadata']
  }> {
    try {
      // Parse XG content
      const parseResult: XGParseResult = XGParser.parse(content)
      
      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          games: [],
          errors: parseResult.errors.map(e => e.message),
          warnings: parseResult.warnings
        }
      }

      // Convert to Nodots games
      const games = await XGConverter.xgMatchToNodotsGames(parseResult.data)
      
      return {
        success: true,
        games,
        errors: [],
        warnings: parseResult.warnings,
        metadata: parseResult.data.metadata
      }
    } catch (error: any) {
      return {
        success: false,
        games: [],
        errors: [`Import failed: ${error?.message || 'Unknown error'}`],
        warnings: []
      }
    }
  }

  /**
   * Export Nodots games to XG format
   */
  public static exportNodotsGamesToXG(
    games: BackgammonGame[],
    player1Name: string,
    player2Name: string,
    options: Partial<XGMatchHeader> = {}
  ): string {
    try {
      // Convert games to XG match
      const xgMatch = XGConverter.nodotsGamesToXGMatch(
        games,
        player1Name,
        player2Name,
        options
      )
      
      // Serialize to XG format
      const xgContent = XGSerializer.serialize(xgMatch)
      
      // Update file size in metadata
      xgMatch.metadata.fileSize = xgContent.length
      
      return xgContent
    } catch (error: any) {
      throw new Error(`Export failed: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Validate XG file content without full parsing
   */
  public static validateXGFile(content: string): XGParseResult {
    return XGParser.parse(content)
  }

  /**
   * Get XG file statistics without full conversion
   */
  public static getXGFileStats(content: string): {
    valid: boolean
    gameCount: number
    playerNames: [string, string] | null
    fileSize: number
    errors: string[]
  } {
    try {
      const parseResult = XGParser.parse(content)
      
      if (!parseResult.success || !parseResult.data) {
        return {
          valid: false,
          gameCount: 0,
          playerNames: null,
          fileSize: content.length,
          errors: parseResult.errors.map(e => e.message)
        }
      }

      return {
        valid: true,
        gameCount: parseResult.data.games.length,
        playerNames: [parseResult.data.header.player1, parseResult.data.header.player2],
        fileSize: content.length,
        errors: []
      }
    } catch (error: any) {
      return {
        valid: false,
        gameCount: 0,
        playerNames: null,
        fileSize: content.length,
        errors: [error?.message || 'Unknown error']
      }
    }
  }

  /**
   * Create a simple XG match from basic game data
   */
  public static createSimpleXGMatch(
    player1Name: string,
    player2Name: string,
    gameResults: Array<{ winner: 1 | 2; points: number }>,
    options: Partial<XGMatchHeader> = {}
  ): string {
    const xgMatch = XGSerializer.createMatch(player1Name, player2Name, [], options)
    
    // Add simple game records
    let currentScore = { player1: 0, player2: 0 }
    
    xgMatch.games = gameResults.map((result, index) => {
      const game = {
        gameNumber: index + 1,
        initialScore: { ...currentScore },
        moves: [{
          moveNumber: 1,
          player: result.winner,
          gameEnd: {
            winner: result.winner,
            points: result.points
          }
        }],
        winner: result.winner,
        pointsWon: result.points,
        finalScore: { ...currentScore }
      }
      
      // Update score
      if (result.winner === 1) {
        game.finalScore.player1 += result.points
      } else {
        game.finalScore.player2 += result.points
      }
      currentScore = { ...game.finalScore }
      
      return game
    })
    
    xgMatch.metadata.totalGames = gameResults.length
    xgMatch.metadata.finalScore = currentScore
    
    return XGSerializer.serialize(xgMatch)
  }
}