const { Game } = require('./dist/Game')
const { exportToGnuPositionId } = require('./dist/Board/gnuPositionId')

console.log('=== Testing GNU Position ID Generation ===\n')

// Test 1: Create game with GNU standard configuration (white=clockwise, black=counterclockwise)
console.log(
  'Test 1: GNU Standard Configuration (white=clockwise, black=counterclockwise)'
)
const standardGame = Game.createNewGame(
  'player1',
  'player2',
  false,
  true,
  true,
  {
    blackDirection: 'counterclockwise',
    whiteDirection: 'clockwise',
    blackFirst: false,
  }
)

console.log('Players:')
standardGame.players.forEach((p) => {
  console.log(`  ${p.color}: ${p.direction}`)
})

const standardPositionId = exportToGnuPositionId(standardGame)
console.log(`GNU Position ID: ${standardPositionId}`)
console.log(`Expected: 4HPwATDgc/ABMA`)
console.log(`Match: ${standardPositionId === '4HPwATDgc/ABMA'}\n`)

// Test 2: Create game with reversed configuration (black=clockwise, white=counterclockwise)
console.log(
  'Test 2: Reversed Configuration (black=clockwise, white=counterclockwise)'
)
const reversedGame = Game.createNewGame(
  'player1',
  'player2',
  false,
  true,
  true,
  {
    blackDirection: 'clockwise',
    whiteDirection: 'counterclockwise',
    blackFirst: true,
  }
)

console.log('Players:')
reversedGame.players.forEach((p) => {
  console.log(`  ${p.color}: ${p.direction}`)
})

const reversedPositionId = exportToGnuPositionId(reversedGame)
console.log(`GNU Position ID: ${reversedPositionId}`)
console.log(`Expected (after transformation): 4HPwATDgc/ABMA`)
console.log(`Match: ${reversedPositionId === '4HPwATDgc/ABMA'}\n`)

// Test 3: Check what happens with random configuration
console.log('Test 3: Random Configuration')
const randomGame = Game.createNewGame('player1', 'player2')

console.log('Players:')
randomGame.players.forEach((p) => {
  console.log(`  ${p.color}: ${p.direction}`)
})

const randomPositionId = exportToGnuPositionId(randomGame)
console.log(`GNU Position ID: ${randomPositionId}`)
console.log(`Expected (should always be): 4HPwATDgc/ABMA`)
console.log(`Match: ${randomPositionId === '4HPwATDgc/ABMA'}\n`)

console.log('=== Board Analysis ===')

// Check the actual checker positions in the reversed game
console.log('Reversed game board positions:')
reversedGame.board.points.forEach((point) => {
  if (point.checkers.length > 0) {
    const colors = point.checkers.map((c) => c.color)
    console.log(`Point ${point.position.clockwise}: ${colors.join(', ')}`)
  }
})
