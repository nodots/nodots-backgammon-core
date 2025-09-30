import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDiceRolled,
  BackgammonDieValue,
  BackgammonMoveDirection,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types'
import { BearOff } from '.'
import { generateId } from '../../..'
import { Board } from '../../../Board'

describe('BearOff', () => {
  describe('move', () => {
    let board: BackgammonBoard
    let player: BackgammonPlayerMoving

    beforeEach(() => {
      board = Board.initialize()
      player = {
        id: generateId(),
        userId: generateId(),
        color: 'black' as BackgammonColor,
        direction: 'clockwise' as BackgammonMoveDirection,
        stateKind: 'moving',
        pipCount: 167,
        dice: {
          id: generateId(),
          color: 'black',
          stateKind: 'rolled',
          currentRoll: [1, 2] as BackgammonRoll,
          total: 3,
        } as BackgammonDiceRolled,
        isRobot: true,
        rollForStartValue: 4,
      }
    })

    // TODO: Fix this test
    // it('should bear off a checker from the home board', () => {
    //   // Clear all checkers from the board
    //   board.points.forEach((point) => {
    //     point.checkers = []
    //   })
    //   board.bar.clockwise.checkers = []
    //   board.bar.counterclockwise.checkers = []

    //   // Add a checker to the home board
    //   const homePoint = board.points[23] // Point 24 for clockwise
    //   homePoint.checkers = [
    //     {
    //       id: generateId(),
    //       color: 'black',
    //       checkercontainerId: homePoint.id,
    //     },
    //   ]

    //   const move: BackgammonMoveReady = {
    //     id: generateId(),
    //     stateKind: 'ready',
    //     player,
    //     dieValue: 1 as BackgammonDieValue,
    //     moveKind: 'bear-off',
    //     origin: homePoint,
    //   }

    //   const result = BearOff.move(board, move)
    //   const completedMove = result.move as BackgammonMoveCompleted
    //   expect(result.board).toBeDefined()
    //   expect(completedMove.stateKind).toBe('completed')
    //   expect(result.board.off.clockwise.checkers.length).toBe(1)
    //   expect(result.board.off.clockwise.checkers[0].color).toBe('black')
    //   expect(homePoint.checkers.length).toBe(0)
    // })

    it('should not allow bearing off when checkers are not in home board', () => {
      // Add a checker to a point outside home board
      const nonHomePoint = board.points[0] // Point 1 for clockwise
      nonHomePoint.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: nonHomePoint.id,
          isMovable: true,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin: nonHomePoint,
        dieValue: 1 as BackgammonDieValue,
        possibleMoves: [],
      }

      expect(() => BearOff.move(board, move)).toThrow()
    })

    it('should not allow bearing off when checkers are on the bar', () => {
      // Add a checker to the bar
      board.bar.clockwise.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: board.bar.clockwise.id,
          isMovable: true,
        },
      ]

      // Add a checker to the home board
      const homePoint = board.points[23] // Point 24 for clockwise
      homePoint.checkers = [
        {
          id: generateId(),
          color: 'black',
          checkercontainerId: homePoint.id,
          isMovable: true,
        },
      ]

      const move: BackgammonMoveReady = {
        id: generateId(),
        player,
        stateKind: 'ready',
        moveKind: 'bear-off',
        origin: homePoint,
        dieValue: 1 as BackgammonDieValue,
        possibleMoves: [],
      }

      expect(() => BearOff.move(board, move)).toThrow()
    })
  })
})
