
// Test GNU Position ID transformation directly
const { Game } = require('./dist/nodots-backgammon-core/src/Game/index.js');

console.log('=== GNU Position ID Transformation Test ===');

// Test standard configuration
const standard = Game.createNewGame('p1', 'p2', false, true, true, {
  blackDirection: 'counterclockwise',
  whiteDirection: 'clockwise', 
  blackFirst: false
});

console.log('1. Standard Configuration:');
console.log('   White direction:', standard.players.find(p => p.color === 'white').direction);
console.log('   Black direction:', standard.players.find(p => p.color === 'black').direction);
console.log('   GNU Position ID:', standard.board.gnuPositionId);

// Test reversed configuration (like CLI)
const reversed = Game.createNewGame('p1', 'p2', false, true, true, {
  blackDirection: 'clockwise',
  whiteDirection: 'counterclockwise',
  blackFirst: true  
});

console.log('2. Reversed Configuration (CLI-style):');
console.log('   White direction:', reversed.players.find(p => p.color === 'white').direction);
console.log('   Black direction:', reversed.players.find(p => p.color === 'black').direction);
console.log('   GNU Position ID:', reversed.board.gnuPositionId);

console.log('3. Test Results:');
console.log('   Standard correct:', standard.board.gnuPositionId === '4HPwATDgc/ABMA');
console.log('   Reversed correct:', reversed.board.gnuPositionId === '4HPwATDgc/ABMA');
console.log('   Both should be 4HPwATDgc/ABMA for starting positions');

