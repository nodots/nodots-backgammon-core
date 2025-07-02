const { Board, Dice, Player, Play } = require('./dist/index.js')

// Create the test board from the failing test
const boardImport = [
  {
    position: { clockwise: 19, counterclockwise: 6 },
    checkers: { qty: 2, color: 'white' },
  },
  {
    position: { clockwise: 20, counterclockwise: 5 },
    checkers: { qty: 1, color: 'white' },
  },
]

const board = Board.initialize(boardImport)
console.log('Board created')

// Create a player with dice roll [1, 2]
const inactiveDice = Dice.initialize('white')
const player = Player.initialize(
  'white',
  'clockwise',
  inactiveDice,
  undefined,
  'rolling'
)
const rolledPlayer = Player.roll(player)
rolledPlayer.dice.currentRoll = [1, 2]

console.log('Player created with dice roll:', rolledPlayer.dice.currentRoll)

// Initialize play
const play = Play.initialize(board, rolledPlayer)

console.log('Play initialized')
console.log('Number of moves:', play.moves.size)

// Log all moves
Array.from(play.moves).forEach((move, index) => {
  console.log(`Move ${index + 1}:`, {
    moveKind: move.moveKind,
    dieValue: move.dieValue,
    origin: move.origin?.position,
    possibleMovesCount: move.possibleMoves?.length || 0,
  })
})

// Check if any moves are bear-off
const hasBearOffMove = Array.from(play.moves).some(
  (move) => move.moveKind === 'bear-off'
)
console.log('Has bear-off move:', hasBearOffMove)
