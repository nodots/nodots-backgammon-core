const { simulateGame } = require('./dist/scripts/simulateGame')

async function runSingleGame() {
  console.log('Starting single robot-vs-robot game...\n')
  const result = await simulateGame(true)
  console.log('\nGame completed!')
  console.log(`Winner: ${result.winner}`)
  console.log(`Turns: ${result.turnCount}`)
  console.log(`Game ID: ${result.gameId}`)
}

runSingleGame().catch(console.error)
