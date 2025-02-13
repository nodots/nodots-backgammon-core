import { Player } from '.'
import { Board, randomBackgammonColor, randomBackgammonDirection } from '..'
import {
  BackgammonChecker,
  BackgammonPlayer,
  BackgammonPlayerRolling,
} from '../../types'
import { BOARD_IMPORT_DEFAULT } from '../Board/imports'

const monteCarloRuns = 1000

describe('Player', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const board = Board.initialize()
  const player = Player.initialize({
    id: '1',
    color,
    direction,
    stateKind: 'moving',
    dice: {
      id: '1',
      stateKind: 'rolled',
      color,
      currentRoll: [1, 2],
      total: 3,
    },
    pipCount: 167,
  })

  const homeBoard = Player.getHomeBoard(board, player)
  test(`should have Player (${player.id}${player.direction}:${player.color}) homeboard with 2 checkers on the Ace Point}`, () => {
    expect(homeBoard).toBeDefined()
    let homeBoardCheckers: BackgammonChecker[] = []
    homeBoard.forEach((point) => {
      point.checkers.length > 0 && homeBoardCheckers.push(...point.checkers)
    })
    expect(homeBoardCheckers.length).toBe(7)
  })

  const opponentHomeBoard = Player.getOpponentHomeBoard(board, player)
  test('should get the opponent home board', () => {
    expect(opponentHomeBoard).toBeDefined()
  })
  test('should get the opponent home board points', () => {
    expect(opponentHomeBoard).toBeDefined()
    expect(opponentHomeBoard.length).toBe(6)
    // console.log(opponentHomeBoard)
  })
})
