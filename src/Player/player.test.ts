import { Player } from '.'
import { randomBackgammonColor, randomBackgammonDirection } from '..'
import { BackgammonPlayerInactive } from '../types'

describe('Player', () => {
  let player: BackgammonPlayerInactive
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()

  beforeAll(() => {
    player = Player.initialize(color, direction) as BackgammonPlayerInactive
  })

  it('should initialize the player correctly', () => {
    expect(player).toBeDefined()
  })
})
