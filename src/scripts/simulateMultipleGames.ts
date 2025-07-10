import {
  BackgammonGameMoving,
  BackgammonGameRollingForStart,
  BackgammonMove,
} from '@nodots-llc/backgammon-types/dist'
import * as fs from 'fs'
import * as path from 'path'
import { Board, Game, Player } from '..'
import { logger } from '../utils/logger'

interface GameLog {
  gameId: string
  turnNumber: number
  moveNumber: number
  activeColor: string
  roll: number[]
  origin: string
  destination: string
  asciiBoard: string
  timestamp: string
}

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

function logGameMove(
  gameId: string,
  turnNumber: number,
  moveNumber: number,
  activeColor: string,
  roll: number[],
  origin: any,
  destination: any,
  game: any,
  logDir: string
): void {
  const originStr =
    origin && origin.kind === 'point'
      ? String(origin.position.clockwise)
      : 'bar'
  const destStr =
    destination && destination.kind === 'point'
      ? String(destination.position.clockwise)
      : 'off'

  // Create GNU-style move notation (e.g., "24/18 13/11")
  const moveNotation = `${originStr}/${destStr}`

  // Create player models for standardized display
  const playerModels: { [playerId: string]: string } = {}
  if (game.players) {
    game.players.forEach((player: any) => {
      if (player.color === 'white') {
        playerModels[player.id] = 'White Player (Clockwise)'
      } else {
        playerModels[player.id] = 'Black Player (Counterclockwise)'
      }
    })
  }

  // Get enhanced ASCII board with roll information and move notation
  const asciiBoard = Board.getAsciiGameBoard(
    game.board,
    game.players,
    game.activeColor,
    game.stateKind,
    moveNotation,
    playerModels
  )

  const gameLog: GameLog = {
    gameId,
    turnNumber,
    moveNumber,
    activeColor,
    roll,
    origin: originStr,
    destination: destStr,
    asciiBoard,
    timestamp: new Date().toISOString(),
  }

  // Create game-logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // Write to game-specific log file
  const logFilePath = path.join(logDir, `${gameId}.log`)

  // Use standardized player identification format
  const symbol = activeColor === 'black' ? 'X' : 'O'
  const model = activeColor === 'white' ? 'White Player' : 'Black Player'
  const direction = activeColor === 'white' ? 'clockwise' : 'counterclockwise'

  const logEntry = `=== Turn ${turnNumber}, Move ${moveNumber} ===
Game ID: ${gameId}
Active: ${symbol} | ${model} | ${direction} >
Roll: [${roll.join(', ')}]
Move: from ${originStr} to ${destStr}
Timestamp: ${gameLog.timestamp}

${asciiBoard}

${'='.repeat(80)}

`

  fs.appendFileSync(logFilePath, logEntry)

  // Also log to console for progress tracking
  console.log(
    `Game ${gameId}: Turn ${turnNumber}, Move ${moveNumber} - ${symbol} | ${model} | ${direction} > moves from ${originStr} to ${destStr}`
  )
}

function checkWinCondition(board: any): string | null {
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

  if (whiteCheckersOff === 15) return 'white'
  if (blackCheckersOff === 15) return 'black'
  return null
}

async function runSingleGameSimulation(
  gameId: string,
  logDir: string
): Promise<{ winner: string | null; turns: number; moves: number }> {
  // Initialize players
  const whitePlayer = Player.initialize(
    'white',
    'clockwise',
    undefined,
    undefined,
    'inactive',
    true
  )
  const blackPlayer = Player.initialize(
    'black',
    'counterclockwise',
    undefined,
    undefined,
    'inactive',
    true
  )
  const players = [whitePlayer, blackPlayer] as [
    typeof whitePlayer,
    typeof blackPlayer
  ]

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turnCount = 0
  let totalMoves = 0
  let lastBoard = game.board

  // Roll for start
  let gameRolling = Game.rollForStart(game)

  // Log initial board state
  const initialAsciiBoard = Board.getAsciiGameBoard(
    gameRolling.board,
    gameRolling.players,
    gameRolling.activeColor,
    gameRolling.stateKind
  )

  const initialLogEntry = `=== GAME START ===
Game ID: ${gameId}
Initial Board State:
${initialAsciiBoard}

${'='.repeat(80)}

`

  const logFilePath = path.join(logDir, `${gameId}.log`)
  fs.writeFileSync(logFilePath, initialLogEntry)

  // If maxTurns is 0, run until there's a winner
  const maxTurns = 1000 // High limit to prevent infinite loops
  const shouldRunUntilWinner = true

  while (shouldRunUntilWinner && turnCount < maxTurns) {
    turnCount++

    // Use gameRolling directly, no need to re-initialize
    const gameRolled = Game.roll(gameRolling)
    const roll = gameRolled.activePlayer.dice.currentRoll

    // Make moves until no more valid moves are available
    let moveCount = 0
    let gameMoved: any = gameRolled

    // Only call Game.move if there is a valid move origin
    const firstMove = Array.from(gameRolled.activePlay.moves)[0]
    if (firstMove && firstMove.origin) {
      // Transition through proper state flow: rolled -> preparing-move -> moving
      const preparingGame = Game.prepareMove(gameRolled)
      const gameMoving = Game.toMoving(preparingGame)

      // Execute first move
      gameMoved = Game.move(gameMoving, firstMove.origin.id)
      moveCount++
      totalMoves++

      // Log the first move - always log it
      let destination
      if ('destination' in firstMove && firstMove.destination) {
        destination = firstMove.destination
      } else if (firstMove.origin.kind === 'point') {
        destination = {
          kind: 'point',
          position: {
            clockwise: firstMove.origin.position.clockwise + firstMove.dieValue,
          },
        }
      } else {
        // For bar moves, destination is typically a point
        destination = {
          kind: 'point',
          position: { clockwise: firstMove.dieValue },
        }
      }
      logGameMove(
        gameId,
        turnCount,
        moveCount,
        gameRolled.activeColor,
        roll,
        firstMove.origin,
        destination,
        gameMoved,
        logDir
      )
    }

    try {
      while (
        Array.from(gameMoved.activePlay.moves).some((m: any) => {
          // Only consider moves that are 'ready' or 'in-progress' and have possible moves
          if (
            m.stateKind === 'ready' ||
            (m.stateKind === 'in-progress' && !m.origin)
          ) {
            const possibleMoves = Board.getPossibleMoves(
              gameMoved.board,
              m.player,
              m.dieValue
            )
            return possibleMoves.length > 0
          }
          return false
        })
      ) {
        const nextMove = Array.from(gameMoved.activePlay.moves).find(
          (m: any) => {
            if (
              m.stateKind === 'ready' ||
              (m.stateKind === 'in-progress' && !m.origin)
            ) {
              const possibleMoves = Board.getPossibleMoves(
                gameMoved.board,
                m.player,
                m.dieValue
              )
              return possibleMoves.length > 0
            }
            return false
          }
        ) as BackgammonMove

        if (!nextMove) {
          break
        }

        // Recalculate possible moves for this die value based on current board state
        const possibleMoves = Board.getPossibleMoves(
          gameMoved.board,
          nextMove.player,
          nextMove.dieValue
        )

        // Take the first valid move that has checkers
        let validMove = null
        for (const move of possibleMoves) {
          const origin = move.origin
          const checkers = origin.checkers
          if (
            checkers.length > 0 &&
            checkers[0].color === gameMoved.activeColor
          ) {
            validMove = move
            break
          }
        }

        if (!validMove) {
          break
        }

        const origin = validMove.origin
        const destination = validMove.destination

        try {
          // Ensure proper state transition before move
          let gameToMove = gameMoved
          if (gameMoved.stateKind === 'preparing-move') {
            gameToMove = Game.toMoving(gameMoved)
          }
          const moveResult = Game.move(gameToMove, origin.id)
          if ('board' in moveResult) {
            gameMoved = moveResult as BackgammonGameMoving
            moveCount++
            totalMoves++

            // Log this move
            logGameMove(
              gameId,
              turnCount,
              moveCount,
              gameRolled.activeColor,
              roll,
              origin,
              destination,
              gameMoved,
              logDir
            )
          }
        } catch (error) {
          console.log(`Game ${gameId}: Couldn't make move: ${error}`)
          break
        }
      }
    } catch (error) {
      console.log(`Game ${gameId}: Error during moves: ${error}`)
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      const finalLogEntry = `=== GAME END ===
Winner: ${winner.toUpperCase()}
Total Turns: ${turnCount}
Total Moves: ${totalMoves}
Game ID: ${gameId}

${'='.repeat(80)}

`
      fs.appendFileSync(logFilePath, finalLogEntry)
      return { winner, turns: turnCount, moves: totalMoves }
    }

    // Debug: Show moves array state
    // (Optional: can be commented out for performance)
    // Array.from(gameMoved.activePlay.moves).forEach((m: any, index: number) => {
    //   if (m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)) {
    //     const possibleMoves = Board.getPossibleMoves(
    //       gameMoved.board,
    //       m.player,
    //       m.dieValue
    //     )
    //   }
    // })

    // Check if all moves are completed
    const allMovesCompleted = Array.from(gameMoved.activePlay.moves).every(
      (m: any) => m.stateKind === 'completed'
    )

    if (allMovesCompleted) {
      // All dice have been used, switch turns
      // Switch turns
      const newActiveColor = gameMoved.inactivePlayer.color
      let [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
        gameMoved.players,
        newActiveColor
      )
      // Set correct stateKinds for next turn
      newActivePlayer = {
        ...newActivePlayer,
        stateKind: 'rolling',
      } as any // BackgammonPlayerRolling
      newInactivePlayer = {
        ...newInactivePlayer,
        stateKind: 'inactive',
      } as any // BackgammonPlayerInactive
      gameRolling = Game.initialize(
        [newActivePlayer, newInactivePlayer],
        gameMoved.id,
        'rolling',
        gameMoved.board,
        gameMoved.cube,
        undefined, // activePlay
        newActiveColor,
        newActivePlayer,
        newInactivePlayer
      ) as any
      continue // Start next turn
    }

    // Check if game is stuck (uncompleted moves with no possible moves)
    const stuckMoves = Array.from(gameMoved.activePlay.moves).filter(
      (m: any) =>
        m.stateKind !== 'completed' &&
        (m.stateKind === 'ready' ||
          (m.stateKind === 'in-progress' && !m.origin)) &&
        Board.getPossibleMoves(gameMoved.board, m.player, m.dieValue).length ===
          0
    )
    if (stuckMoves.length > 0) {
      // Log stuck state
      logGameMove(
        gameId,
        turnCount,
        moveCount,
        gameMoved.activeColor,
        roll,
        (stuckMoves[0] as any).origin,
        (stuckMoves[0] as any).destination,
        gameMoved,
        logDir
      )
      break
    }
  }

  // If we reach here, the game didn't finish within the turn limit
  const finalLogEntry = `=== GAME TIMEOUT ===
No winner (reached turn limit: ${maxTurns})
Total Turns: ${turnCount}
Total Moves: ${totalMoves}
Game ID: ${gameId}

${'='.repeat(80)}

`
  fs.appendFileSync(logFilePath, finalLogEntry)
  return { winner: null, turns: turnCount, moves: totalMoves }
}

export async function runMultipleGameSimulations(numGames: number = 100) {
  const logDir = path.join(process.cwd(), 'game-logs')

  console.log(`Starting ${numGames} game simulations...`)
  console.log(`Log files will be saved to: ${logDir}`)

  const results = {
    totalGames: numGames,
    completedGames: 0,
    whiteWins: 0,
    blackWins: 0,
    timeouts: 0,
    totalTurns: 0,
    totalMoves: 0,
    averageTurnsPerGame: 0,
    averageMovesPerGame: 0,
  }

  const startTime = Date.now()

  for (let i = 0; i < numGames; i++) {
    const gameId = generateGameId()
    console.log(`\nStarting game ${i + 1}/${numGames} (ID: ${gameId})`)

    try {
      const result = await runSingleGameSimulation(gameId, logDir)
      results.completedGames++
      results.totalTurns += result.turns
      results.totalMoves += result.moves

      if (result.winner === 'white') {
        results.whiteWins++
      } else if (result.winner === 'black') {
        results.blackWins++
      } else {
        results.timeouts++
      }

      console.log(
        `Game ${i + 1} completed: ${
          result.winner ? result.winner.toUpperCase() + ' wins' : 'Timeout'
        } (${result.turns} turns, ${result.moves} moves)`
      )
    } catch (error) {
      console.error(`Game ${i + 1} failed: ${error}`)
    }
  }

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  // Calculate averages
  results.averageTurnsPerGame = results.totalTurns / results.completedGames
  results.averageMovesPerGame = results.totalMoves / results.completedGames

  // Print final statistics
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SIMULATION COMPLETE`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Total Games: ${results.totalGames}`)
  console.log(`Completed Games: ${results.completedGames}`)
  console.log(
    `White Wins: ${results.whiteWins} (${(
      (results.whiteWins / results.completedGames) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `Black Wins: ${results.blackWins} (${(
      (results.blackWins / results.completedGames) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `Timeouts: ${results.timeouts} (${(
      (results.timeouts / results.completedGames) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `Average Turns per Game: ${results.averageTurnsPerGame.toFixed(1)}`
  )
  console.log(
    `Average Moves per Game: ${results.averageMovesPerGame.toFixed(1)}`
  )
  console.log(`Total Duration: ${duration.toFixed(1)} seconds`)
  console.log(
    `Average Time per Game: ${(duration / results.completedGames).toFixed(
      2
    )} seconds`
  )
  console.log(`Log files saved to: ${logDir}`)
  // End of simulation summary
}

// Allow running from command line with optional number of games argument
if (require.main === module) {
  const numGames = process.argv[2] ? parseInt(process.argv[2]) : 100
  runMultipleGameSimulations(numGames).catch((error) => {
    console.error(
      'Simulation failed:',
      error instanceof Error ? error.message : String(error)
    )
    logger.error('[Multiple Games Simulation] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
      numGames,
    })
  })
}
