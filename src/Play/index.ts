import { generateId, Player } from '..'
import {
  BackgammonBoard,
  BackgammonCube,
  BackgammonMoves,
  BackgammonPlay,
  BackgammonPlayerMoving,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayRolled,
  BackgammonPlayStateKind,
} from '../../types'

export class Play {
  id?: string = generateId()
  cube?: BackgammonCube
  stateKind?: BackgammonPlayStateKind
  moves: BackgammonMoves[] = []
  player!:
    | BackgammonPlayerRolling
    | BackgammonPlayerRolled
    | BackgammonPlayerMoving

  public static initialize({
    id,
    stateKind,
    player,
    moves,
  }: BackgammonPlay): BackgammonPlay {
    if (!id) {
      id = generateId()
    }
    if (!stateKind) {
      stateKind = 'rolling'
    }

    player = {
      ...player,
      stateKind: 'rolling',
    }

    const play = {
      id,
      stateKind,
      player,
      moves,
    }
    return play
  }

  public static roll(play: BackgammonPlay): BackgammonPlayRolled {
    let { player } = play
    const { dice } = player
    player = Player.roll(dice)

    play = {
      ...play,
      stateKind: 'rolled',
      player,
    }

    return {
      ...play,
      stateKind: 'rolled',
    }
  }

  public static move(board: BackgammonBoard, play: BackgammonPlayMoving) {
    return {
      ...play,

      stateKind: 'moving',
    }
  }
}
