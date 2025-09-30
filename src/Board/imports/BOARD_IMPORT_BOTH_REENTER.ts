import { BackgammonCheckerContainerImport } from '@nodots-llc/backgammon-types'

// Define colors explicitly to ensure consistency
const clockwiseColor = 'white'
const counterclockwiseColor = 'black'

export const BOARD_IMPORT_BOTH_REENTER: BackgammonCheckerContainerImport[] = [
  // Clockwise player's checkers
  {
    position: {
      clockwise: 13,
      counterclockwise: 12,
    },
    checkers: {
      qty: 5,
      color: clockwiseColor,
    },
  },
  {
    position: {
      clockwise: 8,
      counterclockwise: 17,
    },
    checkers: {
      qty: 3,
      color: clockwiseColor,
    },
  },
  {
    position: {
      clockwise: 6,
      counterclockwise: 19,
    },
    checkers: {
      qty: 5,
      color: clockwiseColor,
    },
  },
  // Checkers on bar for clockwise player
  {
    position: 'bar',
    direction: 'clockwise',
    checkers: {
      qty: 2,
      color: clockwiseColor,
    },
  },

  // Counterclockwise player's checkers
  {
    position: {
      clockwise: 12,
      counterclockwise: 13,
    },
    checkers: {
      qty: 5,
      color: counterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 17,
      counterclockwise: 8,
    },
    checkers: {
      qty: 3,
      color: counterclockwiseColor,
    },
  },
  {
    position: {
      clockwise: 19,
      counterclockwise: 6,
    },
    checkers: {
      qty: 5,
      color: counterclockwiseColor,
    },
  },
  // Single opponent checker on entry point for testing hitting
  {
    position: {
      clockwise: 24, // Point 24 for clockwise player's entry
      counterclockwise: 1,
    },
    checkers: {
      qty: 1,
      color: counterclockwiseColor,
    },
  },
  // Checkers on bar for counterclockwise player
  {
    position: 'bar',
    direction: 'counterclockwise',
    checkers: {
      qty: 2,
      color: counterclockwiseColor,
    },
  },
]
