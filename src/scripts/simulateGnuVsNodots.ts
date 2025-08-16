import { BackgammonGameRollingForStart } from '@nodots-llc/backgammon-types/dist'
import * as fs from 'fs'
import * as path from 'path'
import { Board, Game, Player } from '..'
// Robot moved to @nodots-llc/backgammon-robots package

// GNU vs Nodots AI Configuration
const AI_CONFIGS = {
  GNU: {
    difficulty: 'advanced' as const,
    aiPlugin: 'basic-ai', // Could be extended to 'gnu-ai' when available
    name: 'GNU Bot',
    description: 'GNU AI',
  },
  NODOTS: {
    difficulty: 'intermediate' as const,
    aiPlugin: 'basic-ai',
    name: 'Nodots Bot',
    description: 'Nodots Heuristic AI',
  },
}

interface GnuVsNodotsResult {
  winner: 'GNU' | 'NODOTS' | null
  turnCount: number
  gameId: string
  gnuMoves: number
  nodotsMoves: number
  stuck?: boolean
  infiniteLoop?: boolean
  repeatedGnuPositionId?: string
}

function checkWinCondition(board: any): 'GNU' | 'NODOTS' | null {
  // Defensive checks for board and board.off
  if (!board) {
    console.warn('checkWinCondition: board is undefined')
    return null
  }

  if (!board.off) {
    console.warn('checkWinCondition: board.off is undefined')
    return null
  }

  if (!board.off.clockwise || !board.off.counterclockwise) {
    console.warn(
      'checkWinCondition: board.off.clockwise or board.off.counterclockwise is undefined'
    )
    return null
  }

  let whiteCheckersOff = 0
  let blackCheckersOff = 0

  try {
    // CRITICAL FIX: Each player only uses their own direction's off area
    // White (GNU) plays clockwise -> only check board.off.clockwise
    if (board.off.clockwise?.checkers) {
      whiteCheckersOff = board.off.clockwise.checkers.filter(
        (c: any) => c.color === 'white'
      ).length
    }

    // Black (NODOTS) plays counterclockwise -> only check board.off.counterclockwise
    if (board.off.counterclockwise?.checkers) {
      blackCheckersOff = board.off.counterclockwise.checkers.filter(
        (c: any) => c.color === 'black'
      ).length
    }

    console.log('[DEBUG] Win condition check:', {
      whiteCheckersOff,
      blackCheckersOff,
      whiteWins: whiteCheckersOff === 15,
      blackWins: blackCheckersOff === 15,
    })
  } catch (error) {
    console.error('checkWinCondition: Error counting checkers off:', error)
    return null
  }

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
  roll: number[],
  playerModels: { [playerId: string]: string }
): string {
  let output = `\n=== Turn ${turnNumber} ===\n`

  // Use standardized player identification format
  const activePlayer = game.activePlayer
  const symbol = activePlayer?.color === 'black' ? 'X' : 'O'
  const model =
    playerModels[activePlayer?.id] || AI_CONFIGS[activeBot].description
  const direction = activePlayer?.direction || 'unknown'

  output += `Active: ${symbol} | ${model} | ${direction} >\n`
  output += `Roll: [${roll.join(', ')}]\n`
  output += `Game State: ${game.stateKind}\n\n`

  const asciiBoard = Board.getAsciiBoard(
    game.board,
    game.players,
    game.activePlayer,
    undefined,
    playerModels
  )
  output += asciiBoard
  output += '\n' + '='.repeat(80) + '\n'

  return output
}

function dumpGameState(game: any, turnNumber: number, reason: string): string {
  let dump = `\n${'='.repeat(100)}\n`
  dump += `SIMULATION STOPPED - ${reason}\n`
  dump += `Turn: ${turnNumber}\n`
  dump += `Timestamp: ${new Date().toISOString()}\n`
  dump += `Game ID: ${game.id}\n`
  dump += `Game State: ${game.stateKind}\n`
  dump += `Active Player: ${game.activePlayer?.id} (${game.activePlayer?.color})\n`
  dump += `GNU Position ID: ${game.board?.gnuPositionId}\n`
  dump += `${'='.repeat(100)}\n`

  return dump
}

// Robot simulation functionality moved to @nodots-llc/backgammon-robots package
export async function simulateGnuVsNodots(
  verbose: boolean = false
): Promise<GnuVsNodotsResult> {
  throw new Error('Robot simulation functionality moved to @nodots-llc/backgammon-robots package')
}

export async function simulateGnuVsNodots_DISABLED(
  verbose: boolean = false
): Promise<GnuVsNodotsResult> {
  throw new Error('Robot simulation functionality moved to @nodots-llc/backgammon-robots package')
  /*
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

  // Create player models mapping for standardized display
  const playerModels = {
    [gnuPlayer.id]: AI_CONFIGS.GNU.description,
    [nodotsPlayer.id]: AI_CONFIGS.NODOTS.description,
  }

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turnCount = 0
  let gnuMoves = 0
  let nodotsMoves = 0
  const gameId = game.id

  // GNU Position ID tracking for infinite loop detection
  let gnuPositionIdHistory: string[] = []
  let infiniteLoopDetected = false

  console.log(`Game ID: ${gameId}`)
  console.log(`O | ${AI_CONFIGS.GNU.description} | clockwise >`)
  console.log(`X | ${AI_CONFIGS.NODOTS.description} | counterclockwise >`)

  // Log initial board
  logContent += '=== GAME START ===\n'
  const initialAsciiBoard = Board.getAsciiBoard(
    game.board,
    players,
    undefined,
    undefined,
    playerModels
  )
  logContent += initialAsciiBoard + '\n'
  logContent += '='.repeat(80) + '\n\n'

  const maxTurns = 100 // Prevent infinite loops
  let winner: 'GNU' | 'NODOTS' | null = null

  // Roll for start to determine first player
  let currentGame = Game.rollForStart(game) as any

  while (!winner && turnCount < maxTurns && !infiniteLoopDetected) {
    turnCount++
    const activeBot = getBotTypeFromColor(currentGame.activeColor)
    const botConfig = AI_CONFIGS[activeBot]

    // CRITICAL: Check for infinite loop by comparing GNU Position IDs
    const currentGnuPositionId = currentGame.board?.gnuPositionId
    if (currentGnuPositionId) {
      gnuPositionIdHistory.push(currentGnuPositionId)

      // Check if we have 3 consecutive identical position IDs
      if (gnuPositionIdHistory.length >= 3) {
        const lastThree = gnuPositionIdHistory.slice(-3)
        if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
          infiniteLoopDetected = true
          const reason = `Infinite loop detected - Same GNU Position ID in three consecutive turns: ${currentGnuPositionId}`

          console.log(`\n🚨 ${reason}`)
          console.log(`🚨 Stopping simulation at turn ${turnCount}`)

          // Dump current game state
          const stateDump = dumpGameState(currentGame, turnCount, reason)
          console.log(stateDump)
          logContent += stateDump

          // Log final board state
          logContent += '\n=== FINAL BOARD STATE (INFINITE LOOP) ===\n'
          const finalAsciiBoard = Board.getAsciiBoard(
            currentGame.board,
            currentGame.players,
            currentGame.activePlayer,
            undefined,
            playerModels
          )
          logContent += finalAsciiBoard + '\n'
          logContent += '='.repeat(80) + '\n\n'

          break
        }
      }
    }

    if (verbose) {
      console.log(`\n=== Turn ${turnCount} ===`)
      console.log(`Active: ${activeBot} Bot (${botConfig.description})`)
      console.log(`GNU Position ID: ${currentGnuPositionId}`)
    }

    try {
      // CRITICAL FIX: Handle the robot's turn by calling makeOptimalMove repeatedly until turn is complete
      let turnCompleted = false
      let moveCount = 0
      const maxMovesPerTurn = 10 // Safety limit to prevent infinite loops

      while (!turnCompleted && moveCount < maxMovesPerTurn) {
        // Robot functionality moved to @nodots-llc/backgammon-robots package
        throw new Error('Robot functionality moved to @nodots-llc/backgammon-robots package')

        if (!robotResult.success) {
          // Check if this is a legitimate turn completion (no legal moves)
          if (
            robotResult.error?.includes('no legal moves') ||
            robotResult.error?.includes('passed turn')
          ) {
            console.log(
              `✅ ${activeBot} Bot completed turn (no moves available)`
            )
            turnCompleted = true
          } else if (robotResult.error?.includes('stale move reference')) {
            // Handle stale move reference error by forcing turn completion
            console.log(
              `⚠️ ${activeBot} Bot encountered stale move reference, forcing turn completion`
            )
            if (currentGame.stateKind === 'moving') {
              currentGame = Game.checkAndCompleteTurn(currentGame as any)
            }
            turnCompleted = true
          } else {
            console.log(`❌ ${activeBot} Bot failed: ${robotResult.error}`)
            break
          }
        } else {
          // Move executed successfully
          currentGame = robotResult.game
          moveCount++

          // Update move counts
          if (activeBot === 'GNU') {
            gnuMoves++
          } else {
            nodotsMoves++
          }

          if (verbose) {
            console.log(`✅ ${activeBot} Bot: ${robotResult.message}`)
          }

          // CRITICAL FIX: Check if the active player has changed (turn transition)
          const newActiveBot = getBotTypeFromColor(currentGame.activeColor)
          if (newActiveBot !== activeBot) {
            // Turn has been completed and passed to the next player
            console.log(
              `✅ ${activeBot} Bot completed turn, ${newActiveBot} Bot is now active`
            )
            turnCompleted = true
          }

          // CRITICAL FIX: Check if all dice are used up (no ready moves remaining)
          if (currentGame.activePlay && currentGame.activePlay.moves) {
            const movesArray = Array.from(currentGame.activePlay.moves)
            const readyMoves = movesArray.filter(
              (m: any) => m.stateKind === 'ready'
            )

            if (readyMoves.length === 0) {
              console.log(`✅ ${activeBot} Bot completed turn (all dice used)`)
              // Force turn transition by calling Game.checkAndCompleteTurn
              if (currentGame.stateKind === 'moving') {
                currentGame = Game.checkAndCompleteTurn(currentGame as any)
              }
              turnCompleted = true
            }
          }

          // CRITICAL FIX: Check for win condition after each move
          const currentWinner = checkWinCondition(currentGame.board)
          if (currentWinner) {
            winner = currentWinner
            turnCompleted = true
            break
          }
        }
      }

      // Safety check: If we hit the move limit, force turn completion
      if (!turnCompleted && moveCount >= maxMovesPerTurn) {
        console.log(
          `⚠️ ${activeBot} Bot reached move limit (${maxMovesPerTurn}), forcing turn completion`
        )
        // Force turn transition
        if (currentGame.stateKind === 'moving') {
          currentGame = Game.checkAndCompleteTurn(currentGame as any)
        }
        turnCompleted = true
      }

      // CRITICAL FIX: Get dice roll safely for logging
      let roll = [0, 0] // Default fallback
      if (currentGame.activePlayer?.dice?.currentRoll) {
        roll = currentGame.activePlayer.dice.currentRoll
      } else if (currentGame.inactivePlayer?.dice?.currentRoll) {
        // Use previous player's roll for logging if current player doesn't have dice
        roll = currentGame.inactivePlayer.dice.currentRoll
      }

      // Log board state
      logContent += getGnuBoardDisplay(
        currentGame,
        turnCount,
        activeBot,
        roll,
        playerModels
      )

      // GNU Position ID tracking is now handled at the beginning of each turn

      // CRITICAL FIX: Check for win condition after turn completion
      winner = checkWinCondition(currentGame.board)
      if (winner) {
        const winnerConfig =
          winner === 'GNU' ? AI_CONFIGS.GNU : AI_CONFIGS.NODOTS
        const winnerSymbol = winner === 'GNU' ? 'O' : 'X'
        const winnerDirection =
          winner === 'GNU' ? 'clockwise' : 'counterclockwise'

        console.log(
          `\n🎉 ${winnerSymbol} | ${winnerConfig.description} | ${winnerDirection} > wins after ${turnCount} turns!`
        )
        logContent += `\n🎉 GAME OVER: ${winnerSymbol} | ${winnerConfig.description} | ${winnerDirection} > wins!\n`
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

      // CRITICAL FIX: Enhanced deadlock detection
      if (turnCount > 150) {
        console.log(
          `⚠️ Game may be stuck after ${turnCount} turns - checking for deadlock`
        )

        // Force end the game to prevent infinite timeout
        console.log(`⚠️ Forcing game end due to excessive turns`)
        break
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
    infiniteLoop: infiniteLoopDetected,
    repeatedGnuPositionId: infiniteLoopDetected
      ? gnuPositionIdHistory[gnuPositionIdHistory.length - 1] || undefined
      : undefined,
  }

  // Print results using standardized format
  console.log('\n📊 Simulation Results:')
  if (result.winner) {
    const winnerConfig =
      result.winner === 'GNU' ? AI_CONFIGS.GNU : AI_CONFIGS.NODOTS
    const winnerSymbol = result.winner === 'GNU' ? 'O' : 'X'
    const winnerDirection =
      result.winner === 'GNU' ? 'clockwise' : 'counterclockwise'
    console.log(
      `Winner: ${winnerSymbol} | ${winnerConfig.description} | ${winnerDirection} >`
    )
  } else {
    console.log(`Winner: None (stuck/timeout)`)
  }
  console.log(`Total turns: ${result.turnCount}`)
  console.log(
    `O | ${AI_CONFIGS.GNU.description} | clockwise > moves: ${result.gnuMoves}`
  )
  console.log(
    `X | ${AI_CONFIGS.NODOTS.description} | counterclockwise > moves: ${result.nodotsMoves}`
  )
  if (result.stuck) {
    console.log('⚠️  Game reached turn limit (possible stuck state)')
  }
  if (result.infiniteLoop) {
    console.log(
      `🚨 Infinite loop detected with GNU Position ID: ${result.repeatedGnuPositionId}`
    )
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
      if (result.winner) {
        const winnerConfig =
          result.winner === 'GNU' ? AI_CONFIGS.GNU : AI_CONFIGS.NODOTS
        const winnerSymbol = result.winner === 'GNU' ? 'O' : 'X'
        const winnerDirection =
          result.winner === 'GNU' ? 'clockwise' : 'counterclockwise'
        console.log(
          `Winner: ${winnerSymbol} | ${winnerConfig.description} | ${winnerDirection} >`
        )
      } else {
        console.log(`Winner: Draw/Timeout`)
      }
      console.log(`O vs X: ${result.gnuMoves} vs ${result.nodotsMoves} moves`)

      process.exit(result.winner ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Simulation failed:', error)
      process.exit(1)
    })
}
  */
}

export { AI_CONFIGS }
