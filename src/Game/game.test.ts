import { Dice, Game, generateId, Player, randomBackgammonColor } from '..'
import {
  BackgammonDiceReady,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
  BackgammonPlayers,
} from '../../types'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
  const clockwisePlayer: BackgammonPlayerInactive = {
    id: generateId(),
    stateKind: 'inactive',
    color: clockwiseColor,
    direction: 'clockwise',
    dice: {
      id: generateId(),
      color: clockwiseColor,
      stateKind: 'inactive',
      currentRoll: undefined,
    },
    pipCount: 167,
  }
  const counterclockwisePlayer: BackgammonPlayerInactive = {
    id: generateId(),
    stateKind: 'inactive',
    color: counterclockwiseColor,
    direction: 'clockwise',
    dice: {
      id: generateId(),
      color: counterclockwiseColor,
      stateKind: 'inactive',
      currentRoll: undefined,
    },
    pipCount: 167,
  }

  const mockPlayers: BackgammonPlayers = [
    clockwisePlayer,
    counterclockwisePlayer,
  ]

  it('should initialize the game with players', () => {
    const game = Game.initialize(mockPlayers)

    expect(game.id).toBeDefined()
    expect(game.players).toBe(mockPlayers)
    expect(game.board).toBeDefined()
    expect(game.cube).toBeDefined()
  })

  it('should roll for start', () => {
    const game = Game.initialize(mockPlayers)
    const rollingGame = Game.rollForStart(game)

    expect(rollingGame.stateKind).toBe('in-progress')
    expect(rollingGame.activeColor).toBeDefined()
  })

  it('winning player should be able to roll dice', () => {
    const game = Game.initialize(mockPlayers)
    const rollingGame = Game.rollForStart(game)
    const activePlayer = rollingGame.players.find(
      (p) => p.color === rollingGame.activeColor
    )

    expect(activePlayer).toBeDefined()
    const activeDice = activePlayer!.dice
    expect(activeDice).toBeDefined()
    expect(activeDice!.stateKind).toBe('ready')
    const rolledDice = Dice.roll(activeDice as BackgammonDiceReady)
    expect(rolledDice.currentRoll).toBeDefined()
    expect(rolledDice.stateKind).toBe('rolled')
  })

  it('winning player should be able to move after rolling the dice', () => {
    const game = Game.initialize(mockPlayers)
    const rollingGame = Game.rollForStart(game)
    const activePlayer = rollingGame.players.find(
      (p) => p.color === rollingGame.activeColor
    ) as BackgammonPlayerRolling

    expect(activePlayer).toBeDefined()
    const activeDice = activePlayer!.dice
    expect(activeDice).toBeDefined()
    expect(activeDice!.stateKind).toBe('ready')
    const rolledPlayer = Player.roll(activePlayer)
    expect(rolledPlayer.dice.currentRoll).toBeDefined()
  })
})
