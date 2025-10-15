import {
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGameRollingForStart,
  BackgammonMove,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '..'
import { logger } from '../utils/logger'

function checkWinCondition(board: any): string | null {
  // White bears off clockwise; Black bears off counterclockwise
  const whiteCheckersOff = board.off.clockwise.checkers.filter(
    (c: any) => c.color === 'white'
  ).length
  const blackCheckersOff = board.off.counterclockwise.checkers.filter(
    (c: any) => c.color === 'black'
  ).length

  if (whiteCheckersOff === 15) return 'white'
  if (blackCheckersOff === 15) return 'black'
  return null
}

function displayBoard(
  game: any,
  turnNumber: number,
  moveNumber: number,
  roll: number[],
  activeColor: string,
  playerModels: { [playerId: string]: string }
) {
  console.log(`\n=== Turn ${turnNumber}, Move ${moveNumber} ===`)

  // Use standardized player identification format
  const symbol = activeColor === 'black' ? 'X' : 'O'
  const model = activeColor === 'white' ? 'White Player' : 'Black Player'
  const direction = activeColor === 'white' ? 'clockwise' : 'counterclockwise'

  console.log(`Active: ${symbol} | ${model} | ${direction} >`)
  console.log(`Roll: [${roll.join(', ')}]`)
  console.log(`Game State: ${game.stateKind}`)

  const asciiBoard = Board.getAsciiGameBoard(
    game.board,
    game.players,
    game.activeColor,
    game.stateKind,
    undefined,
    playerModels
  )
  console.log(asciiBoard)
  console.log('='.repeat(80))
}

export async function runDebugSingleGame() {
  const FAST = process.env.NODOTS_SIM_FAST === '1'
  if (!FAST) console.log('Starting single game simulation with detailed output...\n')

  // Initialize players
  const whitePlayer = Player.initialize(
    'white',
    'clockwise',
    'rolling-for-start',
    true
  )
  const blackPlayer = Player.initialize(
    'black',
    'counterclockwise',
    'rolling-for-start',
    true
  )
  const players = [whitePlayer, blackPlayer] as [
    typeof whitePlayer,
    typeof blackPlayer
  ]

  // Create player models mapping for standardized display
  const playerModels = {
    [whitePlayer.id]: 'White Player (Clockwise)',
    [blackPlayer.id]: 'Black Player (Counterclockwise)',
  }

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turnCount = 0
  let totalMoves = 0
  let lastBoard = game.board

  // Roll for start
  let gameRolling = Game.rollForStart(game)

  // Display initial board
  if (!FAST) {
    console.log('=== GAME START ===')
    try {
      const initialAsciiBoard = Board.getAsciiGameBoard(
        gameRolling.board,
        gameRolling.players,
        gameRolling.activeColor,
        gameRolling.stateKind,
        undefined,
        playerModels
      )
      console.log(initialAsciiBoard)
    } catch {
      // ignore ascii errors in fast mode
    }
    console.log('='.repeat(80))
  }

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
    let gameMoved: BackgammonGameMoving | BackgammonGameMoved = gameRolled

    try {
      while (
        gameMoved.stateKind === 'moving' &&
        Array.from(gameMoved.activePlay.moves).some((m: any) => {
          if (m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)) {
            const pm = Board.getPossibleMoves(gameMoved.board, m.player, m.dieValue) as
              | BackgammonMoveSkeleton[]
              | { moves: BackgammonMoveSkeleton[] }
            const movesArr = Array.isArray(pm) ? pm : pm.moves
            return movesArr.length > 0
          }
          return false
        })
      ) {
        const nextMove = Array.from(gameMoved.activePlay.moves).find((m: any) => {
          if (m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)) {
            const pm = Board.getPossibleMoves(gameMoved.board, m.player, m.dieValue) as
              | BackgammonMoveSkeleton[]
              | { moves: BackgammonMoveSkeleton[] }
            const movesArr = Array.isArray(pm) ? pm : pm.moves
            return movesArr.length > 0
          }
          return false
        }) as BackgammonMove | undefined

        if (!nextMove) {
          console.log('\n⚠️  No next move found - game may be stuck!')
          break
        }

        // Recalculate possible moves for this die value based on current board state
        const pm = Board.getPossibleMoves(
          gameMoved.board,
          (nextMove as any).player,
          (nextMove as any).dieValue
        ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
        const possibleMoves = Array.isArray(pm) ? pm : pm.moves

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
          console.log(
            `\n⚠️  No valid moves found for die value ${nextMove.dieValue} - game may be stuck!`
          )
          break
        }

        const origin = validMove.origin
        const destination = validMove.destination

        try {
          // Ensure proper state transition before move
          const gameToMove = gameMoved
          const originChecker = origin.checkers.find(
            (c: any) => c.color === (gameMoved as any).activeColor
          )
          if (!originChecker) {
            if (!FAST) console.log('No checker of active color at chosen origin; breaking')
            break
          }
          const moveResult = Game.move(
            gameToMove as BackgammonGameMoving,
            originChecker.id
          )
          if ((moveResult as any).stateKind === 'moved') {
            gameMoved = moveResult as BackgammonGameMoved
          } else if ('board' in moveResult) {
            gameMoved = moveResult as BackgammonGameMoving
            moveCount++
            totalMoves++

            // Display board after this move (skip in FAST mode)
            if (!FAST && gameMoved.stateKind === 'moving') {
              displayBoard(
                gameMoved,
                turnCount,
                moveCount,
                roll,
                gameRolled.activeColor,
                playerModels
              )
            }
          }
        } catch (error) {
          if (!FAST) {
            console.log(`\n❌ Error making move: ${error}`)
            console.log(
              `Origin: ${
                origin.kind === 'point' ? origin.position.clockwise : 'bar'
              }`
            )
            console.log(
              `Destination: ${
                destination.kind === 'point'
                  ? destination.position.clockwise
                  : 'off'
              }`
            )
            console.log(`Game state: ${gameMoved.stateKind}`)
            console.log('\n⚠️  Game stuck due to move error!')
          }
          break
        }
      }
    } catch (error) {
      if (!FAST) {
        console.log(`\n❌ Error during moves: ${error}`)
        console.log('\n⚠️  Game stuck due to error during moves!')
      }
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      if (!FAST) {
        console.log(`\n🎉 ${winner.toUpperCase()} WINS!`)
        console.log(`Total Turns: ${turnCount}`)
        console.log(`Total Moves: ${totalMoves}`)
      }
      return { winner, turns: turnCount, moves: totalMoves, stuck: false }
    }

    // Skip verbose per-move debug in FAST mode
    if (!FAST) {
      console.log(`\n🔍 Debug: Moves array state:`)
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

        console.log(
          `  Move ${index}: stateKind=${m.stateKind}, dieValue=${m.dieValue}, origin=${originInfo}, destination=${destinationInfo}`
        )
        if (
          m.stateKind === 'ready' ||
          (m.stateKind === 'in-progress' && !m.origin)
        ) {
          const possibleMoves = Board.getPossibleMoves(
            gameMoved.board,
            m.player,
            m.dieValue
          )
          console.log(
            `    Possible moves for die ${m.dieValue}: ${possibleMoves.length}`
          )
        }
      })
    }

    // If the game reached 'moved' state, confirm turn
    if (gameMoved.stateKind === 'moved') {
      if (!FAST)
        console.log(
          `\n✅ All moves completed for ${gameMoved.activeColor}. Switching turns.`
        )
      gameRolling = Game.confirmTurn(gameMoved)
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
      if (!FAST) {
        console.log(
          `\n⚠️  Game stuck! Player ${gameMoved.activeColor} has dice left but no valid moves.`
        )
        console.log(`Current board state:`)
        displayBoard(
          gameMoved,
          turnCount,
          moveCount,
          roll,
          gameMoved.activeColor,
          playerModels
        )
      }
      return { winner: null, turns: turnCount, moves: totalMoves, stuck: true }
    }
  }

  // If we reach here, the game didn't finish within the turn limit
  if (!FAST) {
    console.log(`\n⚠️  Game timeout! Reached turn limit: ${maxTurns}`)
    console.log(`Total Turns: ${turnCount}`)
    console.log(`Total Moves: ${totalMoves}`)
  }
  return { winner: null, turns: turnCount, moves: totalMoves, stuck: true }
}

// Allow running from command line
if (require.main === module) {
  runDebugSingleGame().catch((error) => {
    console.error('Debug simulation failed:', error)
    logger.error('[Debug Single Game] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
    })
  })
}
