import {
  BackgammonBoard,
  BackgammonPoint,
  BackgammonBar,
  BackgammonOff,
} from '../types'

export const ascii = (board: BackgammonBoard): string => {
  const points = board.points
  const bar = board.bar
  const off = board.off

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
    return `${symbol} `
  }

  const displayOff = (off: BackgammonOff, row: number): string => {
    const checkers = off.checkers
    const checker = checkers[row]
    if (!checker) return ' '
    const color = checker.color
    const symbol = color === 'black' ? 'X' : 'O'
    return `${symbol}`
  }

  let boardDisplay = ' +-13-14-15-16-17-18--------19-20-21-22-23-24-+ \n'

  for (let row = 0; row < 5; row++) {
    boardDisplay += ' |'
    for (let i = 12; i < 18; i++) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' |   | '
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
    boardDisplay += ' |   | '
    for (let i = 5; i >= 0; i--) {
      boardDisplay += `${displayPoint(points[i], row)}`
    }
    boardDisplay += ' |\n'
  }
  boardDisplay += ' +-12-11-10--9-8--7--------6--5--4--3--2--1--+ \n'
  boardDisplay += `       BLACK BAR: ${board.bar.clockwise.checkers.length}          WHITE BAR: ${board.bar.counterclockwise.checkers.length}\n`
  boardDisplay += `       BLACK OFF: ${board.off.clockwise.checkers.length}          WHITE OFF: ${board.off.counterclockwise.checkers.length}\n`
  return boardDisplay
}
