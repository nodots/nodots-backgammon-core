import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  BackgammonBoard,
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonPointValue,
} from '@nodots-llc/backgammon-types/dist'
import { Board } from '..'
import { BOARD_IMPORT_BOTH_BEAROFF } from '../imports'

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
    expect(bearOffBoard.points.length).toBe(24)
    expect(bearOffBoard.bar.clockwise.checkers).toEqual([])
    expect(bearOffBoard.bar.counterclockwise.checkers).toEqual([])
    expect(bearOffBoard.off.clockwise.checkers).toEqual([])
    expect(bearOffBoard.off.counterclockwise.checkers).toEqual([])
    const totalCheckers = bearOffBoard.points.reduce(
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
    expect(randomBoard.points.length).toBe(24)
    let totalCheckers = randomBoard.points.reduce(
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

  it('should generate bear-off moves when all checkers are in the home board (demonstrates missing behavior)', () => {
    console.log('TEST STARTED: Bear-off test')
    // Set up a board where all white checkers are in the home board (points 19-24 clockwise)
    const boardImport = [
      {
        position: {
          clockwise: 1 as BackgammonPointValue,
          counterclockwise: 24 as BackgammonPointValue,
        },
        checkers: { qty: 3, color: 'white' as BackgammonColor },
      },
      {
        position: {
          clockwise: 2 as BackgammonPointValue,
          counterclockwise: 23 as BackgammonPointValue,
        },
        checkers: { qty: 3, color: 'white' as BackgammonColor },
      },
      {
        position: {
          clockwise: 3 as BackgammonPointValue,
          counterclockwise: 22 as BackgammonPointValue,
        },
        checkers: { qty: 3, color: 'white' as BackgammonColor },
      },
      {
        position: {
          clockwise: 4 as BackgammonPointValue,
          counterclockwise: 21 as BackgammonPointValue,
        },
        checkers: { qty: 3, color: 'white' as BackgammonColor },
      },
      {
        position: {
          clockwise: 5 as BackgammonPointValue,
          counterclockwise: 20 as BackgammonPointValue,
        },
        checkers: { qty: 2, color: 'white' as BackgammonColor },
      },
      {
        position: {
          clockwise: 6 as BackgammonPointValue,
          counterclockwise: 19 as BackgammonPointValue,
        },
        checkers: { qty: 1, color: 'white' as BackgammonColor },
      },
    ]
    const board = Board.initialize(boardImport)
    const player = { color: 'white', direction: 'clockwise' } as any
    // Print the ASCII board for debugging
    console.log(require('../ascii').ascii(board))
    // Try all die values for bearing off
    let foundBearOffMove = false
    for (
      let die = 1 as BackgammonDieValue;
      die <= 6;
      die = (die + 1) as BackgammonDieValue
    ) {
      const moves = Board.getPossibleMoves(board, player, die)
      console.log(`Die: ${die}`, JSON.stringify(moves, null, 2))
      const hasBearOffMove = moves.some(
        (m) => m.destination && m.destination.kind === 'off'
      )
      console.log(`Die ${die} has bear-off move:`, hasBearOffMove)
      if (hasBearOffMove) {
        foundBearOffMove = true
        console.log(`Found bear-off move on die ${die}, breaking`)
        break
      }
    }
    // This should pass, demonstrating that bear-off logic is working
    expect(foundBearOffMove).toBe(true)
  })

  it('should use higher die rule for bear-off (die 6 from point 5)', () => {
    // Reproduce the exact scenario from the simulation log
    // White has checkers on points 1, 2, 3, 5 but NOT on point 6
    const logScenarioBoardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 11, color: 'white' },
      },
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: { qty: 1, color: 'white' },
      },
      {
        position: { clockwise: 3, counterclockwise: 22 },
        checkers: { qty: 1, color: 'white' },
      },
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 1, color: 'white' },
      },
      // Note: NO checker on point 6 - this is key for the higher die rule
    ]

    const board = Board.initialize(logScenarioBoardImport)
    const whitePlayer = { color: 'white', direction: 'clockwise' } as any

    console.log('=== Higher Die Rule Test ===')
    console.log(Board.getAsciiBoard(board))

    // Test die 6 - should find bear-off move from point 5 using higher die rule
    const movesForDie6 = Board.getPossibleMoves(board, whitePlayer, 6)
    console.log('Moves for die 6:', movesForDie6.length)

    if (movesForDie6.length === 0) {
      console.log('❌ BUG: No moves found for die 6')
      console.log('Expected: Bear-off from point 5 using higher die rule')
    } else {
      console.log('✅ Found moves for die 6')
      movesForDie6.forEach((move, i) => {
        const originPoint =
          move.origin.kind === 'point'
            ? move.origin.position.clockwise
            : move.origin.kind
        const destKind = move.destination.kind
        console.log(`  Move ${i}: ${originPoint} → ${destKind}`)
      })
    }

    expect(movesForDie6.length).toBe(1) // Should have exactly 1 move
    expect(movesForDie6[0].origin.kind).toBe('point')
    expect((movesForDie6[0].origin as any).position.clockwise).toBe(5) // Should bear off from point 5
    expect(movesForDie6[0].destination.kind).toBe('off')
  })

  it('should use higher die rule for bear-off (black player die 6 from point 19)', () => {
    // BLACK player scenario - similar to the simulation log
    const blackBearOffBoardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 19, counterclockwise: 6 },
        checkers: { qty: 1, color: 'black' },
      },
      {
        position: { clockwise: 20, counterclockwise: 5 },
        checkers: { qty: 2, color: 'black' },
      },
      {
        position: { clockwise: 21, counterclockwise: 4 },
        checkers: { qty: 3, color: 'black' },
      },
      {
        position: { clockwise: 22, counterclockwise: 3 },
        checkers: { qty: 4, color: 'black' },
      },
      {
        position: { clockwise: 23, counterclockwise: 2 },
        checkers: { qty: 5, color: 'black' },
      },
      // Note: NO checker on point 24 - this is key for the higher die rule
    ]

    const board = Board.initialize(blackBearOffBoardImport)
    const blackPlayer = { color: 'black', direction: 'counterclockwise' } as any

    console.log('=== BLACK Higher Die Rule Test ===')
    console.log(Board.getAsciiBoard(board))

    // Test die 6 - should find bear-off move from point 19 using higher die rule
    const movesForDie6 = Board.getPossibleMoves(board, blackPlayer, 6)
    console.log('Moves for die 6:', movesForDie6.length)

    if (movesForDie6.length === 0) {
      console.log('❌ BUG: No moves found for die 6')
      console.log('Expected: Bear-off from point 19 using higher die rule')
    } else {
      console.log('✅ Found moves for die 6')
      movesForDie6.forEach((move, i) => {
        const originPoint =
          move.origin.kind === 'point'
            ? move.origin.position.clockwise
            : move.origin.kind
        const destKind = move.destination.kind
        console.log(`  Move ${i}: ${originPoint} → ${destKind}`)
      })
    }

    expect(movesForDie6.length).toBe(1) // Should have exactly 1 move
    expect(movesForDie6[0].origin.kind).toBe('point')
    expect((movesForDie6[0].origin as any).position.clockwise).toBe(19) // Should bear off from point 19
    expect(movesForDie6[0].destination.kind).toBe('off')
  })
})
