import { Dice, Player, randomBackgammonColor } from '..'
import { BackgammonDiceReady } from '../../types'
import {
  BackgammonPlayerMoving,
  BackgammonPlayerReady,
  BackgammonPlayers,
} from '../../types/player'
import { Move } from '../Move'
import { Play } from '../Play'
import { Game } from './index'

describe('Game', () => {
  const clockwiseColor = randomBackgammonColor()
  const counterClockwiseColor = clockwiseColor === 'white' ? 'black' : 'white'
  const clockwisePlayer: BackgammonPlayerReady = Player.initialize(
    clockwiseColor,
    'clockwise'
  )
  const counterClockwisePlayer: BackgammonPlayerReady = Player.initialize(
    counterClockwiseColor,
    'counterclockwise'
  )

  const mockPlayers: BackgammonPlayers = [
    clockwisePlayer,
    counterClockwisePlayer,
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

    expect(rollingGame.stateKind).toBe('rolling')
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
    ) as BackgammonPlayerMoving

    expect(activePlayer).toBeDefined()
    const activeDice = activePlayer!.dice
    expect(activeDice).toBeDefined()
    expect(activeDice!.stateKind).toBe('ready')
    const rolledDice = Dice.roll(activeDice as BackgammonDiceReady)
    expect(rolledDice.currentRoll).toBeDefined()
    expect(rolledDice.stateKind).toBe('rolled')

    if (!activePlayer) throw new Error('Active player not found')

    const play = Play.initialize(activePlayer, rolledDice.currentRoll!)
    expect(play.stateKind).toBe('moving')
    Dice.isDouble(rolledDice)
      ? expect(play.moves.length).toBe(4)
      : expect(play.moves.length).toBe(2)

    const validMoves = Move.getValidMoves(rollingGame.board, play)
    expect(validMoves).toBeDefined()
    // expect(validMoves.size).toBeGreaterThan(0)

    console.log('validMoves', validMoves)
  })
})
