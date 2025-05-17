import {
  BackgammonBoard,
  BackgammonPoint,
  BackgammonBar,
  BackgammonOff,
} from 'nodots-backgammon-types'

export const ascii = (board: BackgammonBoard, players?: any[]): string => {
  const points = board.BackgammonPoints
  const bar = board.bar
  const off = board.off

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

  const displayPoint = (point: BackgammonPoint, row: number): string => {
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

  const displayOff = (off: BackgammonOff, row: number): string => {
    const checkers = off.checkers
    const checker = checkers[row]
    if (!checker) return ' '
    const color = checker.color
    const symbol = color === 'black' ? 'X' : 'O'
    return `${symbol}`
  }

  for (let row = 0; row < 5; row++) {
    boardDisplay += ' |'
    for (let i = 12; i < 18; i++) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' | '
    // Display bar checkers
    boardDisplay += displayBar(bar.clockwise, row)
    boardDisplay += ' | '
    for (let i = 18; i < 24; i++) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' |\n'
  }
  boardDisplay += 'v|                   |BAR|                    |\n'
  for (let row = 4; row >= 0; row--) {
    boardDisplay += ' |'
    for (let i = 11; i >= 6; i--) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' | '
    // Display bar checkers
    boardDisplay += displayBar(bar.counterclockwise, row)
    boardDisplay += ' | '
    for (let i = 5; i >= 0; i--) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' |\n'
  }
  boardDisplay += ' +-12-11-10--9-8--7--------6--5--4--3--2--1--+ \n'

  // Count checkers by color instead of direction
  const blackBarCount =
    board.bar.clockwise.checkers.filter((c) => c.color === 'black').length +
    board.bar.counterclockwise.checkers.filter((c) => c.color === 'black')
      .length
  const whiteBarCount =
    board.bar.clockwise.checkers.filter((c) => c.color === 'white').length +
    board.bar.counterclockwise.checkers.filter((c) => c.color === 'white')
      .length
  const blackOffCount =
    board.off.clockwise.checkers.filter((c) => c.color === 'black').length +
    board.off.counterclockwise.checkers.filter((c) => c.color === 'black')
      .length
  const whiteOffCount =
    board.off.clockwise.checkers.filter((c) => c.color === 'white').length +
    board.off.counterclockwise.checkers.filter((c) => c.color === 'white')
      .length

  boardDisplay += `       BLACK BAR: ${blackBarCount}          WHITE BAR: ${whiteBarCount}\n`
  boardDisplay += `       BLACK OFF: ${blackOffCount}          WHITE OFF: ${whiteOffCount}\n`
  return boardDisplay
}
