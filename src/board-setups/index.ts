import { NodotsCheckercontainerImport } from '../nodots_modules/@nodots/backgammon-types'

type NodotsBoardImport = NodotsCheckercontainerImport[]

export const BOARD_IMPORT_DEFAULT: NodotsBoardImport = [
  { position: 24, checkercount: 2 },
  { position: 13, checkercount: 5 },
  { position: 8, checkercount: 3 },
  { position: 6, checkercount: 5 },
]

export const BOARD_IMPORT_ALL_ACE: NodotsBoardImport = [
  { position: 1, checkercount: 15 },
]

export const BOARD_IMPORT_ALL_OFF: NodotsBoardImport = [
  { position: 'off', checkercount: 15 },
]

export const BOARD_IMPORT_ALL_BAR: NodotsBoardImport = [
  { position: 'bar', checkercount: 15 },
]

export const BOARD_IMPORT_BEAR_OFF: NodotsBoardImport = [
  { position: 1, checkercount: 2 },
  { position: 2, checkercount: 2 },
  { position: 3, checkercount: 2 },
  { position: 4, checkercount: 3 },
  { position: 5, checkercount: 3 },
  { position: 6, checkercount: 3 },
]

export const BOARD_IMPORT_END_GAME: NodotsBoardImport = [
  { position: 1, checkercount: 1 },
  { position: 2, checkercount: 3 },
  { position: 3, checkercount: 2 },
  { position: 4, checkercount: 2 },
  { position: 5, checkercount: 3 },
  { position: 5, checkercount: 2 },
  { position: 'off', checkercount: 2 },
]

export const BOARD_IMPORT_REENTER: NodotsBoardImport = [
  { position: 'bar', checkercount: 1 },
  { position: 3, checkercount: 3 },
  { position: 19, checkercount: 4 },
  { position: 20, checkercount: 4 },
  { position: 24, checkercount: 3 },
]
