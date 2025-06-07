import { Board } from '.'
import { BackgammonBoard } from '@nodots-llc/backgammon-types'
import { BOARD_IMPORT_BOTH_BEAROFF } from './imports'
import { describe, beforeEach, it, expect } from '@jest/globals'

describe('Board', () => {
  let board: BackgammonBoard

  beforeEach(() => {
    board = Board.initialize()
  })

  it('should initialize the board', () => {
    expect(board.id).toBeDefined()
    expect(board.BackgammonPoints.length).toBe(24)
    expect(board.bar.clockwise.checkers).toEqual([])
    expect(board.bar.counterclockwise.checkers).toEqual([])
    expect(board.off.clockwise.checkers).toEqual([])
    expect(board.off.counterclockwise.checkers).toEqual([])
    const totalCheckers = board.BackgammonPoints.reduce(
      (acc, point) => {
        acc.black += point.checkers.filter(
          (checker) => checker.color === 'black'
        ).length
        acc.white += point.checkers.filter(
          (checker) => checker.color === 'white'
        ).length
        return acc
      },
      { black: 0, white: 0 }
    )

    expect(totalCheckers.black).toBe(15)
    expect(totalCheckers.white).toBe(15)

    const checkerContainers = Board.getCheckerContainers(board)
    expect(checkerContainers.length).toBe(28)
    expect(checkerContainers.filter((cc) => cc.kind === 'point').length).toBe(
      24
    )
    expect(checkerContainers.filter((cc) => cc.kind === 'bar').length).toBe(2)
    expect(checkerContainers.filter((cc) => cc.kind === 'off').length).toBe(2)

    const points = Board.getPoints(board)
    expect(points.length).toBe(24)
    expect(points[0].position.clockwise).toBe(1)
    expect(points[0].position.counterclockwise).toBe(24)
  })

  const bearOffBoard = Board.buildBoard(BOARD_IMPORT_BOTH_BEAROFF)
  it('should build a board with both players bearing off', () => {
    expect(bearOffBoard.id).toBeDefined()
    expect(bearOffBoard.BackgammonPoints.length).toBe(24)
    expect(bearOffBoard.bar.clockwise.checkers).toEqual([])
    expect(bearOffBoard.bar.counterclockwise.checkers).toEqual([])
    expect(bearOffBoard.off.clockwise.checkers).toEqual([])
    expect(bearOffBoard.off.counterclockwise.checkers).toEqual([])
    const totalCheckers = bearOffBoard.BackgammonPoints.reduce(
      (acc, point) => {
        acc.black += point.checkers.filter(
          (checker) => checker.color === 'black'
        ).length
        acc.white += point.checkers.filter(
          (checker) => checker.color === 'white'
        ).length
        return acc
      },
      { black: 0, white: 0 }
    )

    totalCheckers.black += bearOffBoard.bar.clockwise.checkers.filter(
      (checker) => checker.color === 'black'
    ).length
    totalCheckers.white += bearOffBoard.bar.counterclockwise.checkers.filter(
      (checker) => checker.color === 'white'
    ).length
    totalCheckers.black += bearOffBoard.off.clockwise.checkers.filter(
      (checker) => checker.color === 'black'
    ).length
    totalCheckers.white += bearOffBoard.off.counterclockwise.checkers.filter(
      (checker) => checker.color === 'white'
    ).length

    expect(totalCheckers.black).toBe(15)
    expect(totalCheckers.white).toBe(15)

    const checkerContainers = Board.getCheckerContainers(bearOffBoard)
    expect(checkerContainers.length).toBe(28)
    expect(checkerContainers.filter((cc) => cc.kind === 'point').length).toBe(
      24
    )
    expect(checkerContainers.filter((cc) => cc.kind === 'bar').length).toBe(2)
    expect(checkerContainers.filter((cc) => cc.kind === 'off').length).toBe(2)

    const points = Board.getPoints(bearOffBoard)
    expect(points.length).toBe(24)
    expect(points[0].position.clockwise).toBe(1)
    expect(points[0].position.counterclockwise).toBe(24)
  })

  const randomBoard = Board.generateRandomBoard()
  Board.displayAsciiBoard(randomBoard)
  it('should generate a random board', () => {
    expect(randomBoard.id).toBeDefined()
    expect(randomBoard.BackgammonPoints.length).toBe(24)
    let totalCheckers = randomBoard.BackgammonPoints.reduce(
      (acc, point) => {
        acc.black += point.checkers.filter(
          (checker) => checker.color === 'black'
        ).length
        acc.white += point.checkers.filter(
          (checker) => checker.color === 'white'
        ).length
        return acc
      },
      { black: 0, white: 0 }
    )
    totalCheckers.black += randomBoard.bar.clockwise.checkers.filter(
      (checker) => checker.color === 'black'
    ).length
    totalCheckers.white += randomBoard.bar.counterclockwise.checkers.filter(
      (checker) => checker.color === 'white'
    ).length
    totalCheckers.black += randomBoard.off.clockwise.checkers.filter(
      (checker) => checker.color === 'black'
    ).length
    totalCheckers.white += randomBoard.off.counterclockwise.checkers.filter(
      (checker) => checker.color === 'white'
    ).length

    const checkerContainers = Board.getCheckerContainers(randomBoard)
    expect(checkerContainers.length).toBe(28)
    expect(checkerContainers.filter((cc) => cc.kind === 'point').length).toBe(
      24
    )
    expect(checkerContainers.filter((cc) => cc.kind === 'bar').length).toBe(2)
    expect(checkerContainers.filter((cc) => cc.kind === 'off').length).toBe(2)

    const points = Board.getPoints(randomBoard)
    expect(points.length).toBe(24)
    expect(points[0].position.clockwise).toBe(1)
    expect(points[0].position.counterclockwise).toBe(24)

    expect(totalCheckers.black).toBeLessThanOrEqual(15)
    expect(totalCheckers.white).toBeLessThanOrEqual(15)
  })
})
