import { BackgammonCheckerContainerImport } from '@nodots-llc/backgammon-types'

const defaultClockwiseColor = 'white'
const defaultCounterclockwiseColor =
  defaultClockwiseColor === 'white' ? 'black' : 'white'

export const BOARD_IMPORT_DEFAULT: BackgammonCheckerContainerImport[] = [
  // WHITE checkers (standard GNU backgammon setup: positions 6, 8, 13, 24)
  {
    position: {
      clockwise: 6,
      counterclockwise: 19,
    },
    checkers: {
      qty: 5,
      color: 'white',
    },
  },
  {
    position: {
      clockwise: 8,
      counterclockwise: 17,
    },
    checkers: {
      qty: 3,
      color: 'white',
    },
  },
  {
    position: {
      clockwise: 13,
      counterclockwise: 12,
    },
    checkers: {
      qty: 5,
      color: 'white',
    },
  },
  {
    position: {
      clockwise: 24,
      counterclockwise: 1,
    },
    checkers: {
      qty: 2,
      color: 'white',
    },
  },
  // BLACK checkers (standard GNU backgammon setup: positions 6, 8, 13, 24 from their perspective)
  {
    position: {
      clockwise: 19,
      counterclockwise: 6,
    },
    checkers: {
      qty: 5,
      color: 'black',
    },
  },
  {
    position: {
      clockwise: 17,
      counterclockwise: 8,
    },
    checkers: {
      qty: 3,
      color: 'black',
    },
  },
  {
    position: {
      clockwise: 12,
      counterclockwise: 13,
    },
    checkers: {
      qty: 5,
      color: 'black',
    },
  },
  {
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: {
      qty: 2,
      color: 'black',
    },
  },
]
