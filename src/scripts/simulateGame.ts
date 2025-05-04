import { Game } from '../Game'
import { Board } from '../Board'
import { Player } from '../Player'
import { randomBackgammonColor } from '..'
import {
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRollingForStart,
  BackgammonPlayers,
} from 'nodots-backgammon-types'

function simulateGame() {
  // Initial game setup
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
  const players: BackgammonPlayers = [
    Player.initialize(clockwiseColor, 'clockwise'),
    Player.initialize(counterclockwiseColor, 'counterclockwise'),
  ]

  // Start game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  console.log('\nInitial board state:')
  console.log(Board.getAsciiBoard(game.board))

  // Roll for start to determine first player
  const gameRolling = Game.rollForStart(game)
  console.log(`\nFirst player: ${gameRolling.activeColor}`)

  // Game loop
  let currentGame = gameRolling
  let turnCount = 0
  let winner = null

  while (!winner) {
    turnCount++
    console.log(`\n=== Turn ${turnCount} ===`)

    // Convert to rolled-for-start state
    const rolledForStartGame = {
      ...currentGame,
      stateKind: 'rolled-for-start',
      players: [
        {
          ...currentGame.activePlayer,
          stateKind: 'rolling',
        },
        {
          ...currentGame.inactivePlayer,
          stateKind: 'inactive',
        },
      ],
    } as BackgammonGameRolledForStart

    // Roll dice
    let gameMoving = Game.roll(rolledForStartGame) as BackgammonGameMoving
    console.log(
      `\n${gameMoving.activeColor}'s roll: ${gameMoving.activePlay.moves
        .map((m) => m.dieValue)
        .join(', ')}`
    )

    // Make moves until no more valid moves are available
    let gameMoved = gameMoving
    let moveCount = 0

    // Keep making moves while there are moves with possible destinations
    while (
      gameMoved.activePlay.moves.some(
        (m) =>
          (m.stateKind === 'ready' ||
            (m.stateKind === 'in-progress' && !m.origin)) &&
          m.possibleMoves.length > 0
      )
    ) {
      // Find the next move that has possible destinations
      const nextMove = gameMoved.activePlay.moves.find(
        (m) =>
          (m.stateKind === 'ready' ||
            (m.stateKind === 'in-progress' && !m.origin)) &&
          m.possibleMoves.length > 0
      )

      if (!nextMove) {
        break
      }

      // Take the first possible move
      const validMove = nextMove.possibleMoves[0]
      moveCount++

      const origin = validMove.origin
      const destination = validMove.destination
      console.log(
        `\nMove ${moveCount}: from ${
          origin.kind === 'point' ? origin.position.clockwise : 'bar'
        } to ${
          destination.kind === 'point' ? destination.position.clockwise : 'off'
        }`
      )

      try {
        gameMoved = Game.move(gameMoved, origin) as BackgammonGameMoving
        console.log('\nBoard after move:')
        console.log(Board.getAsciiBoard(gameMoved.board))

        // Check if this player has won after the move
        const playerOffPosition =
          gameMoved.board.off[gameMoved.activePlayer.direction]
        const playerCheckers = playerOffPosition.checkers.filter(
          (checker) => checker.color === gameMoved.activeColor
        )

        // A player wins when they have all 15 checkers in their off position
        if (playerCheckers.length === 15) {
          winner = gameMoved.activeColor
          break
        }
      } catch (error) {
        console.log(`\nCouldn't make move: ${error}`)
        break
      }
    }

    if (moveCount === 0) {
      console.log(`\n${gameMoved.activeColor} has no valid moves this turn`)
    }

    if (!winner) {
      // Switch turns if no winner yet
      currentGame = Game.switchTurn(gameMoved)
      console.log(`\nSwitching to ${currentGame.activeColor}'s turn`)
    }
  }

  // Display final game state and winner
  console.log('\n=== GAME OVER ===')
  console.log(`Winner: ${winner}`)
  console.log('\nFinal board state:')
  console.log(Board.getAsciiBoard(currentGame.board))
  console.log(`\nGame completed in ${turnCount} turns`)
}

// Run the simulation
simulateGame()
