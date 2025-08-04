import {
  BackgammonGame,
  BackgammonColor,
  BackgammonMoveDirection,
  BackgammonPlayers,
  XGMatch,
  XGGameRecord,
  XGMove,
  XGMoveRecord,
  XGMatchHeader
} from '@nodots-llc/backgammon-types'
import { Game, Player } from '../Game'

export class XGConverter {
  /**
   * Convert XG position number to Nodots position based on player direction
   * XG uses 1-24 for points, 25 for bar, 0 for off
   * Nodots uses dual numbering system with direction-specific positions
   */
  public static xgPositionToNodotsPosition(
    xgPosition: number,
    playerDirection: BackgammonMoveDirection
  ): number {
    if (xgPosition === 25) return 25 // Bar
    if (xgPosition === 0) return 0   // Off
    
    // For points 1-24, XG and Nodots use the same numbering
    // The dual numbering is handled at the CheckerContainer level
    return xgPosition
  }

  /**
   * Convert Nodots position to XG position
   */
  public static nodotsPositionToXGPosition(
    nodotsPosition: number,
    playerDirection: BackgammonMoveDirection
  ): number {
    if (nodotsPosition === 25) return 25 // Bar
    if (nodotsPosition === 0) return 0   // Off
    
    return nodotsPosition
  }

  /**
   * Convert XG game record to Nodots game
   * This creates a basic game structure - actual game replay would need more logic
   */
  public static async xgGameToNodotsGame(
    xgGame: XGGameRecord,
    header: XGMatchHeader,
    gameId?: string
  ): Promise<Partial<BackgammonGame>> {
    // Create players from header
    const player1 = Player.initialize(
      'white',
      'clockwise',
      undefined,
      undefined,
      'inactive',
      false // isRobot
    )
    
    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      undefined,
      'inactive',
      false // isRobot
    )
    
    const players: BackgammonPlayers = [player1, player2]

    // Create basic game structure
    const game = Game.initialize(players, gameId)

    // Add XG-specific metadata
    const gameWithMetadata = {
      ...game,
      metadata: {
        title: `Game ${xgGame.gameNumber}`,
        description: `${header.player1} vs ${header.player2}`,
        isPublic: false,
        isRanked: header.unrated === 'Off'
      },
      rules: {
        useJacobyRule: header.jacoby === 'On',
        useBeaverRule: header.beaver === 'On'
      },
      // Store original XG data for reference
      _xgData: {
        gameNumber: xgGame.gameNumber,
        moves: xgGame.moves,
        winner: xgGame.winner,
        pointsWon: xgGame.pointsWon
      }
    }

    return gameWithMetadata
  }

  /**
   * Convert Nodots game to XG game record
   */
  public static nodotsGameToXGGame(
    game: BackgammonGame,
    gameNumber: number,
    playerNames: [string, string],
    currentScore: { player1: number; player2: number } = { player1: 0, player2: 0 }
  ): XGGameRecord {
    // Basic conversion - would need more sophisticated logic for full game state conversion
    const xgGame: XGGameRecord = {
      gameNumber,
      initialScore: { ...currentScore },
      moves: [], // Would need to convert game history to XG moves
      winner: 1, // Would determine from game state
      pointsWon: 1, // Would calculate based on game outcome
      finalScore: { 
        player1: currentScore.player1 + (1), // Simplified
        player2: currentScore.player2 
      }
    }

    // If game has stored XG data, prefer that
    if ((game as any)._xgData) {
      const xgData = (game as any)._xgData
      xgGame.moves = xgData.moves
      xgGame.winner = xgData.winner
      xgGame.pointsWon = xgData.pointsWon
    }

    return xgGame
  }

  /**
   * Convert array of XG games to Nodots games
   */
  public static async xgMatchToNodotsGames(xgMatch: XGMatch): Promise<BackgammonGame[]> {
    const games: BackgammonGame[] = []
    
    for (const xgGame of xgMatch.games) {
      try {
        const nodotsGame = await this.xgGameToNodotsGame(xgGame, xgMatch.header)
        games.push(nodotsGame as BackgammonGame)
      } catch (error) {
        console.error(`Failed to convert XG game ${xgGame.gameNumber}:`, error)
        // Continue with other games
      }
    }
    
    return games
  }

  /**
   * Convert array of Nodots games to XG match
   */
  public static nodotsGamesToXGMatch(
    games: BackgammonGame[],
    player1Name: string,
    player2Name: string,
    options: Partial<XGMatchHeader> = {}
  ): XGMatch {
    let currentScore = { player1: 0, player2: 0 }
    
    const xgGames = games.map((game, index) => {
      const playerNames: [string, string] = [player1Name, player2Name]
      const xgGame = this.nodotsGameToXGGame(game, index + 1, playerNames, currentScore)
      
      // Update running score
      currentScore = { ...xgGame.finalScore }
      
      return xgGame
    })

    const now = new Date()
    const header: XGMatchHeader = {
      site: options.site || 'Nodots Backgammon',
      matchId: options.matchId || Math.random().toString(36).substr(2, 9),
      player1: player1Name,
      player2: player2Name,
      player1Elo: options.player1Elo,
      player2Elo: options.player2Elo,
      timeControl: options.timeControl || '*0',
      eventDate: options.eventDate || now.toISOString().split('T')[0].replace(/-/g, '.'),
      eventTime: options.eventTime || now.toTimeString().substr(0, 5),
      variation: options.variation || 'Backgammon',
      jacoby: options.jacoby || 'Off',
      beaver: options.beaver || 'Off',
      unrated: options.unrated || 'Off',
      cubeLimit: options.cubeLimit || 1024
    }

    return {
      header,
      matchLength: 0, // Money game
      games: xgGames,
      metadata: {
        totalGames: xgGames.length,
        finalScore: currentScore,
        parsedAt: now,
        fileSize: 0 // Will be calculated after serialization
      }
    }
  }

  /**
   * Validate XG move against backgammon rules
   * This is a simplified validation - full validation would require game state
   */
  public static validateXGMove(move: XGMove): boolean {
    // Basic validations
    if (move.from < 0 || move.from > 25) return false
    if (move.to < 0 || move.to > 25) return false
    if (move.from === move.to) return false
    
    // Can't move from or to position 0 and 25 simultaneously (invalid positions)
    if ((move.from === 0 && move.to === 25) || (move.from === 25 && move.to === 0)) return false
    
    return true
  }

  /**
   * Calculate pip count from XG position (simplified)
   */
  public static calculatePipCount(moves: XGMoveRecord[]): { player1: number; player2: number } {
    // This would require full game state reconstruction
    // For now, return placeholder values
    return { player1: 167, player2: 167 } // Starting pip count
  }

  /**
   * Extract player colors from game metadata
   */
  public static getPlayerColorsFromXG(
    game: XGGameRecord,
    header: XGMatchHeader
  ): { player1Color: BackgammonColor; player2Color: BackgammonColor } {
    // By convention, player 1 is often white, player 2 is black
    // This could be customized based on additional metadata
    return {
      player1Color: 'white',
      player2Color: 'black'
    }
  }

  /**
   * Convert XG dice notation to Nodots dice format
   */
  public static xgDiceToNodotsDice(xgDice: [number, number]): [number, number] {
    return xgDice // Same format
  }

  /**
   * Convert Nodots dice to XG dice notation
   */
  public static nodotsDiceToXGDice(nodotsDice: [number, number]): [number, number] {
    return nodotsDice // Same format
  }
}