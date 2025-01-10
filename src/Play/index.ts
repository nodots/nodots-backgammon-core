import { Dice, generateId, randomBackgammonColor } from '..'
import {
  BackgammonMove,
  BackgammonPlayerMoving,
  BackgammonPlayers,
  BackgammonPlayStateKind,
  BackgammonRoll,
  BaseBgPlay,
  GameRolling,
  GameRollingForStart,
  PlayInitializing,
  PlayMoving,
} from '../../types'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Move } from '../Move'

export class Play implements BaseBgPlay {
  id: string | undefined
  stateKind: BackgammonPlayStateKind | undefined = undefined
  players: BackgammonPlayers | undefined = undefined
  board: Board | undefined = undefined
  cube: Cube | undefined = undefined
  rollForStart!: (game: GameRollingForStart) => GameRolling

  public static initialize(
    player: BackgammonPlayerMoving,
    roll: BackgammonRoll
  ): PlayMoving {
    const moves: BackgammonMove[] = []
    const move1 = Move.initialize(player, roll[0])
    const move2 = Move.initialize(player, roll[1])
    moves.push(move1, move2)
    if (roll[0] === roll[1])
      moves.push(
        Move.initialize(player, roll[0]),
        Move.initialize(player, roll[1])
      )

    return {
      id: generateId(),
      stateKind: 'moving',
      player,
      roll,
      moves,
    }
  }

  public static rollForStart(game: GameRollingForStart): GameRolling {
    const activeColor = randomBackgammonColor()
    const activePlayer = game.players.find((p) => p.color === activeColor)
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    if (!activePlayer.dice) {
      throw new Error('Active player dice not found')
    }
    activePlayer.dice.stateKind === 'ready'
    const inactivePlayer = game.players.find((p) => p.color !== activeColor)
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return {
      ...game,
      players: [activePlayer, inactivePlayer],
      stateKind: 'rolling',
      activeColor,
    }
  }
}
