import {
  BackgammonBar,
  BackgammonBoard,
  BackgammonChecker,
  BackgammonPlayers,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types/dist'

export const ascii = (
  board: BackgammonBoard,
  players?: BackgammonPlayers
): string => {
  const points = board.BackgammonPoints
  const bar = board.bar

  // Enhanced legend for player symbols, color, and direction
  let boardDisplay = ''
  if (players && players.length === 2) {
    const getSymbol = (color: string) => (color === 'black' ? 'X' : 'O')
    boardDisplay += 'LEGEND:'
    for (const player of players) {
      boardDisplay += ` ${player.color.toUpperCase()} (${getSymbol(
        player.color
      )}) [${player.direction}] `
    }
    boardDisplay += '\n'
  } else {
    boardDisplay += 'LEGEND: BLACK (X), WHITE (O)\n'
  }
  boardDisplay += ' +-13-14-15-16-17-18--------19-20-21-22-23-24-+ \n'

  // Create a mapping from visual position to actual point
  // The ASCII board shows positions 13-24 on top row, 12-1 on bottom row
  // Always use clockwise position for consistent mapping
  const getPointByVisualPosition = (
    visualPos: number
  ): BackgammonPoint | null => {
    // Find the point that has this visual position as clockwise position
    return (
      points.find((point) => point.position.clockwise === visualPos) || null
    )
  }

  const displayPoint = (visualPos: number, row: number): string => {
    const point = getPointByVisualPosition(visualPos)
    if (!point) return '   '

    const checkers = point.checkers
    const checker = checkers[row]
    if (!checker) return '   '

    const color = checker.color
    const symbol = color === 'black' ? ' X ' : ' O '
    return `${symbol}`
  }

  const displayBar = (bar: BackgammonBar, row: number): string => {
    const checkers = bar.checkers
    const checker = checkers[row]
    if (!checker) return ' '
    const color = checker.color
    const symbol = color === 'black' ? 'X' : 'O'
    return symbol
  }

  // Top half of board (positions 13-18 and 19-24)
  for (let row = 0; row < 5; row++) {
    boardDisplay += ' |'
    // Left side: visual positions 13-18
    for (let visualPos = 13; visualPos <= 18; visualPos++) {
      boardDisplay += `${displayPoint(visualPos, row)}`
    }
    boardDisplay += ' | '
    // Display bar checkers - using clockwise bar for top half
    boardDisplay += displayBar(bar.clockwise, row)
    boardDisplay += ' | '
    // Right side: visual positions 19-24
    for (let visualPos = 19; visualPos <= 24; visualPos++) {
      boardDisplay += `${displayPoint(visualPos, row)}`
    }
    boardDisplay += ' |\n'
  }

  boardDisplay += 'v|                   |BAR|                    |\n'

  // Bottom half of board (positions 12-7 and 6-1)
  for (let row = 4; row >= 0; row--) {
    boardDisplay += ' |'
    // Left side: visual positions 12 down to 7
    for (let visualPos = 12; visualPos >= 7; visualPos--) {
      boardDisplay += `${displayPoint(visualPos, row)}`
    }
    boardDisplay += ' | '
    // Display bar checkers - using counterclockwise bar for bottom half
    boardDisplay += displayBar(bar.counterclockwise, row)
    boardDisplay += ' | '
    // Right side: visual positions 6 down to 1
    for (let visualPos = 6; visualPos >= 1; visualPos--) {
      boardDisplay += `${displayPoint(visualPos, row)}`
    }
    boardDisplay += ' |\n'
  }

  boardDisplay += ' +-12-11-10--9-8--7--------6--5--4--3--2--1--+ \n'

  // Count checkers by color instead of direction
  const blackBarCount =
    board.bar.clockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'black'
    ).length +
    board.bar.counterclockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'black'
    ).length
  const whiteBarCount =
    board.bar.clockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'white'
    ).length +
    board.bar.counterclockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'white'
    ).length
  const blackOffCount =
    board.off.clockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'black'
    ).length +
    board.off.counterclockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'black'
    ).length
  const whiteOffCount =
    board.off.clockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'white'
    ).length +
    board.off.counterclockwise.checkers.filter(
      (c: BackgammonChecker) => c.color === 'white'
    ).length

  boardDisplay += `       BLACK BAR: ${blackBarCount}          WHITE BAR: ${whiteBarCount}\n`
  boardDisplay += `       BLACK OFF: ${blackOffCount}          WHITE OFF: ${whiteOffCount}\n`
  return boardDisplay
}
