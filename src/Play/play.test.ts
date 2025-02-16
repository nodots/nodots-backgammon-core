import { Play } from '.'
import { Dice, randomBackgammonColor, randomBackgammonDirection } from '..'
import { BackgammonMoves, BackgammonPlayerRolled } from '../../types'

describe('Play', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll = Dice._RandomRoll
  const isDoubles = currentRoll[0] === currentRoll[1] ? true : false
  const total = currentRoll[0] + currentRoll[1]
  let moves: BackgammonMoves | undefined
  let player: BackgammonPlayerRolled = {
    id: '1',
    color,
    direction,
    stateKind: 'rolled',
    dice: {
      id: '1',
      color,
      stateKind: 'rolled',
      currentRoll,
      total,
    },
    pipCount: 167,
  }

  it('should initialize the play correctly', () => {
    let play = Play.initialize(player)
    player = play.player
    moves = play.moves
    const { dice } = player
    expect(play).toBeDefined()
    expect(play.id).toBeDefined()
    expect(play.stateKind).toBe('rolled')
    expect(player).toBe(player)
    expect(player.color).toBe(color)
    expect(player.direction).toBe(direction)
    expect(dice).toBeDefined()
    expect(player.pipCount).toBe(167)
    expect(dice.stateKind).toBe('rolled')
    expect(dice.currentRoll).toEqual(currentRoll)
    expect(dice.total).toBe(total)
    isDoubles
      ? expect(Dice.isDouble(dice)).toBe(true)
      : expect(Dice.isDouble(dice)).toBe(false)
    isDoubles ? expect(moves?.length).toBe(4) : expect(moves?.length).toBe(2)
  })

  // it('should set the play to ready', () => {
  //   play = Play.setReady(play)
  //   expect(play.stateKind).toBe('ready')
  // })
})
