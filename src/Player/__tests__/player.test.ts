import { Player } from '..'
import { Board, Dice } from '../..'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDice,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPoint,
} from 'nodots-backgammon-types'
import { describe, it, expect, beforeEach } from '@jest/globals'

describe('Player', () => {
  let player: BackgammonPlayer
  let board: BackgammonBoard
  const color: BackgammonColor = 'white'
  const direction: BackgammonMoveDirection = 'clockwise'

  beforeEach(() => {
    player = Player.initialize(color, direction)
    board = Board.initialize()
  })

  describe('initialize', () => {
    it('should initialize a player with default state', () => {
      expect(player).toBeDefined()
      expect(player.color).toBe(color)
      expect(player.direction).toBe(direction)
      expect(player.stateKind).toBe('inactive')
      expect(player.pipCount).toBe(167)
      expect(player.dice).toBeDefined()
    })

    it('should initialize a player with specified state', () => {
      const rollingPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'rolling'
      )
      expect(rollingPlayer.stateKind).toBe('rolling')
    })

    it('should initialize a winner player with 0 pip count', () => {
      const winnerPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'winner'
      )
      expect(winnerPlayer.stateKind).toBe('winner')
      expect(winnerPlayer.pipCount).toBe(0)
    })
  })

  describe('roll', () => {
    it('should roll dice and update player state', () => {
      const rollingPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'rolling'
      ) as BackgammonPlayerRolling
      const rolledPlayer = Player.roll(rollingPlayer)

      expect(rolledPlayer.stateKind).toBe('rolled')
      expect(
        (rolledPlayer.dice as BackgammonDiceRolled).currentRoll
      ).toBeDefined()
      expect(
        (rolledPlayer.dice as BackgammonDiceRolled).currentRoll!.length
      ).toBe(2)
    })
  })

  describe('getHomeBoard', () => {
    it('should return correct home board points for clockwise direction', () => {
      const homeBoard = Player.getHomeBoard(board, player)
      expect(homeBoard.length).toBe(6)
      homeBoard.forEach((point) => {
        expect(
          (point as BackgammonPoint).position.clockwise
        ).toBeGreaterThanOrEqual(19)
        expect(
          (point as BackgammonPoint).position.clockwise
        ).toBeLessThanOrEqual(24)
      })
    })

    it('should return correct home board points for counterclockwise direction', () => {
      const counterClockwisePlayer = Player.initialize(
        'black',
        'counterclockwise'
      )
      const homeBoard = Player.getHomeBoard(board, counterClockwisePlayer)
      expect(homeBoard.length).toBe(6)
      homeBoard.forEach((point) => {
        expect(
          (point as BackgammonPoint).position.counterclockwise
        ).toBeGreaterThanOrEqual(1)
        expect(
          (point as BackgammonPoint).position.counterclockwise
        ).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('getOpponentBoard', () => {
    it('should return correct opponent board points for clockwise direction', () => {
      const opponentBoard = Player.getOpponentBoard(board, player)
      expect(opponentBoard.length).toBe(6)
      expect(opponentBoard[0].position.clockwise).toBe(1)
      expect(opponentBoard[5].position.clockwise).toBe(6)
    })

    it('should return correct opponent board points for counterclockwise direction', () => {
      const counterClockwisePlayer = Player.initialize(
        'black',
        'counterclockwise'
      )
      const opponentBoard = Player.getOpponentBoard(
        board,
        counterClockwisePlayer
      )
      expect(opponentBoard.length).toBe(6)
      expect(opponentBoard[0].position.clockwise).toBe(19)
      expect(opponentBoard[5].position.clockwise).toBe(24)
    })
  })
})
