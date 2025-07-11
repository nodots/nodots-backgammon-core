import { Board, Player } from './src/index'

console.log('=== TESTING TURN 31 BEAR-OFF BUG ===')

// Reproduce the exact Turn 31 scenario from the log
// Player X (Nodots, counterclockwise) has pieces in bear-off position
// Roll: [5,1]

const boardImport = [
  // Player X (counterclockwise) pieces - corrected from ASCII board
  {
    position: { clockwise: 24, counterclockwise: 1 },
    checkers: { qty: 8, color: 'black' },
  }, // Point 24 has (8)
  {
    position: { clockwise: 23, counterclockwise: 2 },
    checkers: { qty: 1, color: 'black' },
  }, // Point 23 has X
  {
    position: { clockwise: 22, counterclockwise: 3 },
    checkers: { qty: 1, color: 'black' },
  }, // Point 22 has X
  {
    position: { clockwise: 21, counterclockwise: 4 },
    checkers: { qty: 1, color: 'black' },
  }, // Point 21 has X
  {
    position: { clockwise: 20, counterclockwise: 5 },
    checkers: { qty: 1, color: 'black' },
  }, // Point 20 has X
  {
    position: { clockwise: 19, counterclockwise: 6 },
    checkers: { qty: 1, color: 'black' },
  }, // Point 19 has X

  // 2 X checkers already off to make 15 total
  {
    position: 'off',
    direction: 'counterclockwise',
    checkers: { qty: 2, color: 'black' },
  },

  // Player O (clockwise) pieces - some already off
  {
    position: { clockwise: 1, counterclockwise: 24 },
    checkers: { qty: 12, color: 'white' },
  }, // Point 1 has (12)
  {
    position: { clockwise: 2, counterclockwise: 23 },
    checkers: { qty: 2, color: 'white' },
  }, // Point 2 has OO
  {
    position: { clockwise: 3, counterclockwise: 22 },
    checkers: { qty: 1, color: 'white' },
  }, // Point 3 has O
  {
    position: { clockwise: 12, counterclockwise: 13 },
    checkers: { qty: 1, color: 'white' },
  }, // Point 12 has O

  // Some white checkers already off
  {
    position: 'off',
    direction: 'clockwise',
    checkers: { qty: 1, color: 'white' },
  },
] as any

const board = Board.initialize(boardImport)

// Create Player X (Nodots, counterclockwise, black)
const playerX = Player.initialize(
  'black',
  'counterclockwise',
  undefined,
  'nodots-bot',
  'moving',
  true,
  'nodots-user'
) as any

console.log('\n=== BOARD STATE (Turn 31) ===')
console.log('Player X (black, counterclockwise) pieces in bear-off position')
console.log('Roll: [5,1]')
console.log('\nBoard ASCII:')
console.log(Board.getAsciiBoard(board))

console.log('\n=== TESTING BEAR-OFF MOVES ===')

// Test die 5
console.log('\n--- Testing die 5 ---')
const movesForDie5 = Board.getPossibleMoves(board, playerX, 5 as any)
console.log(`Found ${movesForDie5.length} moves for die 5`)

// Test die 1
console.log('\n--- Testing die 1 ---')
const movesForDie1 = Board.getPossibleMoves(board, playerX, 1 as any)
console.log(`Found ${movesForDie1.length} moves for die 1`)

if (movesForDie5.length === 0 && movesForDie1.length === 0) {
  console.log('\n❌ BUG REPRODUCED: No moves found for either die!')
  console.log('Expected: Player X should have bear-off moves available')
} else {
  console.log("\n✅ Moves found - let's see what they are:")
  console.log(`Die 5 moves: ${movesForDie5.length}`)
  console.log(`Die 1 moves: ${movesForDie1.length}`)
}
