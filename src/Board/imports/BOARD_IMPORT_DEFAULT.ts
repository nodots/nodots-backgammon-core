import { BackgammonCheckerContainerImport } from '@nodots-llc/backgammon-types'

const defaultClockwiseColor = 'white'
const defaultCounterclockwiseColor =
  defaultClockwiseColor === 'white' ? 'black' : 'white'

export const BOARD_IMPORT_DEFAULT: BackgammonCheckerContainerImport[] = [
  // WHITE checkers (standard GNU backgammon setup)
  {
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: {
      qty: 2,
      color: 'white', // White starts on point 1 (their 24-point)
    },
  },
  {
    position: {
      clockwise: 6,
      counterclockwise: 19,
    },
    checkers: {
      qty: 5,
      color: 'white', // White has 5 on point 6 (their 6-point)
    },
  },
  {
    position: {
      clockwise: 8,
      counterclockwise: 17,
    },
    checkers: {
      qty: 3,
      color: 'white', // White has 3 on point 8 (their 8-point)
    },
  },
  {
    position: {
      clockwise: 13,
      counterclockwise: 12,
    },
    checkers: {
      qty: 5,
      color: 'white', // White has 5 on point 13 (their 13-point)
    },
  },
  // BLACK checkers (standard GNU backgammon setup)
  {
    position: {
      clockwise: 24,
      counterclockwise: 1,
    },
    checkers: {
      qty: 2,
      color: 'black', // Black starts on point 24 (their 24-point)
    },
  },
  {
    position: {
      clockwise: 19,
      counterclockwise: 6,
    },
    checkers: {
      qty: 5,
      color: 'black', // Black has 5 on point 19 (their 6-point)
    },
  },
  {
    position: {
      clockwise: 17,
      counterclockwise: 8,
    },
    checkers: {
      qty: 3,
      color: 'black', // Black has 3 on point 17 (their 8-point)
    },
  },
  {
    position: {
      clockwise: 12,
      counterclockwise: 13,
    },
    checkers: {
      qty: 5,
      color: 'black', // Black has 5 on point 12 (their 13-point)
    },
  },
]
