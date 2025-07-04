import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { Checker } from '..'
import { Board } from '../../Board'
import { generateId, randomBackgammonColor } from '../../'
import {
  BackgammonBoard,
  BackgammonChecker,
  BackgammonColor,
} from '@nodots-llc/backgammon-types/dist'
import { BOARD_IMPORT_DEFAULT } from '../../Board/imports'
describe('BackgammonChecker', () => {
  let board: BackgammonBoard
  let color: BackgammonColor
  let checker: BackgammonChecker
  let checkers: BackgammonChecker[]
  let randomChecker: BackgammonChecker

  beforeEach(() => {
    board = Board.initialize(BOARD_IMPORT_DEFAULT)
    color = randomBackgammonColor()
    checker = Checker.initialize(color, 'checkercontainer1')
    checkers = Checker.getCheckers(board)
    randomChecker = checkers[Math.floor(Math.random() * checkers.length)]
  })

  it('should create a checker with the correct color', () => {
    expect(checker.color).toBe(color)
  })
  it('should be part of a checker container', () => {
    expect(checker.checkercontainerId).toBe('checkercontainer1')
  })
  it('should be able to build checkers for a checker container', () => {
    checkers = Checker.buildCheckersForCheckerContainerId(
      'checkercontainer1',
      color,
      2
    )
    expect(checkers.length).toBe(2)
    expect(checkers[0].color).toBe(color)
    expect(checkers[0].checkercontainerId).toBe('checkercontainer1')
  })
  it('should get all checkers', () => {
    expect(checkers.length).toBe(30)
  })
  it('should get a checker with a valid id', () => {
    const foundChecker = Checker.getChecker(board, randomChecker.id)
    expect(foundChecker).toEqual(randomChecker)
  })
  it('should throw an error when getting a checker with an invalid id', () => {
    expect(() => Checker.getChecker(board, 'invalidId')).toThrowError()
  })
})
