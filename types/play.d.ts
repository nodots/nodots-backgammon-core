import { BackgammonColor } from './game'
import { PlayerPlayingMoving, PlayerPlayingRolling } from './player'

export interface Play {
  id: string
  kind:
    | 'play-initializing'
    | 'play-rolling'
    | 'play-moving'
    | 'play-moved'
    | 'play-confirming'
    // these last two will require some thought because they are fundamentally different
    | 'play-dice-switched'
    | 'play-doubling'

  activeColor: BackgammonColor
  player: PlayerPlayingRolling | PlayerPlayingMoving
}

export interface PlayInitializing extends Play {
  kind: 'play-initializing'
}

export interface PlayRolling extends Play {
  kind: 'play-rolling'
}

// export interface PlayDoubling extends Play {
//   kind: 'play-rolling'
//   activeColor: BackgammonColor
//   player: PlayerPlayingRolling
// }

// export interface PlayMoving extends Play {
//   kind: 'play-moving'
//   player: PlayerPlayingMoving
//   roll: Roll
//   isForced: boolean
//   analysis: {
//     options: []
//   }
//   moves: Move[]
// }

// export interface PlayDiceSwitched extends Play {
//   kind: 'play-dice-switched'
//   player: PlayerMoving | PlayerRolling
//   roll: Roll
//   isForced: boolean
//   analysis: {
//     options: []
//   }
//   moves: Move[]
// }

// // Transition to this state when the destination of the final move is set,
// // i.e., second checker clicked.
// export interface PlayMoved extends Play {
//   kind: 'play-moved'
//   activeColor: BackgammonColor
//   roll: Roll
//   isForced: boolean
//   analysis: {
//     options: []
//   }
//   moves: Move[]
// }

// export interface PlayConfirming extends Play {
//   kind: 'play-confirming'
//   activeColor: BackgammonColor
//   roll: Roll
//   isForced: boolean
//   analysis: {
//     options: []
//   }
//   moves: Move[]
// }

// export type PlayState =
//   | PlayInitializing
//   | PlayRolling
//   | PlayDiceSwitched
//   | PlayMoving
//   | PlayDoubling
//   | PlayConfirming
