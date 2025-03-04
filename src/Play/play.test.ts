import { Play } from '.'
import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import { BackgammonPlayerRolled } from '../types'

describe('Play', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const board = Board.initialize()
  let dice = Dice.initialize(color)
  const rolledDice = Dice.roll(dice)

  let player: BackgammonPlayerRolled = {
    id: '1',
    color,
    direction,
    stateKind: 'rolled',
    dice: rolledDice,
    pipCount: 167,
  }

  const play = Play.initialize(board, player)
  const moves = play.moves

  it('should initialize the play correctly', () => {
    const player = play.player
    const { dice } = player
    const currentRoll = dice.currentRoll
    expect(play).toBeDefined()
    expect(play.id).toBeDefined()
    expect(play.stateKind).toBe('rolled')
    expect(player).toBe(player)
    expect(player.color).toBe(color)
    expect(player.direction).toBe(direction)
    expect(dice).toBeDefined()
    expect(player.pipCount).toBe(167)
    expect(dice.stateKind).toBe('rolled')
    expect(moves).toBeDefined()
    expect(moves.length).toBeGreaterThan(0)
    expect(moves.length).toBeLessThanOrEqual(4)
    if (currentRoll[0] === currentRoll[1]) {
      expect(moves.length).toBe(4)
    } else {
      expect(moves.length).toBe(2)
    }
  })

  it('should have valid moves', () => {
    moves.forEach((move) => {
      const { origin, destination, player } = move
      const { dice, color } = player
      const currentRoll = dice.currentRoll
      expect(player).toBeDefined()
      expect(player.stateKind).toBe('rolled')
      expect(dice.stateKind).toBe('rolled')
      expect(origin).toBeUndefined()
      expect(destination).toBeUndefined()
      expect(dice.color).toBe(color)
      expect(currentRoll).toBeDefined()
      if (currentRoll[0] === currentRoll[1]) {
        expect(moves.length).toBe(4)
      } else {
        expect(moves.length).toBe(2)
      }
    })
  })
})
