import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
} from '@nodots-llc/backgammon-types/dist'
import { Board, generateId } from '..'

export class Checker {
  public static getCheckers = function getCheckers(
    board: BackgammonBoard
  ): BackgammonChecker[] {
    const checkers: BackgammonChecker[] = []
    for (const point of board.points) {
      for (const checker of point.checkers) {
        checkers.push(checker)
      }
    }
    return checkers
  }

  public static initialize = function initializeChecker(
    color: BackgammonColor,
    checkercontainerId: string
  ): BackgammonChecker {
    return { id: generateId(), color, checkercontainerId, isMovable: false }
  }

  public static buildCheckersForCheckerContainerId =
    function buildCheckersForCheckerContainerId(
      checkercontainerId: string,
      color: BackgammonColor,
      count: number
    ): BackgammonChecker[] {
      const tempCheckers: BackgammonChecker[] = []

      for (let i = 0; i < count; i++) {
        const checker: BackgammonChecker = {
          id: generateId(),
          color,
          checkercontainerId,
          isMovable: false,
        }
        tempCheckers.push(checker)
      }
      return tempCheckers
    }

  public static getChecker = function getChecker(
    board: BackgammonBoard,
    id: string
  ): BackgammonChecker {
    const checker = Board.getCheckers(board).find(function findChecker(
      checker
    ) {
      return checker.id === id
    })
    if (!checker) {
      throw Error(`No checker found for ${id}`)
    }
    return checker
  }

  public static updateMovableCheckers = function updateMovableCheckers(
    board: BackgammonBoard,
    movableContainerIds: string[]
  ): BackgammonBoard {
    const updatedBoard = { ...board }
    
    // Reset all checkers to not movable
    for (const point of updatedBoard.points) {
      for (const checker of point.checkers) {
        checker.isMovable = false
      }
    }
    
    // Set bar checkers to not movable
    if (updatedBoard.bar && updatedBoard.bar.clockwise) {
      for (const checker of updatedBoard.bar.clockwise.checkers) {
        checker.isMovable = false
      }
    }
    if (updatedBoard.bar && updatedBoard.bar.counterclockwise) {
      for (const checker of updatedBoard.bar.counterclockwise.checkers) {
        checker.isMovable = false
      }
    }
    
    // Mark checkers in movable containers as movable
    for (const containerId of movableContainerIds) {
      // Check points
      const point = updatedBoard.points.find(p => p.id === containerId)
      if (point) {
        for (const checker of point.checkers) {
          checker.isMovable = true
        }
      }
      
      // Check bars
      if (updatedBoard.bar && updatedBoard.bar.clockwise && updatedBoard.bar.clockwise.id === containerId) {
        for (const checker of updatedBoard.bar.clockwise.checkers) {
          checker.isMovable = true
        }
      }
      if (updatedBoard.bar && updatedBoard.bar.counterclockwise && updatedBoard.bar.counterclockwise.id === containerId) {
        for (const checker of updatedBoard.bar.counterclockwise.checkers) {
          checker.isMovable = true
        }
      }
    }
    
    return updatedBoard
  }
}
