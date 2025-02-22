import { Play } from '.'
import { Dice, randomBackgammonColor, randomBackgammonDirection } from '..'
import {
  BackgammonColor,
  BackgammonDiceStateKind,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerRolled,
  BackgammonPlayerStateKind,
  BackgammonRoll,
} from '../../types'

describe('Play', () => {
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const roll: BackgammonRoll = [3, 4]
  const total = roll.reduce((a, b) => a + b, 0)
  let dice: {
    id: string
    color: BackgammonColor
    stateKind: 'rolled'
    currentRoll: BackgammonRoll
    total: number
  } = {
    id: '1',
    color,
    stateKind: 'rolled',
    currentRoll: roll,
    total,
  }
  let player: BackgammonPlayerRolled = {
    id: '1',
    color,
    direction,
    stateKind: 'rolled',
    dice,
    pipCount: 167,
  }

  let play: BackgammonPlay = Play.roll({ player })

  it('should initialize the play correctly', () => {
    player = play.player
    const moves = play.moves
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
    expect(moves).toBeDefined()
    if (roll[0] === roll[1]) {
      expect(moves.length).toBe(4)
    } else {
      expect(moves.length).toBe(2)
    }
  })

  // it('should set the play to ready', () => {
  //   play = Play.setReady(play)
  //   expect(play.stateKind).toBe('ready')
  // })
})
