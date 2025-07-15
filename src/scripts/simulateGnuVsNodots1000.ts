import * as fs from 'fs'
import * as path from 'path'
import { AI_CONFIGS, simulateGnuVsNodots } from './simulateGnuVsNodots'

interface BatchSimulationResult {
  totalGames: number
  completedGames: number
  gnuWins: number
  nodotsWins: number
  timeouts: number
  infiniteLoops: number
  totalTurns: number
  totalGnuMoves: number
  totalNodotsMoves: number
  averageTurnsPerGame: number
  averageGnuMovesPerGame: number
  averageNodotsMovesPerGame: number
  duration: number
  averageTimePerGame: number
  logDirectory: string
}

export async function runGnuVsNodotsBatch(
  numGames: number = 1000,
  verbose: boolean = false
): Promise<BatchSimulationResult> {
  console.log(`🤖 Starting GNU vs Nodots Batch Simulation (${numGames} games)`)
  console.log(`GNU Bot: ${AI_CONFIGS.GNU.description}`)
  console.log(`Nodots Bot: ${AI_CONFIGS.NODOTS.description}`)
  console.log(`${'='.repeat(80)}`)

  // Create batch-specific log directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logDir = path.join(process.cwd(), 'game-logs', `batch-${timestamp}`)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const results: BatchSimulationResult = {
    totalGames: numGames,
    completedGames: 0,
    gnuWins: 0,
    nodotsWins: 0,
    timeouts: 0,
    infiniteLoops: 0,
    totalTurns: 0,
    totalGnuMoves: 0,
    totalNodotsMoves: 0,
    averageTurnsPerGame: 0,
    averageGnuMovesPerGame: 0,
    averageNodotsMovesPerGame: 0,
    duration: 0,
    averageTimePerGame: 0,
    logDirectory: logDir,
  }

  // Create batch summary file
  const batchSummaryFile = path.join(logDir, 'batch-summary.txt')
  let batchSummary = `GNU vs NODOTS BATCH SIMULATION\n`
  batchSummary += `===============================\n`
  batchSummary += `Started: ${new Date().toISOString()}\n`
  batchSummary += `Total Games: ${numGames}\n`
  batchSummary += `GNU Bot: ${AI_CONFIGS.GNU.description}\n`
  batchSummary += `Nodots Bot: ${AI_CONFIGS.NODOTS.description}\n`
  batchSummary += `Log Directory: ${logDir}\n\n`

  const startTime = Date.now()
  const gameResults: Array<{
    gameNumber: number
    winner: string
    turns: number
    gnuMoves: number
    nodotsMoves: number
    duration: number
    status: string
  }> = []

  for (let i = 0; i < numGames; i++) {
    const gameStartTime = Date.now()
    const gameNumber = i + 1

    console.log(`\n🎮 Game ${gameNumber}/${numGames}`)

    try {
      const result = await simulateGnuVsNodots(verbose)
      const gameEndTime = Date.now()
      const gameDuration = (gameEndTime - gameStartTime) / 1000

      results.completedGames++
      results.totalTurns += result.turnCount
      results.totalGnuMoves += result.gnuMoves
      results.totalNodotsMoves += result.nodotsMoves

      let status = 'completed'
      if (result.winner === 'GNU') {
        results.gnuWins++
      } else if (result.winner === 'NODOTS') {
        results.nodotsWins++
      } else {
        results.timeouts++
        status = 'timeout'
      }

      if (result.infiniteLoop) {
        results.infiniteLoops++
        status = 'infinite-loop'
      }

      const gameResult = {
        gameNumber,
        winner: result.winner || 'timeout',
        turns: result.turnCount,
        gnuMoves: result.gnuMoves,
        nodotsMoves: result.nodotsMoves,
        duration: gameDuration,
        status,
      }
      gameResults.push(gameResult)

      // Log game result
      const winnerSymbol =
        result.winner === 'GNU' ? 'O' : result.winner === 'NODOTS' ? 'X' : '-'
      const winnerDirection =
        result.winner === 'GNU'
          ? 'clockwise'
          : result.winner === 'NODOTS'
          ? 'counterclockwise'
          : 'none'

      console.log(
        `✅ Game ${gameNumber}: ${winnerSymbol} | ${
          result.winner || 'timeout'
        } | ${winnerDirection} > wins`
      )
      console.log(
        `   Turns: ${result.turnCount}, GNU moves: ${result.gnuMoves}, Nodots moves: ${result.nodotsMoves}`
      )
      console.log(`   Duration: ${gameDuration.toFixed(2)}s`)

      if (result.infiniteLoop) {
        console.log(
          `   🚨 Infinite loop detected: ${result.repeatedGnuPositionId}`
        )
      }

      // Add to batch summary
      batchSummary += `Game ${gameNumber}: ${winnerSymbol} | ${
        result.winner || 'timeout'
      } | ${winnerDirection} > (${result.turnCount} turns, ${result.gnuMoves}/${
        result.nodotsMoves
      } moves, ${gameDuration.toFixed(2)}s)\n`
    } catch (error) {
      console.error(`❌ Game ${gameNumber} failed: ${error}`)
      batchSummary += `Game ${gameNumber}: ERROR - ${error}\n`
    }

    // Update progress
    const progress = (gameNumber / numGames) * 100
    const elapsed = (Date.now() - startTime) / 1000
    const estimatedTotal = (elapsed / gameNumber) * numGames
    const remaining = estimatedTotal - elapsed

    console.log(
      `📊 Progress: ${progress.toFixed(1)}% | Elapsed: ${elapsed.toFixed(
        0
      )}s | ETA: ${remaining.toFixed(0)}s`
    )
  }

  const endTime = Date.now()
  results.duration = (endTime - startTime) / 1000

  // Calculate averages
  if (results.completedGames > 0) {
    results.averageTurnsPerGame = results.totalTurns / results.completedGames
    results.averageGnuMovesPerGame =
      results.totalGnuMoves / results.completedGames
    results.averageNodotsMovesPerGame =
      results.totalNodotsMoves / results.completedGames
    results.averageTimePerGame = results.duration / results.completedGames
  }

  // Complete batch summary
  batchSummary += `\nBATCH RESULTS\n`
  batchSummary += `=============\n`
  batchSummary += `Completed: ${new Date().toISOString()}\n`
  batchSummary += `Total Games: ${results.totalGames}\n`
  batchSummary += `Completed Games: ${results.completedGames}\n`
  batchSummary += `GNU Wins: ${results.gnuWins} (${(
    (results.gnuWins / results.completedGames) *
    100
  ).toFixed(1)}%)\n`
  batchSummary += `Nodots Wins: ${results.nodotsWins} (${(
    (results.nodotsWins / results.completedGames) *
    100
  ).toFixed(1)}%)\n`
  batchSummary += `Timeouts: ${results.timeouts} (${(
    (results.timeouts / results.completedGames) *
    100
  ).toFixed(1)}%)\n`
  batchSummary += `Infinite Loops: ${results.infiniteLoops} (${(
    (results.infiniteLoops / results.completedGames) *
    100
  ).toFixed(1)}%)\n`
  batchSummary += `Average Turns per Game: ${results.averageTurnsPerGame.toFixed(
    1
  )}\n`
  batchSummary += `Average GNU Moves per Game: ${results.averageGnuMovesPerGame.toFixed(
    1
  )}\n`
  batchSummary += `Average Nodots Moves per Game: ${results.averageNodotsMovesPerGame.toFixed(
    1
  )}\n`
  batchSummary += `Total Duration: ${results.duration.toFixed(1)} seconds\n`
  batchSummary += `Average Time per Game: ${results.averageTimePerGame.toFixed(
    2
  )} seconds\n`

  // Write batch summary to file
  fs.writeFileSync(batchSummaryFile, batchSummary)

  // Create detailed CSV report
  const csvFile = path.join(logDir, 'game-results.csv')
  let csvContent =
    'Game,Winner,Turns,GNU_Moves,Nodots_Moves,Duration_Seconds,Status\n'
  gameResults.forEach((game) => {
    csvContent += `${game.gameNumber},${game.winner},${game.turns},${
      game.gnuMoves
    },${game.nodotsMoves},${game.duration.toFixed(2)},${game.status}\n`
  })
  fs.writeFileSync(csvFile, csvContent)

  // Print final statistics
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🎯 BATCH SIMULATION COMPLETE`)
  console.log(`${'='.repeat(80)}`)
  console.log(`Total Games: ${results.totalGames}`)
  console.log(`Completed Games: ${results.completedGames}`)
  console.log(
    `O | ${AI_CONFIGS.GNU.description} | clockwise > wins: ${
      results.gnuWins
    } (${((results.gnuWins / results.completedGames) * 100).toFixed(1)}%)`
  )
  console.log(
    `X | ${AI_CONFIGS.NODOTS.description} | counterclockwise > wins: ${
      results.nodotsWins
    } (${((results.nodotsWins / results.completedGames) * 100).toFixed(1)}%)`
  )
  console.log(
    `Timeouts: ${results.timeouts} (${(
      (results.timeouts / results.completedGames) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `Infinite Loops: ${results.infiniteLoops} (${(
      (results.infiniteLoops / results.completedGames) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `Average Turns per Game: ${results.averageTurnsPerGame.toFixed(1)}`
  )
  console.log(
    `Average GNU Moves per Game: ${results.averageGnuMovesPerGame.toFixed(1)}`
  )
  console.log(
    `Average Nodots Moves per Game: ${results.averageNodotsMovesPerGame.toFixed(
      1
    )}`
  )
  console.log(`Total Duration: ${results.duration.toFixed(1)} seconds`)
  console.log(
    `Average Time per Game: ${results.averageTimePerGame.toFixed(2)} seconds`
  )
  console.log(`📁 Logs saved to: ${logDir}`)
  console.log(`📊 Summary: ${batchSummaryFile}`)
  console.log(`📈 CSV Report: ${csvFile}`)

  return results
}

// Allow running from command line
if (require.main === module) {
  const numGames = process.argv[2] ? parseInt(process.argv[2]) : 1000
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v')

  runGnuVsNodotsBatch(numGames, verbose)
    .then((results) => {
      console.log('\n✅ Batch simulation completed successfully!')

      // Exit with appropriate code
      const successRate = results.completedGames / results.totalGames
      process.exit(successRate > 0.95 ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Batch simulation failed:', error)
      process.exit(1)
    })
}
