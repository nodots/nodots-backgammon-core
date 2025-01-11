import { Board, generateId } from '..'
import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
} from '../../types'

export const getChecker = (
  board: BackgammonBoard,
  id: string
): BackgammonChecker => {
  const checker = Board.getCheckers(board).find((checker) => checker.id === id)
  if (!checker) {
    throw Error(`No checker found for ${id}`)
  }
  return checker
}

export const buildChecker = (
  color: BackgammonColor,
  checkercontainerId: string
): BackgammonChecker => {
  return { id: generateId(), color, checkercontainerId }
}

export const buildCheckersForCheckercontainerId = (
  checkercontainerId: string,
  color: BackgammonColor,
  count: number
): BackgammonChecker[] => {
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
