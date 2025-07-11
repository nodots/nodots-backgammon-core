import { Board, Player } from './src/index'

console.log('=== TESTING BEAR-OFF BUG DIRECTLY ===')

// Create the exact scenario from the handoff notes:
// Player O (GNU Bot) in bear-off position with dice [1,1]
// Both players have pieces on points 1,2,3,4,5,6 from their perspective

const boardImport = [
  // GNU Bot (O symbol, counterclockwise) pieces on positions 1,2,3,4,5,6
  {
    position: { clockwise: 24, counterclockwise: 1 },
    checkers: { qty: 2, color: 'black' },
  },
  {
    position: { clockwise: 23, counterclockwise: 2 },
    checkers: { qty: 3, color: 'black' },
  },
  {
    position: { clockwise: 22, counterclockwise: 3 },
    checkers: { qty: 3, color: 'black' },
  },
  {
    position: { clockwise: 21, counterclockwise: 4 },
    checkers: { qty: 3, color: 'black' },
  },
  {
    position: { clockwise: 20, counterclockwise: 5 },
    checkers: { qty: 2, color: 'black' },
  },
  {
    position: { clockwise: 19, counterclockwise: 6 },
    checkers: { qty: 2, color: 'black' },
  },

  // Nodots Bot (X symbol, clockwise) pieces on positions 1,2,3,4,5,6
  {
    position: { clockwise: 1, counterclockwise: 24 },
    checkers: { qty: 2, color: 'white' },
  },
  {
    position: { clockwise: 2, counterclockwise: 23 },
    checkers: { qty: 3, color: 'white' },
  },
  {
    position: { clockwise: 3, counterclockwise: 22 },
    checkers: { qty: 3, color: 'white' },
  },
  {
    position: { clockwise: 4, counterclockwise: 21 },
    checkers: { qty: 3, color: 'white' },
  },
  {
    position: { clockwise: 5, counterclockwise: 20 },
    checkers: { qty: 2, color: 'white' },
  },
  {
    position: { clockwise: 6, counterclockwise: 19 },
    checkers: { qty: 2, color: 'white' },
  },
] as any

const board = Board.initialize(boardImport)

// Create GNU Bot player (O symbol, counterclockwise, black)
const gnuBot = Player.initialize(
  'black',
  'counterclockwise',
  undefined,
  'gnu-bot',
  'moving',
  true,
  'gnu-user'
) as any

// Create Nodots Bot player (X symbol, clockwise, white)
const nodotsBot = Player.initialize(
  'white',
  'clockwise',
  undefined,
  'nodots-bot',
  'inactive',
  true,
  'nodots-user'
) as any

console.log('\n=== BOARD SETUP ===')
console.log(
  'GNU Bot (O, black, counterclockwise) pieces on counterclockwise positions 1,2,3,4,5,6'
)
console.log(
  'Nodots Bot (X, white, clockwise) pieces on clockwise positions 1,2,3,4,5,6'
)
console.log('\nBoard ASCII:')
console.log(Board.getAsciiBoard(board))

console.log('\n=== TESTING BEAR-OFF MOVES FOR GNU BOT ===')
console.log('Player: GNU Bot (black, counterclockwise)')
console.log('Testing dice value: 1 (from [1,1] roll)')

// Test Board.getPossibleMoves directly for die value 1
const possibleMoves = Board.getPossibleMoves(board, gnuBot, 1)

console.log(`\nFound ${possibleMoves.length} possible moves for die 1:`)
possibleMoves.forEach((move: any, i: number) => {
  const originPos =
    move.origin.kind === 'point'
      ? `point-${move.origin.position.counterclockwise}`
      : move.origin.kind
  const destPos =
    move.destination.kind === 'point'
      ? `point-${move.destination.position.counterclockwise}`
      : move.destination.kind
  console.log(`  Move ${i}: ${originPos} → ${destPos}`)
})

if (possibleMoves.length === 0) {
  console.log('\n❌ BUG REPRODUCED: No bear-off moves found!')
  console.log('Expected: Should find bear-off move from position 1 with die 1')
} else {
  const bearOffMoves = possibleMoves.filter(
    (m: any) => m.destination.kind === 'off'
  )
  console.log(`\n✅ Found ${bearOffMoves.length} bear-off moves`)
  if (bearOffMoves.length === 0) {
    console.log('❌ BUG: No bear-off moves, only regular moves found')
  }
}

console.log('\n=== TESTING WITH ALL DICE VALUES ===')
for (let die = 1; die <= 6; die++) {
  const moves = Board.getPossibleMoves(board, gnuBot, die as any)
  const bearOffCount = moves.filter(
    (m: any) => m.destination.kind === 'off'
  ).length
  console.log(
    `Die ${die}: ${moves.length} total moves, ${bearOffCount} bear-off moves`
  )
}
