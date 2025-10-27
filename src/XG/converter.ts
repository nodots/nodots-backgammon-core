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
import { Game } from '../Game'
import { Player } from '../Player'

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
    if (xgPosition === 25) return 25
    if (xgPosition === 0) return 0

    return xgPosition
  }

  /**
   * Convert Nodots position to XG position
   */
  public static nodotsPositionToXGPosition(
    nodotsPosition: number,
    playerDirection: BackgammonMoveDirection
  ): number {
    if (nodotsPosition === 25) return 25
    if (nodotsPosition === 0) return 0

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
    const player1 = Player.initialize(
      'white',
      'clockwise',
      'inactive',
      false,
      header.player1
    )

    const player2 = Player.initialize(
      'black',
      'counterclockwise',
      'inactive',
      false,
      header.player2
    )

    const players: BackgammonPlayers = [player1, player2]

    const game = Game.initialize(players, gameId)

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
    const xgGame: XGGameRecord = {
      gameNumber,
      initialScore: { ...currentScore },
      moves: [],
      winner: 1,
      pointsWon: 1,
      finalScore: {
        player1: currentScore.player1 + (1),
        player2: currentScore.player2
      }
    }

    // as - Storing XG data for round-trip conversion compatibility
    if ((game as unknown as Record<string, unknown>)._xgData) {
      const xgData = (game as unknown as Record<string, unknown>)._xgData as {
        moves: XGMoveRecord[]
        winner: 1 | 2
        pointsWon: number
      }
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
      matchLength: 0,
      games: xgGames,
      metadata: {
        totalGames: xgGames.length,
        finalScore: currentScore,
        parsedAt: now,
        fileSize: 0
      }
    }
  }

  /**
   * Validate XG move against backgammon rules
   */
  public static validateXGMove(move: XGMove): boolean {
    if (move.from < 0 || move.from > 25) return false
    if (move.to < 0 || move.to > 25) return false
    if (move.from === move.to) return false

    if ((move.from === 0 && move.to === 25) || (move.from === 25 && move.to === 0)) return false

    return true
  }
}
