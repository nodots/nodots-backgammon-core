import { Play } from '.'
import { BackgammonPlay } from '../../types'

describe('Play', () => {
  let play: BackgammonPlay

  beforeAll(() => {
    play = Play.initialize({
      stateKind: 'rolling',
      player: {
        id: '1',
        stateKind: 'rolling',
        color: 'black',
        direction: 'clockwise',
        dice: {
          id: '1',
          stateKind: 'inactive',
          color: 'black',
        },
        pipCount: 167,
      },
      moves: [],
    })
  })

  it('should initialize the play correctly', () => {
    expect(play).toBeDefined()
    expect(play.id).toBeDefined()
    expect(play.stateKind).toBe('rolling')
    expect(play.player).toBeDefined()
    expect(play.player.id).toBe('1')
    expect(play.player.stateKind).toBe('rolling')
  })

  it('should correctly handle a roll', () => {
    play = Play.roll(play)
    expect(play.stateKind).toBe('rolled')
    expect(play.player.stateKind).toBe('rolled')
    expect(play.player.dice.stateKind).toBe('rolled')
    expect(play.player.dice.currentRoll).toBeDefined()
    expect(play.player.dice.currentRoll[0]).toBeGreaterThan(0)
    expect(play.player.dice.currentRoll[0]).toBeLessThan(7)
    expect(play.player.dice.currentRoll[1]).toBeGreaterThan(0)
    expect(play.player.dice.currentRoll[1]).toBeLessThan(7)
  })

  it('should handle an invalid move', () => {
    // Add test logic here
  })

  it('should detect a win condition', () => {
    // Add test logic here
  })

  it('should reset the game', () => {
    // Add test logic here
  })
})
