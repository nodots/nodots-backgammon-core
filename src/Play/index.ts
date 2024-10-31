import { generateId } from '..'
import {
  PlayRolling,
  NodotsRoll,
  NodotsPlayerPlayingRolling,
} from '../../backgammon-types'

export const initializing = (
  player: NodotsPlayerPlayingRolling,
  roll: NodotsRoll
): PlayRolling => {
  return {
    id: generateId(),
    kind: 'play-rolling',
    player,
    activeColor: player.color,
  }
}

// const buildMove = (
//   dieValue: DieValue,
//   play: NodotsPlay,
//   player: INodotsPlayer
// ): MoveInitializing => {
//   return {
//     id: generateId(),
//     playId: play.id,
//     kind: 'move-initializing',
//     player,
//     dieValue,
//     isAuto: player.automation.move,
//     direction: player.direction,
//     isForced: false,
//   }
// }

// const buildMovesForRoll = (roll: Roll, player: INodotsPlayer): NodotsMove[] => {
//   const moves: NodotsMove[] = [
//     buildMove(roll[0], player),
//     buildMove(roll[1], player),
//   ]

//   return moves
// }
