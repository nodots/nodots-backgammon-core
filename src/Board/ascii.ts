import {
  BackgammonBoard,
  BackgammonPlayer,
  BackgammonPlayers,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types/dist'

const MAX_VISIBLE_CHECKERS = 5

export const ascii = (
  board: BackgammonBoard,
  players?: BackgammonPlayers,
  activePlayer?: BackgammonPlayer,
  moveNotation?: string,
  playerModels?: Record<string, string>
): string => {
  // Validate board exists and has required properties
  if (!board) {
    return 'ERROR: Board is undefined'
  }

  if (!board.points) {
    return 'ERROR: Board points are undefined'
  }

  if (!board.bar) {
    return 'ERROR: Board bar is undefined'
  }

  if (!board.off) {
    return 'ERROR: Board off is undefined'
  }

  if (!board.off.clockwise) {
    return 'ERROR: Board off.clockwise is undefined'
  }

  if (!board.off.counterclockwise) {
    return 'ERROR: Board off.counterclockwise is undefined'
  }

  const points = board.points

  let boardDisplay = ''

  // GNU-style header removed - gnuPositionId is deprecated
  boardDisplay += `Nodots Backgammon\n`

  // Helper to get player label with new standardized format: 'symbol | model | direction >'
  const getPlayerLabel = (player: BackgammonPlayer | undefined, fallback: string) => {
    const symbol = player?.color === 'black' ? 'X' : 'O'
    const model = (player?.id && playerModels?.[player.id]) ?? fallback
    const direction = player?.direction ?? 'unknown'
    const role = player && (player as any).isRobot ? 'robot' : 'human'
    const activeIndicator =
      activePlayer?.id === player?.id ? ' *ACTIVE*' : ''

    return `${symbol} | ${model} | ${role} | ${direction} >${activeIndicator} - ${
      player?.id ?? 'unknown'
    }`
  }

  // Top label (fixed GNU standard)
  boardDisplay += ' +13-14-15-16-17-18------19-20-21-22-23-24-+'
  if (players && players.length >= 2) {
    const player1 = players[0]
    const symbol1 = player1.color === 'black' ? 'X' : 'O'
    boardDisplay += `     ${symbol1}: ${getPlayerLabel(player1, 'player1')}\n`
  } else {
    boardDisplay += '     O: player1\n'
  }

  // Helper to get point by visual position
  const getPointByVisualPosition = (
    visualPos: number
  ): BackgammonPoint | null =>
    points.find((point) => point.position.clockwise === visualPos) ?? null

  // Helper to get checker symbol array for a point
  const getCheckerSymbols = (visualPos: number) => {
    const point = getPointByVisualPosition(visualPos)
    if (!point) return []
    return point.checkers.map((c) =>
      c.color === 'black' ? 'X' : c.color === 'white' ? 'O' : '?'
    )
  }

  // Total number of checker rows (top + bottom)
  // The vertical center row index (0-based, across all checker rows)
  let checkerRowIndex = 0

  // Build top half (positions 13-18 | bar | 19-24)
  for (let row = 0; row < MAX_VISIBLE_CHECKERS; row++, checkerRowIndex++) {
    boardDisplay += ' |'
    // 13-18 (left half)
    for (let visualPos = 13; visualPos <= 18; visualPos++) {
      const symbols = getCheckerSymbols(visualPos)
      let cell = '   '
      if (symbols.length > MAX_VISIBLE_CHECKERS) {
        // Stacked: show (n) at the BOTTOM cell for north side (closest to bar)
        if (row === MAX_VISIBLE_CHECKERS - 1) {
          cell = `(${symbols.length})`
        } else if (row < MAX_VISIBLE_CHECKERS - 1) {
          cell = ' ' + symbols[row] + ' '
        }
      } else if (row < symbols.length) {
        cell = ' ' + symbols[row] + ' '
      }
      cell = cell.padEnd(3).slice(0, 3)
      boardDisplay += cell
    }
    boardDisplay += '|'
    // Bar column: always spaces in checker rows
    boardDisplay += '   |'
    // 19-24 (right half)
    for (let visualPos = 19; visualPos <= 24; visualPos++) {
      const symbols = getCheckerSymbols(visualPos)
      let cell = '   '
      if (symbols.length > MAX_VISIBLE_CHECKERS) {
        if (row === MAX_VISIBLE_CHECKERS - 1) {
          cell = `(${symbols.length})`
        } else if (row < MAX_VISIBLE_CHECKERS - 1) {
          cell = ' ' + symbols[row] + ' '
        }
      } else if (row < symbols.length) {
        cell = ' ' + symbols[row] + ' '
      }
      cell = cell.padEnd(3).slice(0, 3)
      boardDisplay += cell
    }
    boardDisplay += '|\n'
  }

  // Bar/points info line (GNU uses v| ... |)
  boardDisplay += 'v|                  |BAR|                  |'
  if (players && players.length >= 2) {
    const player1 = players[0]
    let player1Off = 0

    // Safely calculate player1Off with defensive checks
    try {
      if (board.off?.clockwise?.checkers) {
        player1Off += board.off.clockwise.checkers.filter(
          (c) => c.color === player1.color
        ).length
      }
      if (board.off?.counterclockwise?.checkers) {
        player1Off += board.off.counterclockwise.checkers.filter(
          (c) => c.color === player1.color
        ).length
      }
    } catch (error) {
      console.error('Error calculating player1Off:', error)
      player1Off = 0
    }

    boardDisplay += `     ${player1Off} points\n`
  } else {
    boardDisplay += '     0 points\n'
  }

  // Build bottom half (positions 12-7 | bar | 6-1)
  for (let row = MAX_VISIBLE_CHECKERS - 1; row >= 0; row--, checkerRowIndex++) {
    boardDisplay += ' |'
    // 12-7 (left half)
    for (let visualPos = 12; visualPos >= 7; visualPos--) {
      const symbols = getCheckerSymbols(visualPos)
      let cell = '   '
      if (symbols.length > MAX_VISIBLE_CHECKERS) {
        // Stacked: show (n) at the TOP cell for south side (closest to bar)
        if (row === MAX_VISIBLE_CHECKERS - 1) {
          cell = `(${symbols.length})`
        } else {
          // Show checkers below the (n) indicator
          const checkerIndex = row
          if (checkerIndex >= 0 && checkerIndex < MAX_VISIBLE_CHECKERS - 1) {
            const symbol =
              symbols[checkerIndex] === 'X' || symbols[checkerIndex] === 'O'
                ? symbols[checkerIndex]
                : '?'
            cell = ' ' + symbol + ' '
          }
        }
      } else if (symbols.length > 0) {
        // For stacks <= MAX_VISIBLE_CHECKERS: checkers settle at bottom edge
        // Only show checkers in the bottom N rows where N = symbols.length
        if (row < symbols.length) {
          const checkerIndex = row
          const symbol =
            symbols[checkerIndex] === 'X' || symbols[checkerIndex] === 'O'
              ? symbols[checkerIndex]
              : '?'
          cell = ' ' + symbol + ' '
        }
      }
      cell = cell.padEnd(3).slice(0, 3)
      boardDisplay += cell
    }
    boardDisplay += '|'
    // Bar column: always spaces in checker rows
    boardDisplay += '   |'
    // 6-1 (right half)
    for (let visualPos = 6; visualPos >= 1; visualPos--) {
      const symbols = getCheckerSymbols(visualPos)
      let cell = '   '
      if (symbols.length > MAX_VISIBLE_CHECKERS) {
        // Stacked: show (n) at the TOP cell for south side (closest to bar)
        if (row === MAX_VISIBLE_CHECKERS - 1) {
          cell = `(${symbols.length})`
        } else {
          // Show checkers below the (n) indicator
          const checkerIndex = row
          if (checkerIndex >= 0 && checkerIndex < MAX_VISIBLE_CHECKERS - 1) {
            const symbol =
              symbols[checkerIndex] === 'X' || symbols[checkerIndex] === 'O'
                ? symbols[checkerIndex]
                : '?'
            cell = ' ' + symbol + ' '
          }
        }
      } else if (symbols.length > 0) {
        // For stacks <= MAX_VISIBLE_CHECKERS: checkers settle at bottom edge
        // Only show checkers in the bottom N rows where N = symbols.length
        if (row < symbols.length) {
          const checkerIndex = row
          const symbol =
            symbols[checkerIndex] === 'X' || symbols[checkerIndex] === 'O'
              ? symbols[checkerIndex]
              : '?'
          cell = ' ' + symbol + ' '
        }
      }
      cell = cell.padEnd(3).slice(0, 3)
      boardDisplay += cell
    }
    boardDisplay += '|\n'
  }

  // Bottom label (fixed GNU standard)
  boardDisplay += ' +12-11-10--9--8--7-------6--5--4--3--2--1-+'

  // Add player names and on-roll info
  if (players && players.length >= 2) {
    const player2 = players[1]
    const symbol2 = player2.color === 'black' ? 'X' : 'O'
    let player2Off = 0

    // Safely calculate player2Off with defensive checks
    try {
      if (board.off?.clockwise?.checkers) {
        player2Off += board.off.clockwise.checkers.filter(
          (c) => c.color === player2.color
        ).length
      }
      if (board.off?.counterclockwise?.checkers) {
        player2Off += board.off.counterclockwise.checkers.filter(
          (c) => c.color === player2.color
        ).length
      }
    } catch (error) {
      console.error('Error calculating player2Off:', error)
      player2Off = 0
    }

    boardDisplay += `     ${symbol2}: ${getPlayerLabel(player2, 'player2')}\n`
    if (activePlayer && activePlayer.color === player2.color) {
      boardDisplay += '                              On roll\n'
    }
    boardDisplay += `                              ${player2Off} points\n`
  } else {
    boardDisplay += '     X: player2\n'
  }

  // Add move notation if provided
  if (moveNotation) {
    boardDisplay += `\nMove: ${moveNotation}\n`
  }

  return boardDisplay
}
