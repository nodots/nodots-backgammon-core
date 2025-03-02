import { randomBackgammonColor } from '../..'
import { BackgammonCheckercontainerImport } from '../../types'

const defaultClockwiseColor = 'white'
const defaultCounterclockwiseColor =
  defaultClockwiseColor === 'white' ? 'black' : 'white'

export const BOARD_IMPORT_BOTH_REENTER: BackgammonCheckercontainerImport[] = [
  // clockwise
  {
    position: {
      clockwise: 1,
      counterclockwise: 24,
    },
    checkers: {
      qty: 4,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 2,
      counterclockwise: 23,
    },
    checkers: {
      qty: 4,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 3,
      counterclockwise: 22,
    },
    checkers: {
      qty: 4,
      color: defaultClockwiseColor,
    },
  },
  {
    position: {
      clockwise: 4,
      counterclockwise: 21,
    },
    checkers: {
      qty: 1,
      color: defaultClockwiseColor,
    },
  },
  {
    position: 'bar',
    direction: 'clockwise',
    checkers: {
      qty: 2,
      color: defaultClockwiseColor,
    },
  },
  // counterclockwise
  {
    position: {
      clockwise: 20,
      counterclockwise: 5,
    },
    checkers: {
      qty: 4,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 24,
      counterclockwise: 1,
    },
    checkers: {
      qty: 4,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 23,
      counterclockwise: 2,
    },
    checkers: {
      qty: 4,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 22,
      counterclockwise: 3,
    },
    checkers: {
      qty: 4,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 21,
      counterclockwise: 4,
    },
    checkers: {
      qty: 1,
      color: defaultCounterclockwiseColor,
    },
  },
  {
    position: 'bar',
    direction: 'counterclockwise',
    checkers: {
      qty: 2,
      color: defaultCounterclockwiseColor,
    },
  },
]
