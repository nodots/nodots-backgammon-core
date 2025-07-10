import { BackgammonGameRollingForStart } from '@nodots-llc/backgammon-types/dist'
import * as fs from 'fs'
import * as path from 'path'
import { Board, Game, Player, Robot } from '..'

// GNU vs Nodots AI Configuration
const AI_CONFIGS = {
  GNU: {
    difficulty: 'advanced' as const,
    aiPlugin: 'basic-ai', // Could be extended to 'gnu-ai' when available
    name: 'GNU Bot',
    description: 'GNU Backgammon-style AI (Advanced difficulty)',
  },
  NODOTS: {
    difficulty: 'intermediate' as const,
    aiPlugin: 'basic-ai',
    name: 'Nodots Bot',
    description: 'Nodots-style AI (Intermediate difficulty)',
  },
}

interface GnuVsNodotsResult {
  winner: 'GNU' | 'NODOTS' | null
  turnCount: number
  gameId: string
  gnuMoves: number
  nodotsMoves: number
  stuck?: boolean
}

function checkWinCondition(board: any): 'GNU' | 'NODOTS' | null {
  const whiteCheckersOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'white')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'white')
      .length
  const blackCheckersOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'black')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'black')
      .length

  if (whiteCheckersOff === 15) return 'GNU' // White = GNU Bot
  if (blackCheckersOff === 15) return 'NODOTS' // Black = Nodots Bot
  return null
}

function getBotTypeFromColor(color: 'white' | 'black'): 'GNU' | 'NODOTS' {
  return color === 'white' ? 'GNU' : 'NODOTS'
}

function getGnuBoardDisplay(
  game: any,
  turnNumber: number,
  activeBot: 'GNU' | 'NODOTS',
  roll: number[]
): string {
  let output = `\n=== Turn ${turnNumber} ===\n`
  output += `Active Bot: ${activeBot} (${AI_CONFIGS[activeBot].description})\n`
  output += `Roll: [${roll.join(', ')}]\n`
  output += `Game State: ${game.stateKind}\n\n`

  const asciiBoard = Board.getAsciiBoard(
    game.board,
    game.players,
    game.activePlayer
  )
  output += asciiBoard
  output += '\n' + '='.repeat(80) + '\n'

  return output
}

export async function simulateGnuVsNodots(
  verbose: boolean = false
): Promise<GnuVsNodotsResult> {
  console.log('🤖 Starting GNU vs Nodots AI Simulation...\n')

  // Create game-logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'game-logs')
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  // Create log file with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(logsDir, `gnu-vs-nodots-${timestamp}.log`)

  let logContent = 'GNU vs NODOTS AI SIMULATION LOG\n'
  logContent += '==================================\n'
  logContent += `Started: ${new Date().toISOString()}\n`
  logContent += `GNU Bot: ${AI_CONFIGS.GNU.description}\n`
  logContent += `Nodots Bot: ${AI_CONFIGS.NODOTS.description}\n\n`

  // Initialize players
  // GNU Bot = White (clockwise)
  const gnuPlayer = Player.initialize(
    'white',
    'clockwise',
    undefined,
    'GNU-Bot',
    'inactive',
    true
  )

  // Nodots Bot = Black (counterclockwise)
  const nodotsPlayer = Player.initialize(
    'black',
    'counterclockwise',
    undefined,
    'Nodots-Bot',
    'inactive',
    true
  )

  const players = [gnuPlayer, nodotsPlayer] as [
    typeof gnuPlayer,
    typeof nodotsPlayer
  ]

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turnCount = 0
  let gnuMoves = 0
  let nodotsMoves = 0
  const gameId = game.id

  console.log(`Game ID: ${gameId}`)
  console.log(`GNU Bot (White): ${AI_CONFIGS.GNU.description}`)
  console.log(`Nodots Bot (Black): ${AI_CONFIGS.NODOTS.description}`)

  // Log initial board
  logContent += '=== GAME START ===\n'
  const initialAsciiBoard = Board.getAsciiBoard(game.board, players)
  logContent += initialAsciiBoard + '\n'
  logContent += '='.repeat(80) + '\n\n'

  const maxTurns = 200 // Prevent infinite loops
  let winner: 'GNU' | 'NODOTS' | null = null

  // Roll for start to determine first player
  let currentGame = Game.rollForStart(game) as any

  while (!winner && turnCount < maxTurns) {
    turnCount++
    const activeBot = getBotTypeFromColor(currentGame.activeColor)
    const botConfig = AI_CONFIGS[activeBot]

    if (verbose) {
      console.log(`\n=== Turn ${turnCount} ===`)
      console.log(`Active: ${activeBot} Bot (${botConfig.description})`)
    }

    try {
      // Use Robot.makeOptimalMove with appropriate AI configuration
      const robotResult = await Robot.makeOptimalMove(
        currentGame,
        botConfig.difficulty,
        botConfig.aiPlugin
      )

      if (!robotResult.success) {
        console.log(`❌ ${activeBot} Bot failed: ${robotResult.error}`)
        break
      }

      if (robotResult.game) {
        currentGame = robotResult.game

        // Track moves per bot
        if (activeBot === 'GNU') {
          gnuMoves++
        } else {
          nodotsMoves++
        }

        if (verbose) {
          console.log(`✅ ${activeBot} Bot: ${robotResult.message}`)
        }

        // Get dice roll for logging
        const roll = currentGame.activePlayer?.dice?.currentRoll || [0, 0]

        // Log board state
        logContent += getGnuBoardDisplay(
          currentGame,
          turnCount,
          activeBot,
          roll
        )

        // Check for winner
        winner = checkWinCondition(currentGame.board)
        if (winner) {
          const winnerBot = winner === 'GNU' ? 'GNU Bot' : 'Nodots Bot'
          console.log(`\n🎉 ${winnerBot} wins after ${turnCount} turns!`)
          logContent += `\n🎉 GAME OVER: ${winnerBot} wins!\n`
          logContent += `Total turns: ${turnCount}\n`
          logContent += `GNU moves: ${gnuMoves}\n`
          logContent += `Nodots moves: ${nodotsMoves}\n`
          break
        }

        // Check for game completion state
        if ('winner' in currentGame && currentGame.winner) {
          winner = currentGame.winner.color === 'white' ? 'GNU' : 'NODOTS'
          break
        }
      }
    } catch (error) {
      console.log(`❌ Error on turn ${turnCount}: ${error}`)
      logContent += `\nERROR on turn ${turnCount}: ${error}\n`
      break
    }
  }

  // Write log file
  fs.writeFileSync(logFile, logContent)
  console.log(`\n📝 Game log saved to: ${logFile}`)

  const result: GnuVsNodotsResult = {
    winner,
    turnCount,
    gameId,
    gnuMoves,
    nodotsMoves,
    stuck: turnCount >= maxTurns && !winner,
  }

  // Print results
  console.log('\n📊 Simulation Results:')
  console.log(`Winner: ${result.winner || 'None (stuck/timeout)'}`)
  console.log(`Total turns: ${result.turnCount}`)
  console.log(`GNU Bot moves: ${result.gnuMoves}`)
  console.log(`Nodots Bot moves: ${result.nodotsMoves}`)
  if (result.stuck) {
    console.log('⚠️  Game reached turn limit (possible stuck state)')
  }

  return result
}

// Allow running from command line
if (require.main === module) {
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v')

  simulateGnuVsNodots(verbose)
    .then((result) => {
      console.log('\n🎯 Final Result:')
      console.log(`Winner: ${result.winner || 'Draw/Timeout'}`)
      console.log(
        `GNU vs Nodots: ${result.gnuMoves} vs ${result.nodotsMoves} moves`
      )

      process.exit(result.winner ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Simulation failed:', error)
      process.exit(1)
    })
}

export { AI_CONFIGS }
