import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonDiceRolled,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonMove,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayMoving,
  BackgammonPlayRolling,
  BackgammonPlayStateKind,
} from '../../types'
import { Move } from '../Move'

export interface PlayProps {
  id: string
  stateKind: BackgammonPlayStateKind
  moves: BackgammonMoves
  player: BackgammonPlayerRolled | BackgammonPlayerMoving
}

export class Play {
  id: string = generateId()
  stateKind: BackgammonPlayStateKind = 'initializing'
  moves: BackgammonMoves[] = []
  player!: BackgammonPlayerMoving | BackgammonPlayerRolled

  public static initialize({ player }: PlayProps): BackgammonPlayRolling {
    const moves: BackgammonMove[] = []
    const dice = player.dice as BackgammonDiceRolled
    const roll = dice.currentRoll
    const move1 = Move.initialize({
      player,
      dieValue: roll[0],
    })
    const move2 = Move.initialize({
      player,
      dieValue: roll[1],
    })
    moves.push(move1, move2)
    if (roll[0] === roll[1])
      moves.push(
        Move.initialize({ player, dieValue: roll[0] }),
        Move.initialize({ player, dieValue: roll[1] })
      )

    return {
      id: generateId(),
      stateKind: 'rolling',
      player,
      roll,
      moves,
    }
  }

  public static rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolling {
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

    // FIXME spreader for ...game not working here.
    return {
      id: game.id,
      board: game.board,
      cube: game.cube,
      players: [activePlayer, inactivePlayer],
      stateKind: 'rolling',
      activeColor,
      activePlay: undefined,
    }
  }

  public static move(board: BackgammonBoard, play: BackgammonPlayMoving) {}
}
