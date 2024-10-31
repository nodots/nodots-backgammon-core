import { generateId } from '..'
import { NodotsBoard, NodotsChecker, NodotsColor } from '../../@types'
import { getCheckers } from '../Board'

export const getChecker = (board: NodotsBoard, id: string): NodotsChecker => {
  const checker = getCheckers(board).find((checker) => checker.id === id)
  if (!checker) {
    throw Error(`No checker found for ${id}`)
  }
  return checker
}

export const buildChecker = (
  color: NodotsColor,
  checkercontainerId: string
): NodotsChecker => {
  return { id: generateId(), color, checkercontainerId }
}

export const buildCheckersForCheckercontainerId = (
  color: NodotsColor,
  checkercontainerId: string,
  count: number
): NodotsChecker[] => {
  const checkers: NodotsChecker[] = []

  for (let i = 0; i < count; i++) {
    const checker: NodotsChecker = {
      id: generateId(),
      color,
      checkercontainerId,
    }
    checkers.push(checker)
  }
  return checkers
}
