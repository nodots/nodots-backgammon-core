import { Player } from '.'
import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import { BackgammonChecker, BackgammonPlayerRolling } from '../../types'
import {
  BOARD_IMPORT_BOTH_REENTER,
  BOARD_IMPORT_DEFAULT,
} from '../Board/imports'

const monteCarloRuns = 1000

describe('Player', () => {
  const board = Board.initialize(BOARD_IMPORT_DEFAULT)
  const playerColor = randomBackgammonColor()
  const playerDirection = randomBackgammonDirection()
  let player = Player.initialize(playerColor, playerDirection)
  test('should initialize a player', () => {
    expect(player).toBeDefined()
    expect(player.color).toBe(playerColor)
    expect(player.direction).toBe(playerDirection)
  })
  // Sleazy but avoiding dealing with roll for start
  player = {
    ...player,
    stateKind: 'rolling', // FIXME
  }
  const rollingPlayer = player as BackgammonPlayerRolling
  player = Player.roll(rollingPlayer)
  test('should switch the player state to rolling', () => {
    expect(player.stateKind).toBe('rolled')
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
    console.log(opponentHomeBoard)
  })
})
