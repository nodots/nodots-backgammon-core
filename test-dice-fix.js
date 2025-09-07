const { Game } = require('./dist/Game')

console.log('Testing dice initialization fix...')

// Create a new game
const game = Game.createNewGame('user1', 'user2', true, true)

console.log('Game state:', game.stateKind)
console.log('Player 1 dice state:', game.players[0].dice.stateKind)
console.log('Player 2 dice state:', game.players[1].dice.stateKind)

// The fix should make both players have 'rolling-for-start' dice state
const success = game.players[0].dice.stateKind === 'rolling-for-start' && 
                game.players[1].dice.stateKind === 'rolling-for-start'

console.log('Fix successful:', success)

if (success) {
  console.log('✅ DICE INITIALIZATION BUG FIXED!')
} else {
  console.log('❌ Bug still exists')
}