import { generateId } from '..'
import { PlayRolling, Roll, PlayerPlayingRolling } from '../../backgammon-types'

export const initializing = (
  player: PlayerPlayingRolling,
  roll: Roll
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
//   play: Play,
//   player: IPlayer
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

// const buildMovesForRoll = (roll: Roll, player: IPlayer): Move[] => {
//   const moves: Move[] = [
//     buildMove(roll[0], player),
//     buildMove(roll[1], player),
//   ]

//   return moves
// }
