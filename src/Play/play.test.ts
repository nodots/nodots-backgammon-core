import { Play } from '.'
import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonPlay,
  BackgammonPlayerRolling,
  BackgammonPlayRolled,
  BackgammonPoint,
} from '../types'

describe('Play', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const board = Board.initialize()
  let dice = Dice.initialize(color)
  dice.stateKind = 'rolling'

  let player: BackgammonPlayerRolling = {
    id: '1',
    color,
    direction,
    stateKind: 'rolling',
    dice,
    pipCount: 167,
  }

  const play = Play.roll({
    board,
    player,
  })
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

  // const validMoves = Play.getValidMoves(board, play.moves)

  // it('should find valid moves from the default board', () => {
  //   expect(validMoves).toBeDefined()
  //   expect(validMoves.size).toBeGreaterThan(0)
  //   validMoves.forEach((move) => {
  //     expect(move.origin).toBeDefined()
  //     expect(move.destination).toBeDefined()
  //     expect(move.origin).not.toBe(move.destination)
  //     expect(move.origin!.position).toBeDefined()
  //     expect(move.destination!.position).toBeDefined()
  //     expect(move.origin!.position).not.toBe(move.destination!.position)
  //     expect(move.origin!.checkers.length).toBeGreaterThan(0)
  //     if (move.destination!.checkers.length > 0) {
  //       expect(move.destination!.checkers[0].color).toBe(player.color)
  //     }
  //     if (move.destination!.checkers.length >= 1) {
  //       expect(move.destination!.checkers[0].color).toBe(player.color)
  //     }
  //     if (move.origin?.kind === 'point' && move.destination?.kind === 'point') {
  //       const origin = move.origin as BackgammonPoint
  //       const destination = move.destination as BackgammonPoint
  //       expect(origin.checkers.length).toBeGreaterThan(0)
  //       const originPosition = origin.position[player.direction]
  //       const expectedDestinationPosition = originPosition + move.dieValue
  //       expect(destination.position[player.direction]).toBe(
  //         expectedDestinationPosition
  //       )
  //       if (destination.checkers.length > 0) {
  //         expect(destination.checkers[0].color).toBe(player.color)
  //       }
  //     }
  //   })
  // })
})
