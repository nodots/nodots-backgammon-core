import { generateId } from '..'
import {
  BackgammonBoard,
  BackgammonMoves,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
} from '../../types'
import { Move } from '../Move'

/*
 | 'rolling'
  | 'rolled'
  | 'moving'
  | 'moved'
  | 'confirmed'
  */
export interface PlayProps {
  id?: string
  stateKind: BackgammonPlayStateKind
  moves?: BackgammonMoves
  player: BackgammonPlayerRolled | BackgammonPlayerMoving
}

export class Play {
  id?: string = generateId()
  stateKind: BackgammonPlayStateKind = 'rolling'
  moves: BackgammonMoves[] = []
  player!: BackgammonPlayerMoving

  public static initialize({
    id,
    stateKind,
    moves,
    player,
  }: PlayProps): BackgammonPlayRolled {
    if (!id) {
      id = generateId()
    }
    if (!stateKind) {
      stateKind = 'rolling'
    }
    const dice = player.dice
    const roll = dice.currentRoll

    if (!moves) {
      const move1 = Move.initialize({
        player,
        dieValue: roll[0],
      })
      const move2 = Move.initialize({
        player,
        dieValue: roll[1],
      })

      const updatedMoves = [move1, move2]

      if (roll[0] === roll[1]) {
        const move3 = Move.initialize({
          player,
          dieValue: roll[0],
        })
        const move4 = Move.initialize({
          player,
          dieValue: roll[1],
        })
        updatedMoves.push(move3, move4)
      }

      if (updatedMoves.length !== 2 && updatedMoves.length !== 4)
        throw Error('Invalid number of moves')

      moves = updatedMoves as BackgammonMoves
    }

    player = {
      ...player,
      stateKind: 'rolled',
      dice: {
        ...dice,
        stateKind: 'rolled',
      },
    }

    return {
      id: generateId(),
      stateKind: 'rolled',
      moves,
      player,
    }
  }

  public static move(board: BackgammonBoard, play: BackgammonPlayMoving) {
    return {
      ...play,
      stateKind: 'moving',
    }
  }
}
