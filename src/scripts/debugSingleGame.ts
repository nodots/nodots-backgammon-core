import {
  BackgammonGameMoving,
  BackgammonGameRollingForStart,
  BackgammonMove,
} from '@nodots-llc/backgammon-types/dist'
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

function displayBoard(
  game: any,
  turnNumber: number,
  moveNumber: number,
  roll: number[],
  activeColor: string
) {
  console.log(`\n=== Turn ${turnNumber}, Move ${moveNumber} ===`)
  console.log(`Active Player: ${activeColor.toUpperCase()}`)
  console.log(`Roll: [${roll.join(', ')}]`)
  console.log(`Game State: ${game.stateKind}`)

  const asciiBoard = Board.getAsciiGameBoard(
    game.board,
    game.players,
    game.activeColor,
    game.stateKind
  )
  console.log(asciiBoard)
  console.log('='.repeat(80))
}

export async function runDebugSingleGame() {
  console.log('Starting single game simulation with detailed output...\n')

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

  // Display initial board
  console.log('=== GAME START ===')
  const initialAsciiBoard = Board.getAsciiGameBoard(
    gameRolling.board,
    gameRolling.players,
    gameRolling.activeColor,
    gameRolling.stateKind
  )
  console.log(initialAsciiBoard)
  console.log('='.repeat(80))

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

      // Display board after first move
      displayBoard(
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
          console.log('\n⚠️  No next move found - game may be stuck!')
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
          console.log(
            `\n⚠️  No valid moves found for die value ${nextMove.dieValue} - game may be stuck!`
          )
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

            // Display board after this move
            displayBoard(
              gameMoved,
              turnCount,
              moveCount,
              roll,
              gameRolled.activeColor
            )
          }
        } catch (error) {
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
          break
        }
      }
    } catch (error) {
      console.log(`\n❌ Error during moves: ${error}`)
      console.log('\n⚠️  Game stuck due to error during moves!')
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      console.log(`\n🎉 ${winner.toUpperCase()} WINS!`)
      console.log(`Total Turns: ${turnCount}`)
      console.log(`Total Moves: ${totalMoves}`)
      return { winner, turns: turnCount, moves: totalMoves, stuck: false }
    }

    // Debug: Show moves array state
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

    // Check if all moves are completed
    const allMovesCompleted = Array.from(gameMoved.activePlay.moves).every(
      (m: any) => m.stateKind === 'completed'
    )

    if (allMovesCompleted) {
      // All dice have been used, switch turns
      console.log(
        `\n✅ All moves completed for ${gameMoved.activeColor}. Switching turns.`
      )
      // Switch turns
      console.log(`\n🔄 Switching to ${gameMoved.inactivePlayer.color}'s turn`)
      const newActiveColor = gameMoved.inactivePlayer.color
      let [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
        gameMoved.players,
        newActiveColor
      )
      // Set correct stateKinds for next turn
      newActivePlayer = Player.initialize(
        newActivePlayer.color,
        newActivePlayer.direction,
        undefined,
        newActivePlayer.id,
        'rolling'
      ) as any // BackgammonPlayerRolling
      newInactivePlayer = Player.initialize(
        newInactivePlayer.color,
        newInactivePlayer.direction,
        undefined,
        newInactivePlayer.id,
        'inactive'
      ) as any // BackgammonPlayerInactive
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
      console.log(
        `\n⚠️  Game stuck! Player ${gameMoved.activeColor} has dice left but no valid moves.`
      )
      console.log(`Current board state:`)
      displayBoard(gameMoved, turnCount, moveCount, roll, gameMoved.activeColor)
      return { winner: null, turns: turnCount, moves: totalMoves, stuck: true }
    }
  }

  // If we reach here, the game didn't finish within the turn limit
  console.log(`\n⚠️  Game timeout! Reached turn limit: ${maxTurns}`)
  console.log(`Total Turns: ${turnCount}`)
  console.log(`Total Moves: ${totalMoves}`)
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
