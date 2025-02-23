import {
  Board,
  Dice,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '..'
import {
  BackgammonDiceRolled,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
} from '../../types'
import { Move } from './index'

describe('Move', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const board = Board.initialize()
  const currentRoll = Dice._RandomRoll
  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    direction,
    stateKind: 'moving',
    dice: Dice.initialize(color, 'rolled') as BackgammonDiceRolled,
    pipCount: 167,
  }
  const origin = board.points[0]
  let move: BackgammonMoveReady = {
    id: '1',
    player,
    dieValue: currentRoll[0],
    stateKind: 'ready',
    origin,
  }

  it('should initialize the move correctly', () => {
    const newMove = Move.initialize({ move, origin })
    expect(newMove).toBeDefined()
    expect(newMove.id).toBeDefined()
    expect(newMove.stateKind).toBe('ready')
    expect(newMove.player).toBe(player)
  })

  const validPointToPoint: BackgammonMoveReady = {
    player,
    id: '1',
    dieValue: 1,
    stateKind: 'ready',
    origin,
  } as BackgammonMoveReady
})
