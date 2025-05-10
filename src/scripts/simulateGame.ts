import {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolled,
  BackgammonGameRollingForStart,
  BackgammonPlayers,
} from 'nodots-backgammon-types'
import { randomBackgammonColor } from '..'
import { Board } from '../Board'
import { Game } from '../Game'
import { Player } from '../Player'

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
  let currentGame: BackgammonGame = gameRolling
  let turnCount = 0
  let winner = null

  while (!winner) {
    turnCount++
    console.log(`\n=== Turn ${turnCount} ===`)

    // Use the transition function to roll dice and advance state
    let gameRolled: BackgammonGameRolled
    if (currentGame.stateKind === 'rolling-for-start') {
      const gameRolledForStart = Game.rollForStart(currentGame)
      gameRolled = Game.roll(gameRolledForStart)
    } else if (currentGame.stateKind === 'rolled-for-start') {
      gameRolled = Game.roll(currentGame)
    } else {
      throw new Error('currentGame is not in a rollable state')
    }
    const roll = (gameRolled.activePlayer as any).dice.currentRoll
    console.log(`\n${gameRolled.activeColor}'s roll: ${roll.join(', ')}`)

    // Make moves until no more valid moves are available
    const firstMove = Array.from(gameRolled.activePlay.moves)[0]
    if (!firstMove || !firstMove.origin) {
      console.log(`\nNo valid moves for ${gameRolled.activeColor} this turn`)
      // Switch turns if no winner yet
      const newActiveColor = gameRolled.inactivePlayer.color
      const [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
        gameRolled.players,
        newActiveColor
      )
      currentGame = Game.initialize(
        gameRolled.players,
        gameRolled.id,
        'rolling-for-start',
        gameRolled.board,
        gameRolled.cube
      )
      console.log(`\nSwitching to ${currentGame.activeColor}'s turn`)
      continue
    }
    let gameMoved: BackgammonGameMoving = Game.move(
      gameRolled,
      firstMove.origin
    )
    let moveCount = 1

    // Continue making moves while there are moves with possible destinations
    while (
      Array.from(gameMoved.activePlay.moves).some((m: any) => {
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
      // Find the next move that has possible destinations
      const nextMove = Array.from(gameMoved.activePlay.moves).find((m: any) => {
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
        console.log('\nNo valid moves with checkers found')
        break
      }

      const origin = validMove.origin
      const destination = validMove.destination
      moveCount++

      console.log(
        `\nMove ${moveCount}: from ${
          origin.kind === 'point' ? origin.position.clockwise : 'bar'
        } to ${
          destination.kind === 'point' ? destination.position.clockwise : 'off'
        }`
      )

      try {
        gameMoved = Game.move(gameMoved, origin)
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
      // Manually switch active/inactive players and update activeColor
      const newActiveColor = gameMoved.inactivePlayer.color
      const [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
        gameMoved.players,
        newActiveColor
      )
      currentGame = Game.initialize(
        gameMoved.players,
        gameMoved.id,
        'rolling-for-start',
        gameMoved.board,
        gameMoved.cube
      )
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
