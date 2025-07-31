import {
  XGCubeAction,
  XGGameRecord,
  XGMatch,
  XGMatchHeader,
  XGMove,
  XGMoveRecord,
  XGParseResult,
  XGParserError,
} from '@nodots-llc/backgammon-types'

export class XGParser {
  private static readonly HEADER_PATTERN = /^; \[([^"]+) "([^"]+)"\]$/
  private static readonly MOVE_PATTERN = /^(\d+)\) (.+)$/
  private static readonly DICE_MOVE_PATTERN = /^(\d{1,2}): (.+)$/
  private static readonly CUBE_PATTERN = /^(Doubles => \d+|Takes|Drops)$/
  private static readonly GAME_END_PATTERN = /^Wins (\d+) point$/
  private static readonly GAME_HEADER_PATTERN = /^Game (\d+)$/
  private static readonly SCORE_PATTERN = /^(.+) : (\d+)\s+(.+) : (\d+)$/
  private static readonly MATCH_LENGTH_PATTERN = /^(\d+) point match$/

  public static parse(content: string): XGParseResult {
    const errors: XGParserError[] = []
    const warnings: string[] = []

    try {
      const lines = content
        .split('\n')
        .map((line, index) => ({ text: line.trim(), number: index + 1 }))
        .filter((line) => line.text.length > 0)

      if (lines.length === 0) {
        errors.push(new XGParserError('Empty file'))
        return { success: false, errors, warnings }
      }

      const header = this.parseHeader(lines, errors)
      if (!header) {
        return { success: false, errors, warnings }
      }

      const matchLength = this.parseMatchLength(lines, errors)
      const games = this.parseGames(lines, errors, warnings)

      const match: XGMatch = {
        header,
        matchLength,
        games,
        metadata: {
          totalGames: games.length,
          finalScore:
            games.length > 0
              ? games[games.length - 1].finalScore
              : { player1: 0, player2: 0 },
          parsedAt: new Date(),
          fileSize: content.length,
        },
      }

      return {
        success: errors.length === 0,
        data: errors.length === 0 ? match : undefined,
        errors,
        warnings,
      }
    } catch (error: any) {
      errors.push(
        new XGParserError(
          `Unexpected parsing error: ${error?.message || 'Unknown error'}`
        )
      )
      return { success: false, errors, warnings }
    }
  }

  private static parseHeader(
    lines: Array<{ text: string; number: number }>,
    errors: XGParserError[]
  ): XGMatchHeader | null {
    const headerData: Partial<XGMatchHeader> = {}
    let headerEndIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (!line.text.startsWith(';')) {
        headerEndIndex = i
        break
      }

      const match = line.text.match(this.HEADER_PATTERN)
      if (!match) {
        errors.push(
          new XGParserError(`Invalid header format`, line.number, 0, line.text)
        )
        continue
      }

      const [, key, value] = match

      switch (key) {
        case 'Site':
          headerData.site = value
          break
        case 'Match ID':
          headerData.matchId = value
          break
        case 'Player 1':
          headerData.player1 = value
          break
        case 'Player 2':
          headerData.player2 = value
          break
        case 'Player 1 Elo':
          headerData.player1Elo = value
          break
        case 'Player 2 Elo':
          headerData.player2Elo = value
          break
        case 'TimeControl':
          headerData.timeControl = value
          break
        case 'EventDate':
          headerData.eventDate = value
          break
        case 'EventTime':
          headerData.eventTime = value
          break
        case 'Variation':
          headerData.variation = value
          break
        case 'Jacoby':
          headerData.jacoby = value as 'On' | 'Off'
          break
        case 'Beaver':
          headerData.beaver = value as 'On' | 'Off'
          break
        case 'Unrated':
          headerData.unrated = value as 'On' | 'Off'
          break
        case 'CubeLimit':
          const cubeLimit = parseInt(value)
          if (isNaN(cubeLimit)) {
            errors.push(
              new XGParserError(`Invalid cube limit: ${value}`, line.number)
            )
          } else {
            headerData.cubeLimit = cubeLimit
          }
          break
        default:
          // Unknown header field, add as warning
          break
      }
    }

    // Validate required fields
    const required = [
      'site',
      'player1',
      'player2',
      'eventDate',
      'eventTime',
      'variation',
    ]
    for (const field of required) {
      if (!headerData[field as keyof XGMatchHeader]) {
        errors.push(
          new XGParserError(`Missing required header field: ${field}`)
        )
      }
    }

    // Set defaults
    if (!headerData.jacoby) headerData.jacoby = 'Off'
    if (!headerData.beaver) headerData.beaver = 'Off'
    if (!headerData.unrated) headerData.unrated = 'Off'
    if (!headerData.cubeLimit) headerData.cubeLimit = 1024

    return errors.length === 0 ? (headerData as XGMatchHeader) : null
  }

  private static parseMatchLength(
    lines: Array<{ text: string; number: number }>,
    errors: XGParserError[]
  ): number {
    // Look for match length line (e.g., "0 point match")
    for (const line of lines) {
      const match = line.text.match(this.MATCH_LENGTH_PATTERN)
      if (match) {
        return parseInt(match[1])
      }
    }

    // Default to 0 (money game) if not found
    return 0
  }

  private static parseGames(
    lines: Array<{ text: string; number: number }>,
    errors: XGParserError[],
    warnings: string[]
  ): XGGameRecord[] {
    const games: XGGameRecord[] = []
    let currentGame: Partial<XGGameRecord> | null = null
    let currentScore = { player1: 0, player2: 0 }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for game header
      const gameHeaderMatch = line.text.match(this.GAME_HEADER_PATTERN)
      if (gameHeaderMatch) {
        // Finalize previous game if exists
        if (currentGame && currentGame.moves) {
          games.push(currentGame as XGGameRecord)
        }

        // Start new game
        currentGame = {
          gameNumber: parseInt(gameHeaderMatch[1]),
          initialScore: { ...currentScore },
          moves: [],
          winner: 1,
          pointsWon: 1,
          finalScore: { ...currentScore },
        }
        continue
      }

      // Check for score line
      const scoreMatch = line.text.match(this.SCORE_PATTERN)
      if (scoreMatch && currentGame) {
        const [, player1Name, player1Score, player2Name, player2Score] =
          scoreMatch
        currentScore = {
          player1: parseInt(player1Score),
          player2: parseInt(player2Score),
        }
        currentGame.initialScore = { ...currentScore }
        continue
      }

      // Check for move line
      const moveMatch = line.text.match(this.MOVE_PATTERN)
      if (moveMatch && currentGame) {
        const [, moveNumberStr, moveContent] = moveMatch
        const moveNumber = parseInt(moveNumberStr)

        try {
          const moveRecords = this.parseMoveLineBothPlayers(
            moveNumber,
            moveContent,
            line.number
          )
          currentGame.moves!.push(...moveRecords)

          // Check for game end in any of the moves
          for (const moveRecord of moveRecords) {
            if (moveRecord.gameEnd) {
              currentGame.winner = moveRecord.gameEnd.winner
              currentGame.pointsWon = moveRecord.gameEnd.points
              currentScore[
                `player${moveRecord.gameEnd.winner}` as keyof typeof currentScore
              ] += moveRecord.gameEnd.points
              currentGame.finalScore = { ...currentScore }
            }
          }
        } catch (error: any) {
          errors.push(
            new XGParserError(
              `Error parsing move: ${error?.message || 'Unknown error'}`,
              line.number,
              0,
              line.text
            )
          )
        }
      }
    }

    // Finalize last game
    if (currentGame && currentGame.moves) {
      games.push(currentGame as XGGameRecord)
    }

    return games
  }

  private static parseMoveLineBothPlayers(
    moveNumber: number,
    content: string,
    lineNumber: number
  ): XGMoveRecord[] {
    const moves: XGMoveRecord[] = []

    // Split the line content into player 1 and player 2 parts
    // Format: "player1_content                    player2_content"
    const trimmed = content.trim()

    // Find the split point - look for significant whitespace (more than a few spaces)
    const parts = trimmed.split(/\s{10,}/) // Split on 10+ consecutive spaces

    let player1Content = ''
    let player2Content = ''

    if (parts.length >= 2) {
      player1Content = parts[0].trim()
      player2Content = parts[1].trim()
    } else {
      // If no clear split, treat entire content as belonging to one player
      // Determine which player based on content type
      if (trimmed.match(/^\d{1,2}:/)) {
        // Dice notation typically goes to player 2
        player2Content = trimmed
      } else if (
        trimmed.match(this.GAME_END_PATTERN) ||
        trimmed.match(this.CUBE_PATTERN)
      ) {
        // Game end and cube actions typically come from player 1
        player1Content = trimmed
      } else {
        // Default to player 1
        player1Content = trimmed
      }
    }

    // Parse player 1's move (if any)
    if (player1Content) {
      const move1 = this.parsePlayerMove(
        moveNumber,
        1,
        player1Content,
        lineNumber
      )
      if (move1) moves.push(move1)
    }

    // Parse player 2's move (if any)
    if (player2Content) {
      const move2 = this.parsePlayerMove(
        moveNumber,
        2,
        player2Content,
        lineNumber
      )
      if (move2) moves.push(move2)
    }

    return moves
  }

  private static parsePlayerMove(
    moveNumber: number,
    player: 1 | 2,
    content: string,
    lineNumber: number
  ): XGMoveRecord | null {
    if (!content || content.trim() === '') return null

    // Check for cube action
    const cubeMatch = content.match(this.CUBE_PATTERN)
    if (cubeMatch) {
      const cubeAction = this.parseCubeAction(cubeMatch[1])
      return {
        moveNumber,
        player,
        cubeAction,
      }
    }

    // Check for game end
    const gameEndMatch = content.match(this.GAME_END_PATTERN)
    if (gameEndMatch) {
      return {
        moveNumber,
        player,
        gameEnd: {
          winner: player,
          points: parseInt(gameEndMatch[1]),
        },
      }
    }

    // Check for dice and moves
    const diceMoveMatch = content.match(this.DICE_MOVE_PATTERN)
    if (diceMoveMatch) {
      const [, diceStr, movesStr] = diceMoveMatch
      const dice = this.parseDice(diceStr)
      const moves = this.parseMoveNotation(movesStr)

      return {
        moveNumber,
        player,
        dice,
        moves,
      }
    }

    // Check for invalid dice-like format (something: moves)
    if (content.match(/^[A-Za-z]+:/)) {
      throw new Error(`Invalid dice format in move: ${content}`)
    }

    // Empty move (passed turn or other)
    return null
  }

  private static parseDice(diceStr: string): [number, number] {
    if (diceStr.length === 2) {
      const die1 = parseInt(diceStr[0])
      const die2 = parseInt(diceStr[1])
      if (
        !isNaN(die1) &&
        !isNaN(die2) &&
        die1 >= 1 &&
        die1 <= 6 &&
        die2 >= 1 &&
        die2 <= 6
      ) {
        return [die1, die2]
      }
    }
    throw new Error(`Invalid dice format: ${diceStr}`)
  }

  private static parseMoveNotation(notation: string): XGMove[] {
    const moves: XGMove[] = []

    // Split by spaces to get individual moves
    const moveParts = notation.trim().split(/\s+/)

    for (const movePart of moveParts) {
      const [fromStr, toStr] = movePart.split('/')
      if (fromStr && toStr) {
        moves.push({
          from: parseInt(fromStr),
          to: parseInt(toStr),
        })
      }
    }

    return moves
  }

  private static parseCubeAction(actionStr: string): XGCubeAction {
    if (actionStr.startsWith('Doubles => ')) {
      const value = parseInt(actionStr.replace('Doubles => ', ''))
      return { type: 'double', value }
    } else if (actionStr === 'Takes') {
      return { type: 'take' }
    } else if (actionStr === 'Drops') {
      return { type: 'drop' }
    }

    throw new Error(`Unknown cube action: ${actionStr}`)
  }
}
