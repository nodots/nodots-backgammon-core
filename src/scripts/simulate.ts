import {
  BackgammonGameMoving,
  BackgammonGameRollingForStart,
  BackgammonMove,
} from '@nodots-llc/backgammon-types/dist'
import { Board, Game, Player } from '..'
import { logger } from '../utils/logger'

interface SimulationStats {
  totalTurns: number
  totalMoves: number
  whiteCheckersCaptured: number
  blackCheckersCaptured: number
  whiteCheckersOff: number
  blackCheckersOff: number
}

function displayTurnInfo(
  turnNumber: number,
  activeColor: string,
  roll: number[]
) {
  const message = `\n=== Turn ${turnNumber} ===\n\n${activeColor}'s roll: ${roll.join(
    ', '
  )}\n`
  console.log(message)
  logger.info('[Simulation] Turn info:', {
    turnNumber,
    activeColor,
    roll,
  })
}

// displayMoveInfo helper removed (unused)

function getStats(board: any): SimulationStats {
  const whiteBar =
    board.bar.clockwise.checkers.filter((c: any) => c.color === 'white')
      .length +
    board.bar.counterclockwise.checkers.filter((c: any) => c.color === 'white')
      .length
  const blackBar =
    board.bar.clockwise.checkers.filter((c: any) => c.color === 'black')
      .length +
    board.bar.counterclockwise.checkers.filter((c: any) => c.color === 'black')
      .length
  const whiteOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'white')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'white')
      .length
  const blackOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'black')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'black')
      .length

  return {
    totalTurns: 0, // Will be updated in main function
    totalMoves: 0, // Will be updated in main function
    whiteCheckersCaptured: whiteBar,
    blackCheckersCaptured: blackBar,
    whiteCheckersOff: whiteOff,
    blackCheckersOff: blackOff,
  }
}

function displayStats(stats: SimulationStats) {
  const message = `\n=== Simulation Statistics ===
Total Turns: ${stats.totalTurns}
Total Moves: ${stats.totalMoves}
White Checkers Captured: ${stats.whiteCheckersCaptured}
Black Checkers Captured: ${stats.blackCheckersCaptured}
White Checkers Off: ${stats.whiteCheckersOff}
Black Checkers Off: ${stats.blackCheckersOff}`
  console.log(message)
  logger.info('[Simulation] Statistics:', stats)
}

function checkWinCondition(board: any): string | null {
  // A player wins if all their checkers are off the board
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

export async function runSimulation(maxTurns: number = 100) {
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
  const game = Game.initialize(players) as BackgammonGameRollingForStart
  let turnCount = 0
  const totalMoves = 0
  const lastBoard = game.board

  // Roll for start
  let gameRolling = Game.rollForStart(game)
  console.log('Initial board state:')
  logger.info('[Simulation] Initial board state')
  Board.displayAsciiBoard(gameRolling.board)

  // If maxTurns is 0, run until there's a winner
  const shouldRunUntilWinner = maxTurns === 0

  while (shouldRunUntilWinner || turnCount < maxTurns) {
    turnCount++

    // Use gameRolling directly, no need to re-initialize
    const gameRolled = Game.roll(gameRolling)
    const roll = gameRolled.activePlayer.dice.currentRoll
    displayTurnInfo(turnCount, gameRolled.activeColor, roll)

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
            ) as any[]
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
              ) as any[]
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
        ) as any[]

        // Display all possible moves for this die value
        console.log(`\nPossible moves for die value ${nextMove.dieValue}:`)
        logger.info('[Simulation] Possible moves for die value:', {
          dieValue: nextMove.dieValue,
          possibleMovesCount: possibleMoves.length,
        })
        possibleMoves.forEach((possibleMove, index) => {
          const fromPoint =
            possibleMove.origin.kind === 'point'
              ? possibleMove.origin.position.clockwise
              : 'bar'
          const checkerCount =
            possibleMove.origin.kind === 'point'
              ? possibleMove.origin.checkers.length
              : possibleMove.origin.checkers.length
          const toPoint =
            possibleMove.destination.kind === 'point'
              ? possibleMove.destination.position.clockwise
              : 'off'
          console.log(
            `  ${
              index + 1
            }: from ${fromPoint} (${checkerCount} checkers) to ${toPoint}`
          )
        })

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
          console.log('\nNo valid moves with checkers found')
          logger.warn('[Simulation] No valid moves with checkers found')
          break
        }

        const origin = validMove.origin
        const destination = validMove.destination

        console.log(
          `\nMove ${moveCount + 1}: from ${
            origin.kind === 'point' ? origin.position.clockwise : 'bar'
          } to ${
            destination.kind === 'point'
              ? destination.position.clockwise
              : 'off'
          }`
        )

        console.log('\nBoard before move:')
        logger.info('[Simulation] Board before move')
        Board.displayAsciiBoard(gameMoved.board)

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

            console.log('\nBoard after move:')
            logger.info('[Simulation] Board after move')
            Board.displayAsciiBoard(gameMoved.board)

            // Show remaining moves
            console.log('\nRemaining moves:')
            Array.from(gameMoved.activePlay.moves).forEach((move: any) => {
              // Update possible moves for this die value
              const possibleMoves = Board.getPossibleMoves(
                gameMoved.board,
                move.player,
                move.dieValue
              )
              console.log(
                `  Die value ${move.dieValue}: ${possibleMoves.length} possible moves`
              )
            })
          }
        } catch (error) {
          console.log(`\nCouldn't make move: ${error}`)
          logger.error('[Simulation] Could not make move:', {
            error: error instanceof Error ? error.message : String(error),
            origin: origin.id,
            destination: destination.id,
          })
          break
        }
      }
    } catch (error) {
      console.log(`Error during moves: ${error}\n`)
      logger.error('[Simulation] Error during moves:', {
        error: error instanceof Error ? error.message : String(error),
        turnCount,
        moveCount,
      })
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // Check for winner
    const winner = checkWinCondition(lastBoard)
    if (winner) {
      console.log(`\n${winner.toUpperCase()} WINS!\n`)
      logger.info('[Simulation] Game won:', {
        winner,
        turnCount,
        totalMoves,
      })
      break
    }

    // Switch turns
    console.log(`Switching to ${gameMoved.inactivePlayer.color}'s turn\n`)
    logger.info('[Simulation] Switching turns:', {
      fromColor: gameMoved.activeColor,
      toColor: gameMoved.inactivePlayer.color,
    })
    // Manually switch active/inactive players and update activeColor
    const newActiveColor = gameMoved.inactivePlayer.color
    const [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
      gameMoved.players,
      newActiveColor
    )
    gameRolling = Game.initialize(
      gameMoved.players,
      gameMoved.id,
      'rolling',
      gameMoved.board,
      gameMoved.cube,
      undefined, // activePlay
      newActiveColor,
      newActivePlayer,
      newInactivePlayer
    ) as any // Type assertion to satisfy TS, as Game.initialize returns BackgammonGame
  }

  // Display final statistics
  const stats = getStats(lastBoard)
  stats.totalTurns = turnCount
  stats.totalMoves = totalMoves
  displayStats(stats)
}

// Allow running from command line with optional max turns argument
if (require.main === module) {
  const maxTurns = process.argv[2] ? parseInt(process.argv[2]) : 100
  runSimulation(maxTurns).catch((error) => {
    console.error(error)
    logger.error('[Simulation] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
      maxTurns,
    })
  })
}
