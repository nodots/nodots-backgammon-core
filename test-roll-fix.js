const { Game, Player } = require('./dist/index.js')

// Test the roll functionality
function testRollFix() {
  console.log('Testing Game.roll() fix...\n')

  // Create a game in rolling state
  const players = [
    Player.initialize(
      'black',
      'clockwise',
      undefined,
      'player1',
      'rolling',
      true
    ),
    Player.initialize(
      'white',
      'counterclockwise',
      undefined,
      'player2',
      'inactive',
      true
    ),
  ]

  const game = Game.initialize(
    players,
    'test-game',
    'rolling',
    undefined, // board
    undefined, // cube
    undefined, // activePlay
    'black', // activeColor
    players[0], // activePlayer
    players[1] // inactivePlayer
  )

  console.log('Before roll:')
  console.log('Game state:', game.stateKind)
  console.log('Active player state:', game.activePlayer.stateKind)
  console.log('Active player dice state:', game.activePlayer.dice.stateKind)
  console.log('Active player dice values:', game.activePlayer.dice.currentRoll)
  console.log(
    'Players array - active player state:',
    game.players.find((p) => p.id === game.activePlayer.id)?.stateKind
  )
  console.log(
    'Players array - active player dice state:',
    game.players.find((p) => p.id === game.activePlayer.id)?.dice.stateKind
  )
  console.log(
    'Players array - active player dice values:',
    game.players.find((p) => p.id === game.activePlayer.id)?.dice.currentRoll
  )

  // Roll the dice
  const rolledGame = Game.roll(game)

  console.log('\nAfter roll:')
  console.log('Game state:', rolledGame.stateKind)
  console.log('Active player state:', rolledGame.activePlayer.stateKind)
  console.log(
    'Active player dice state:',
    rolledGame.activePlayer.dice.stateKind
  )
  console.log(
    'Active player dice values:',
    rolledGame.activePlayer.dice.currentRoll
  )
  console.log(
    'Players array - active player state:',
    rolledGame.players.find((p) => p.id === rolledGame.activePlayer.id)
      ?.stateKind
  )
  console.log(
    'Players array - active player dice state:',
    rolledGame.players.find((p) => p.id === rolledGame.activePlayer.id)?.dice
      .stateKind
  )
  console.log(
    'Players array - active player dice values:',
    rolledGame.players.find((p) => p.id === rolledGame.activePlayer.id)?.dice
      .currentRoll
  )

  // Check if the fix is working
  const activePlayerInArray = rolledGame.players.find(
    (p) => p.id === rolledGame.activePlayer.id
  )
  const isFixed =
    activePlayerInArray &&
    activePlayerInArray.stateKind === 'rolled' &&
    activePlayerInArray.dice.stateKind === 'rolled' &&
    activePlayerInArray.dice.currentRoll

  console.log('\nFix verification:')
  console.log('✅ Players array updated correctly:', isFixed ? 'YES' : 'NO')

  if (isFixed) {
    console.log(
      '✅ Player stateKind is "rolled":',
      activePlayerInArray.stateKind === 'rolled'
    )
    console.log(
      '✅ Dice stateKind is "rolled":',
      activePlayerInArray.dice.stateKind === 'rolled'
    )
    console.log(
      '✅ Dice has currentRoll values:',
      !!activePlayerInArray.dice.currentRoll
    )
    console.log(
      '✅ Dice values are valid:',
      activePlayerInArray.dice.currentRoll &&
        activePlayerInArray.dice.currentRoll.length === 2 &&
        activePlayerInArray.dice.currentRoll.every((v) => v >= 1 && v <= 6)
    )
  }

  return isFixed
}

// Run the test
const success = testRollFix()
process.exit(success ? 0 : 1)
