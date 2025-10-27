import { describe, test, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '..'
import type { BackgammonDieValue, BackgammonPlayerMoving } from '@nodots-llc/backgammon-types'

function setupPlayerWithDice(direction: 'clockwise'|'counterclockwise', roll: [BackgammonDieValue, BackgammonDieValue]): BackgammonPlayerMoving {
  const p = Player.initialize('white', direction, 'rolling', true) as any
  const rolled = Player.roll(p)
  rolled.dice.currentRoll = roll
  return Player.initialize('white', direction, 'moving', true, rolled.userId) as any
}

function getPositions(board: any, cw: number, ccw: number) {
  return board.points.find((pt: any) => pt.position.clockwise === cw && pt.position.counterclockwise === ccw)
}

describe('GNU alignment — remaining-die point-to-point legality', () => {
  test('clockwise: remaining die 2 should allow 3→1', () => {
    const board = Board.initialize([])
    // Place a white checker at 3 (cw=3, ccw=22)
    const setup = Board.initialize([
      { position: { clockwise: 3, counterclockwise: 22 }, checkers: { qty: 1, color: 'white' } }
    ])
    const player = setupPlayerWithDice('clockwise', [6 as any, 2 as any])
    const play = Play.initialize(setup, player)
    // Simulate first sub-move (consume die 6) by moving from a different point if available: just reinitialize moves for die=2
    const moves = Board.getPossibleMoves(setup, player, 2 as any) as any[]
    // Expect a move from 3 to 1 present among possible moves
    const has = moves.some(pm => {
      const o = pm.origin?.position?.clockwise
      const d = pm.destination?.position?.clockwise
      return o === 3 && d === 1
    })
    expect(has).toBe(true)
  })

  test('clockwise: remaining die 3 should allow 4→1', () => {
    const setup = Board.initialize([
      { position: { clockwise: 4, counterclockwise: 21 }, checkers: { qty: 1, color: 'white' } }
    ])
    const player = setupPlayerWithDice('clockwise', [6 as any, 3 as any])
    const moves = Board.getPossibleMoves(setup, player, 3 as any) as any[]
    const has = moves.some(pm => pm.origin?.position?.clockwise === 4 && pm.destination?.position?.clockwise === 1)
    expect(has).toBe(true)
  })

  test('clockwise: remaining die 6 should allow 19→13', () => {
    const setup = Board.initialize([
      { position: { clockwise: 19, counterclockwise: 6 }, checkers: { qty: 1, color: 'white' } }
    ])
    const player = setupPlayerWithDice('clockwise', [1 as any, 6 as any])
    const moves = Board.getPossibleMoves(setup, player, 6 as any) as any[]
    const has = moves.some(pm => pm.origin?.position?.clockwise === 19 && pm.destination?.position?.clockwise === 13)
    expect(has).toBe(true)
  })
})

