import { generateId, randomBackgammonColor } from '..'
import {
  BackgammonBoard,
  BackgammonDiceRolled,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonMove,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayer,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
  BackgammonPlayRolling,
  BackgammonPlayStateKind,
} from '../../types'
import { Move } from '../Move'

export interface PlayProps {
  id?: string
  stateKind: BackgammonPlayStateKind
  moves: BackgammonMoves
  player: BackgammonPlayerRolled | BackgammonPlayerMoving
}

export class Play {
  id: string = generateId()
  stateKind: BackgammonPlayStateKind = 'initializing'
  moves: BackgammonMoves[] = []
  player!: BackgammonPlayerMoving | BackgammonPlayerRolled

  public static initialize({
    player,
  }: PlayProps): BackgammonPlayRolled | BackgammonPlayMoving {
    const moves: BackgammonMove[] = []
    const dice = player.dice
    const roll = dice.currentRoll

    switch (player.stateKind) {
      case 'moving':
        if (moves.length !== 2 && moves.length !== 4)
          throw Error('Moves must be length 2 or 4')
        return {
          id: generateId(),
          stateKind: 'moving',
          moves,
          player,
          roll,
        }
      case 'rolled':
        const playerRolled = player as BackgammonPlayerRolled
        const m1 = Move.initialize({ player: playerRolled, dieValue: roll[0] })
        return {
          id: generateId(),
          stateKind: 'rolled',
          moves,
          player,
          roll,
        }
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

  public static move(board: BackgammonBoard, play: BackgammonPlayMoving) {
    return {
      ...play,
      stateKind: 'moving',
    }
  }
}
