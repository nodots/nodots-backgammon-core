import {
  XGMatch,
  XGMatchHeader,
  XGGameRecord,
  XGMoveRecord,
  XGMove,
  XGCubeAction
} from '@nodots-llc/backgammon-types'

export class XGSerializer {
  public static serialize(match: XGMatch): string {
    const lines: string[] = []
    
    // Serialize header
    lines.push(...this.serializeHeader(match.header))
    lines.push('')
    
    // Serialize match info
    lines.push(`${match.matchLength} point match`)
    lines.push('')
    
    // Serialize games
    match.games.forEach((game, index) => {
      lines.push(...this.serializeGame(game, match.header))
      if (index < match.games.length - 1) {
        lines.push('')
      }
    })
    
    return lines.join('\n')
  }

  private static serializeHeader(header: XGMatchHeader): string[] {
    const lines: string[] = []
    
    lines.push(`; [Site "${header.site}"]`)
    if (header.matchId) lines.push(`; [Match ID "${header.matchId}"]`)
    lines.push(`; [Player 1 "${header.player1}"]`)
    lines.push(`; [Player 2 "${header.player2}"]`)
    
    if (header.player1Elo) lines.push(`; [Player 1 Elo "${header.player1Elo}"]`)
    if (header.player2Elo) lines.push(`; [Player 2 Elo "${header.player2Elo}"]`)
    if (header.timeControl) lines.push(`; [TimeControl "${header.timeControl}"]`)
    
    lines.push(`; [EventDate "${header.eventDate}"]`)
    lines.push(`; [EventTime "${header.eventTime}"]`)
    lines.push(`; [Variation "${header.variation}"]`)
    lines.push(`; [Jacoby "${header.jacoby}"]`)
    lines.push(`; [Beaver "${header.beaver}"]`)
    lines.push(`; [Unrated "${header.unrated}"]`)
    lines.push(`; [CubeLimit "${header.cubeLimit}"]`)
    
    return lines
  }

  private static serializeGame(game: XGGameRecord, header: XGMatchHeader): string[] {
    const lines: string[] = []
    
    // Game header
    lines.push(`Game ${game.gameNumber}`)
    
    // Score line
    lines.push(`${header.player1} : ${game.initialScore.player1}                              ${header.player2} : ${game.initialScore.player2}`)
    
    // Moves
    game.moves.forEach(move => {
      const moveLine = this.serializeMove(move)
      if (moveLine) {
        lines.push(moveLine)
      }
    })
    
    return lines
  }

  private static serializeMove(move: XGMoveRecord): string | null {
    const movePrefix = `${move.moveNumber.toString().padStart(2, ' ')})`
    
    // Handle cube actions
    if (move.cubeAction) {
      const cubeStr = this.serializeCubeAction(move.cubeAction)
      return `${movePrefix} ${cubeStr}`
    }
    
    // Handle game end
    if (move.gameEnd) {
      return `${movePrefix} Wins ${move.gameEnd.points} point`
    }
    
    // Handle dice and moves
    if (move.dice && move.moves) {
      const diceStr = `${move.dice[0]}${move.dice[1]}`
      const movesStr = this.serializeMoves(move.moves)
      
      // Format with proper spacing (player 1 on left, player 2 on right)
      if (move.player === 1) {
        return `${movePrefix} ${diceStr}: ${movesStr}`
      } else {
        const spacing = ' '.repeat(35) // Approximate spacing to align with player 2 column
        return `${movePrefix}${spacing}${diceStr}: ${movesStr}`
      }
    }
    
    // Empty move
    if (move.player === 2) {
      const spacing = ' '.repeat(35)
      return `${movePrefix}${spacing}`
    }
    
    return `${movePrefix}`
  }

  private static serializeMoves(moves: XGMove[]): string {
    return moves.map(move => `${move.from}/${move.to}`).join(' ')
  }

  private static serializeCubeAction(action: XGCubeAction): string {
    switch (action.type) {
      case 'double':
        return `Doubles => ${action.value}`
      case 'take':
        return 'Takes'
      case 'drop':
        return 'Drops'
      default:
        throw new Error(`Unknown cube action type: ${action.type}`)
    }
  }

  // Utility method to create XG match from basic data
  public static createMatch(
    player1: string,
    player2: string,
    games: XGGameRecord[],
    options: Partial<XGMatchHeader> = {}
  ): XGMatch {
    const now = new Date()
    const header: XGMatchHeader = {
      site: options.site || 'Nodots Backgammon',
      matchId: options.matchId || Math.random().toString(36).substr(2, 9),
      player1,
      player2,
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

    const finalScore = games.length > 0 
      ? games[games.length - 1].finalScore 
      : { player1: 0, player2: 0 }

    return {
      header,
      matchLength: 0, // Money game
      games,
      metadata: {
        totalGames: games.length,
        finalScore,
        parsedAt: now,
        fileSize: 0 // Will be calculated after serialization
      }
    }
  }
}