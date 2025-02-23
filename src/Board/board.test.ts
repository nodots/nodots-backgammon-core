import { Board } from '.'
import { BackgammonBoard } from '../../types'

describe('Board', () => {
  let board: BackgammonBoard

  beforeEach(() => {
    board = Board.initialize()
  })

  it('should initialize the board', () => {
    expect(board.id).toBeDefined()
    expect(board.points.length).toBe(24)
    expect(board.bar.clockwise.checkers).toEqual([])
    expect(board.bar.counterclockwise.checkers).toEqual([])
    expect(board.off.clockwise.checkers).toEqual([])
    expect(board.off.counterclockwise.checkers).toEqual([])
    const totalCheckers = board.points.reduce(
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

    const checkerContainers = Board.getCheckercontainers(board)
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

  const randomBoard = Board.generateRandomBoard()
  const displayAsciiBoard = Board.displayAsciiBoard(randomBoard)
  console.log('displayAsciiBoard:', displayAsciiBoard)
})
