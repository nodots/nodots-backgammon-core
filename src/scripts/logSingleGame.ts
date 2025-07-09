import {
  BackgammonGameMoving,
  BackgammonGameRollingForStart,
  BackgammonMove,
} from '@nodots-llc/backgammon-types/dist'
import * as fs from 'fs'
import * as path from 'path'
import { Board, Game, Player } from '..'
import { logger } from '../utils/logger'

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

function getGnuBoardDisplay(
  game: any,
  turnNumber: number,
  moveNumber: number,
  roll: number[],
  activeColor: string
): string {
  let output = `\n=== Turn ${turnNumber}, Move ${moveNumber} ===\n`
  output += `Active Player: ${activeColor.toUpperCase()}\n`
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

export async function logSingleGame() {
  console.log(
    'Starting single game simulation with GNU board format logging...\n'
  )

  // Create game-logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'game-logs')
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  // Create log file with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(logsDir, `single-game-${timestamp}.log`)

  let logContent = 'SINGLE GAME SIMULATION LOG\n'
  logContent += '==========================\n'
  logContent += `Started: ${new Date().toISOString()}\n\n`

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

  // Log initial board
  logContent += '=== GAME START ===\n'
  const initialAsciiBoard = Board.getAsciiBoard(
    gameRolling.board,
    gameRolling.players,
    gameRolling.activePlayer
  )
  logContent += initialAsciiBoard + '\n'
  logContent += '='.repeat(80) + '\n\n'

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

      // Log board after first move
      logContent += getGnuBoardDisplay(
        gameMoved,
        turnCount,
        moveCount,
        roll,
        gameRolled.activeColor
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
          logContent += '\n⚠️  No next move found - game may be stuck!\n'
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
          logContent += `\n⚠️  No valid moves found for die value ${nextMove.dieValue} - game may be stuck!\n`
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

            // Log board after this move
            logContent += getGnuBoardDisplay(
              gameMoved,
              turnCount,
              moveCount,
              roll,
              gameRolled.activeColor
            )
          }
        } catch (error) {
          logContent += `\n❌ Error making move: ${error}\n`
          logContent += `Origin: ${
            origin.kind === 'point' ? origin.position.clockwise : 'bar'
          }\n`
          logContent += `Destination: ${
            destination.kind === 'point'
              ? destination.position.clockwise
              : 'off'
          }\n`
          logContent += `Game state: ${gameMoved.stateKind}\n`
          logContent += '\n⚠️  Game stuck due to move error!\n'
          break
        }
      }
    } catch (error) {
      logContent += `\n❌ Error during moves: ${error}\n`
      logContent += '\n⚠️  Game stuck due to error during moves!\n'
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      logContent += `\n🎉 ${winner.toUpperCase()} WINS!\n`
      logContent += `Total Turns: ${turnCount}\n`
      logContent += `Total Moves: ${totalMoves}\n`

      // Write final log to file
      fs.writeFileSync(logFile, logContent)
      console.log(`Game completed! Log saved to: ${logFile}`)
      console.log(`Winner: ${winner.toUpperCase()}`)
      console.log(`Total Turns: ${turnCount}`)
      console.log(`Total Moves: ${totalMoves}`)

      return { winner, turns: turnCount, moves: totalMoves, stuck: false }
    }

    // Log moves array state
    logContent += `\n🔍 Debug: Moves array state:\n`
    Array.from(gameMoved.activePlay.moves).forEach((m: any, index: number) => {
      const originInfo = m.origin
        ? (() => {
            switch (m.origin.kind) {
              case 'point':
                return `point-${
                  m.origin.position[gameMoved.activePlayer.direction]
                }`
              case 'bar':
                return `bar-${gameMoved.activePlayer.direction}`
              case 'off':
                return `off-${gameMoved.activePlayer.direction}`
              default:
                throw new Error(`Unknown origin kind: ${m.origin.kind}`)
            }
          })()
        : 'null'

      const destinationInfo = m.destination
        ? (() => {
            switch (m.destination.kind) {
              case 'point':
                return `point-${
                  m.destination.position[gameMoved.activePlayer.direction]
                }`
              case 'bar':
                return `bar-${gameMoved.activePlayer.direction}`
              case 'off':
                return `off-${gameMoved.activePlayer.direction}`
              default:
                throw new Error(
                  `Unknown destination kind: ${m.destination.kind}`
                )
            }
          })()
        : 'null'

      logContent += `  Move ${index}: stateKind=${m.stateKind}, dieValue=${m.dieValue}, origin=${originInfo}, destination=${destinationInfo}\n`
      if (
        m.stateKind === 'ready' ||
        (m.stateKind === 'in-progress' && !m.origin)
      ) {
        const possibleMoves = Board.getPossibleMoves(
          gameMoved.board,
          m.player,
          m.dieValue
        )
        logContent += `    Possible moves for die ${m.dieValue}: ${possibleMoves.length}\n`
      }
    })

    // Check if all moves are completed
    const allMovesCompleted = Array.from(gameMoved.activePlay.moves).every(
      (m: any) => m.stateKind === 'completed'
    )

    if (allMovesCompleted) {
      // All dice have been used, switch turns
      logContent += `\n✅ All moves completed for ${gameMoved.activeColor}. Switching turns.\n`
      // Switch turns
      logContent += `\n🔄 Switching to ${gameMoved.inactivePlayer.color}'s turn\n`
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
      logContent += `\n⚠️  Game stuck! Player ${gameMoved.activeColor} has dice left but no valid moves.\n`
      logContent += `Current board state:\n`
      logContent += getGnuBoardDisplay(
        gameMoved,
        turnCount,
        moveCount,
        roll,
        gameMoved.activeColor
      )

      // Write log to file
      fs.writeFileSync(logFile, logContent)
      console.log(`Game stuck! Log saved to: ${logFile}`)

      return { winner: null, turns: turnCount, moves: totalMoves, stuck: true }
    }
  }

  // If we reach here, the game didn't finish within the turn limit
  logContent += `\n⚠️  Game timeout! Reached turn limit: ${maxTurns}\n`
  logContent += `Total Turns: ${turnCount}\n`
  logContent += `Total Moves: ${totalMoves}\n`

  // Write log to file
  fs.writeFileSync(logFile, logContent)
  console.log(`Game timeout! Log saved to: ${logFile}`)

  return { winner: null, turns: turnCount, moves: totalMoves, stuck: true }
}

// Allow running from command line
if (require.main === module) {
  logSingleGame().catch((error) => {
    console.error('Log simulation failed:', error)
    logger.error('[Log Single Game] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
    })
  })
}
