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

    lines.push(...this.serializeHeader(match.header))
    lines.push('')

    lines.push(`${match.matchLength} point match`)
    lines.push('')

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

    if (header.crawford) lines.push(`; [Crawford "${header.crawford}"]`)
    if (header.jacoby) lines.push(`; [Jacoby "${header.jacoby}"]`)
    if (header.beaver) lines.push(`; [Beaver "${header.beaver}"]`)
    if (header.unrated) lines.push(`; [Unrated "${header.unrated}"]`)
    if (header.cubeLimit) lines.push(`; [CubeLimit "${header.cubeLimit}"]`)

    return lines
  }

  private static serializeGame(game: XGGameRecord, header: XGMatchHeader): string[] {
    const lines: string[] = []

    lines.push(` Game ${game.gameNumber}`)

    lines.push(` ${header.player1} : ${game.initialScore.player1}                              ${header.player2} : ${game.initialScore.player2}`)

    game.moves.forEach(move => {
      const moveLine = this.serializeMove(move)
      if (moveLine) {
        lines.push(moveLine)
      }
    })

    return lines
  }

  private static serializeMove(move: XGMoveRecord): string | null {
    const movePrefix = `  ${move.moveNumber.toString().padStart(1, ' ')})`

    if (move.cubeAction) {
      const cubeStr = this.serializeCubeAction(move.cubeAction)
      if (move.player === 1) {
        return `${movePrefix} ${cubeStr}`
      } else {
        const spacing = ' '.repeat(35)
        return `${movePrefix}${spacing}${cubeStr}`
      }
    }

    if (move.gameEnd) {
      if (move.player === 2) {
        const spacing = ' '.repeat(35)
        return `${movePrefix}${spacing}Wins ${move.gameEnd.points} point`
      }
      return `${movePrefix} Wins ${move.gameEnd.points} point`
    }

    if (move.dice && move.moves) {
      const diceStr = `${move.dice[0]}${move.dice[1]}`
      const movesStr = this.serializeMoves(move.moves)

      if (move.player === 1) {
        return `${movePrefix} ${diceStr}: ${movesStr}`
      } else {
        const spacing = ' '.repeat(35)
        return `${movePrefix}${spacing}${diceStr}: ${movesStr}`
      }
    }

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
      matchLength: 0,
      games,
      metadata: {
        totalGames: games.length,
        finalScore,
        parsedAt: now,
        fileSize: 0
      }
    }
  }
}
