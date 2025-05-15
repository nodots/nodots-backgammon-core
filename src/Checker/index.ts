import { Board, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
} from 'nodots-backgammon-types'

export class Checker {
  public static getCheckers = function getCheckers(
    board: BackgammonBoard
  ): BackgammonChecker[] {
    const checkers: BackgammonChecker[] = []
    for (const point of board.BackgammonPoints) {
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
    return { id: generateId(), color, checkercontainerId }
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
}
