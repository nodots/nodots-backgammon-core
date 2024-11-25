import { BackgammonBoard } from './board'
import { BackgammonChecker } from './checker'
import { BackgammonCube } from './cube'
import { BackgammonRoll, BackgammonDice } from './dice'
import { Play } from './play'
import { BackgammonPlayers } from './player'

export type BackgammonColor = 'black' | 'white'
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'

export const MAX_PIP_COUNT = 167
export type BackgammonPips =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127
  | 128
  | 129
  | 130
  | 131
  | 132
  | 133
  | 134
  | 135
  | 136
  | 137
  | 138
  | 139
  | 140
  | 141
  | 142
  | 143
  | 144
  | 145
  | 146
  | 147
  | 148
  | 149
  | 150
  | 151
  | 152
  | 153
  | 154
  | 155
  | 156
  | 157
  | 158
  | 159
  | 160
  | 161
  | 162
  | 163
  | 164
  | 165
  | 166
  | 167

export const CHECKERS_PER_PLAYER = 15
export type BackgammonPointValue =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24

export type BackgammonPlayerCheckers = [
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker,
  BackgammonChecker
]

export type BackgammonGameState =
  | 'rolling-for-start'
  | 'rolling'
  | 'moving'
  | 'double-proposed'
  | 'resignation-proposed'
  | 'completed'

type _Game = {
  kind: BackgammonGameState
  players: BackgammonPlayers
  board: BackgammonBoard
  dice: BackgammonDice
  cube: BackgammonCube
}

export interface GameRollingForStart extends _Game {
  id: string
  kind: 'rolling-for-start'
}

export interface GameRolling extends _Game {
  id: string
  kind: 'rolling'
  activeColor: BackgammonColor
}

export interface GameDoubleProposed extends _Game {
  id: string
  kind: 'double-proposed'
  activeColor: BackgammonColor
}

export interface GameResignationProposed extends _Game {
  id: string
  kind: 'rolling'
  activeColor: BackgammonColor
}

export interface GameMoving extends _Game {
  id: string
  kind: 'moving'
  activeColor: BackgammonColor
  activeRoll: BackgammonRoll
  activePlay: Play
}

export interface GameOver extends _Game {
  id: string
  kind: 'over'
}

export type BackgammonGame =
  | GameInitializing
  | GameRollingForStart
  | GameRolling
  | GameMoving
  | GameDoubleProposed
  | GameResignationProposed
  | GameOver

export type BackgammonGameActive =
  | GameRollingForStart
  | GameRolling
  | GameMoving
  | GameDoubleProposed
  | GameResignationProposed
