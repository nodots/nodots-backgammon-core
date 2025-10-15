// Lightweight launcher to run the multiple-games simulator without npm
// Usage: from packages/core, run: node scripts/run-simulate-multiple.js [numGames]
try {
  require('ts-node/register')
} catch (e) {
  console.error('Failed to load ts-node/register. Ensure dev deps are installed in packages/core.')
  throw e
}

const numGames = process.argv[2] ? parseInt(process.argv[2], 10) : undefined
require('../src/scripts/simulateMultipleGames.ts')
  .runMultipleGameSimulations(numGames)
  .catch((err) => {
    console.error('Multiple games simulation failed:', err && err.message ? err.message : err)
    process.exit(1)
  })

