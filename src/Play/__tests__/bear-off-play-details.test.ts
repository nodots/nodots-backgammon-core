import { describe, expect, test, beforeEach } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonBoard,
  BackgammonPlayerMoving,
  BackgammonPlay,
  BackgammonMove,
} from '@nodots-llc/backgammon-types'
import { Play } from '..'
import { Board, Player, Dice } from '../..'
import { ascii } from '../../Board/ascii'

describe('Bear-off Play Details', () => {
  let board: BackgammonBoard
  let player: BackgammonPlayerMoving
  let play: BackgammonPlay

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Simple bear-off scenario', () => {
    test('should show all play details when player can bear off with roll [6, 3]', () => {
      // Setup board with white checkers only in home board (bearing off position)
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a player who has rolled [6, 3]
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Mock the dice roll
      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [6, 3]

      // Convert to moving state
      player = Player.toMoving(rolledPlayer)

      // Initialize the play
      play = Play.initialize(board, player)

      // Log all play details
      console.log('\n=== BEAR-OFF PLAY DETAILS ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\nPlay State: ${play.stateKind}`)
      console.log(`Player Color: ${player.color}`)
      console.log(`Player Direction: ${player.direction}`)
      console.log(`Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`Total Moves: ${play.moves.size}`)

      // Examine each move in detail
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} ---`)
        console.log(`  Move ID: ${move.id}`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Die Value: ${move.dieValue}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length > 0) {
          move.possibleMoves.forEach((pm, pmIndex) => {
            console.log(`    Option ${pmIndex + 1}:`)
            console.log(`      Die Value: ${pm.dieValue}`)
            console.log(`      Direction: ${pm.direction}`)
            console.log(`      Origin: ${JSON.stringify(pm.origin)}`)
            console.log(`      Destination: ${pm.destination && pm.destination.kind === 'off' ? 'OFF (bear-off)' : pm.destination ? JSON.stringify(pm.destination) : 'OFF (bear-off)'}`)
          })
        }
      })

      // Assertions
      expect(play.stateKind).toBe('moving')
      expect(play.moves.size).toBe(2) // Two dice, two moves

      // Check that bear-off moves are available
      const hasBearOffMoves = movesArray.some(move =>
        move.possibleMoves.some(pm => {
          // Bear-off is when destination has kind 'off'
          return pm.destination && pm.destination.kind === 'off'
        })
      )
      expect(hasBearOffMoves).toBe(true)
    })
  })

  describe('Doubles bear-off scenario', () => {
    test('should show all play details when player rolls doubles [4, 4] for bear-off', () => {
      // Setup board with checkers positioned for bearing off with 4s
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 4, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a player who has rolled doubles [4, 4]
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Mock the dice roll
      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [4, 4]

      // Convert to moving state
      player = Player.toMoving(rolledPlayer)

      // Initialize the play
      play = Play.initialize(board, player)

      console.log('\n=== DOUBLES BEAR-OFF PLAY DETAILS ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\nPlay State: ${play.stateKind}`)
      console.log(`Player Color: ${player.color}`)
      console.log(`Player Direction: ${player.direction}`)
      console.log(`Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`Total Moves: ${play.moves.size}`)

      // Examine each move in detail
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} ---`)
        console.log(`  Move ID: ${move.id}`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Die Value: ${move.dieValue}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length > 0) {
          move.possibleMoves.forEach((pm, pmIndex) => {
            console.log(`    Option ${pmIndex + 1}:`)
            console.log(`      Die Value: ${pm.dieValue}`)
            console.log(`      Direction: ${pm.direction}`)
            console.log(`      Origin: ${JSON.stringify(pm.origin)}`)
            console.log(`      Destination: ${pm.destination && pm.destination.kind === 'off' ? 'OFF (bear-off)' : pm.destination ? JSON.stringify(pm.destination) : 'OFF (bear-off)'}`)
          })
        }
      })

      // Assertions for doubles
      expect(play.stateKind).toBe('moving')
      expect(play.moves.size).toBe(4) // Doubles create 4 moves

      // All moves should have same die value for doubles
      const dieValues = movesArray.map(m => m.dieValue)
      expect(dieValues.every(v => v === 4)).toBe(true)

      // Check that bear-off moves are available
      const bearOffMoves = movesArray.filter(move =>
        move.possibleMoves.some(pm => pm.destination && pm.destination.kind === 'off')
      )
      expect(bearOffMoves.length).toBeGreaterThan(0)
    })
  })

  describe('Mixed bear-off scenario', () => {
    test('should show play details when some checkers can bear off and others must move within home', () => {
      // Setup board with checkers that require both bear-off and internal moves
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 1, color: 'white' },
        },
        // Add a black checker to create blocking scenario
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 2, color: 'black' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a player who has rolled [5, 2]
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Mock the dice roll
      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [5, 2]

      // Convert to moving state
      player = Player.toMoving(rolledPlayer)

      // Initialize the play
      play = Play.initialize(board, player)

      console.log('\n=== MIXED BEAR-OFF PLAY DETAILS ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\nPlay State: ${play.stateKind}`)
      console.log(`Player Color: ${player.color}`)
      console.log(`Player Direction: ${player.direction}`)
      console.log(`Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`Total Moves: ${play.moves.size}`)

      // Examine each move in detail
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} (Die: ${move.dieValue}) ---`)
        console.log(`  Move ID: ${move.id}`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        // Sequence property may not exist on all move types
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length > 0) {
          move.possibleMoves.forEach((pm, pmIndex) => {
            // Get position info from origin and destination
            const fromPos = (pm.origin as any).position
            const toPos = pm.destination ? (pm.destination as any).position : null

            let fromPoint: string
            if (fromPos === 'bar') {
              fromPoint = 'BAR'
            } else if (fromPos && typeof fromPos === 'object') {
              fromPoint = String(fromPos.clockwise || fromPos.counterclockwise)
            } else {
              fromPoint = JSON.stringify(pm.origin)
            }

            let toPoint: string
            if (!toPos) {
              toPoint = 'OFF'
            } else if (pm.destination && pm.destination.kind === 'off') {
              toPoint = 'OFF'
            } else if (toPos === 'bar') {
              toPoint = 'BAR'
            } else if (typeof toPos === 'object') {
              toPoint = String(toPos.clockwise || toPos.counterclockwise)
            } else {
              toPoint = JSON.stringify(pm.destination)
            }

            console.log(`    Option ${pmIndex + 1}: ${fromPoint} → ${toPoint} (die: ${pm.dieValue})`)
          })
        }
      })

      // Assertions
      expect(play.stateKind).toBe('moving')
      expect(play.moves.size).toBe(2)

      // Check move types available
      const hasBearOff = movesArray.some(move =>
        move.possibleMoves.some(pm => pm.destination && pm.destination.kind === 'off')
      )
      const hasNormal = movesArray.some(move =>
        move.possibleMoves.some(pm => pm.destination)
      )

      console.log(`\nHas bear-off moves: ${hasBearOff}`)
      console.log(`Has normal moves: ${hasNormal}`)

      // Should have both bear-off and normal moves available
      expect(hasBearOff).toBe(true)
      expect(hasNormal).toBe(true)
    })
  })

  describe('Edge case: Exact bear-off', () => {
    test('should show play details when checker can bear off with exact die value', () => {
      // Setup board with single checker on point 3
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a player who has rolled [3, 1]
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Mock the dice roll
      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [3, 1]

      // Convert to moving state
      player = Player.toMoving(rolledPlayer)

      // Initialize the play
      play = Play.initialize(board, player)

      console.log('\n=== EXACT BEAR-OFF PLAY DETAILS ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\nPlay State: ${play.stateKind}`)
      console.log(`Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`Total Moves: ${play.moves.size}`)

      // Examine each move
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} (Die: ${move.dieValue}) ---`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          // Get position info from origin and destination
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint: string
          if (fromPos === 'bar') {
            fromPoint = 'BAR'
          } else if (fromPos && typeof fromPos === 'object') {
            fromPoint = String(fromPos.clockwise || fromPos.counterclockwise)
          } else {
            fromPoint = JSON.stringify(pm.origin)
          }

          let toPoint: string
          if (!toPos) {
            toPoint = 'OFF'
          } else if (toPos === 'off') {
            toPoint = 'OFF'
          } else if (toPos === 'bar') {
            toPoint = 'BAR'
          } else if (typeof toPos === 'object') {
            toPoint = String(toPos.clockwise || toPos.counterclockwise)
          } else {
            toPoint = JSON.stringify(pm.destination)
          }

          console.log(`    Option ${pmIndex + 1}: ${fromPoint} → ${toPoint} (die: ${pm.dieValue})`)
        })
      })

      // Find the move with die value 3
      const exactBearOffMove = movesArray.find(m => m.dieValue === 3)
      expect(exactBearOffMove).toBeDefined()

      if (exactBearOffMove) {
        const bearOffOption = exactBearOffMove.possibleMoves.find(pm => pm.destination && pm.destination.kind === 'off')
        expect(bearOffOption).toBeDefined()
        console.log('\n✓ Exact bear-off with die value 3 is available')
      }
    })
  })

  describe('Complex bear-off with dependencies', () => {
    test('should show play details with move dependencies during bear-off', () => {
      // Setup board where moves have dependencies
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a player who has rolled [6, 5]
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Mock the dice roll
      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [6, 5]

      // Convert to moving state
      player = Player.toMoving(rolledPlayer)

      // Initialize the play
      play = Play.initialize(board, player)

      console.log('\n=== BEAR-OFF WITH DEPENDENCIES PLAY DETAILS ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\nPlay State: ${play.stateKind}`)
      console.log(`Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`Total Moves: ${play.moves.size}`)

      // Examine each move
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} (Die: ${move.dieValue}) ---`)
        console.log(`  Move ID: ${move.id}`)
        console.log(`  State: ${move.stateKind}`)
        // Sequence property may not exist on all move types
        // Dependencies property may not exist on all move types
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          // Get position info from origin and destination
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint: string
          if (fromPos === 'bar') {
            fromPoint = 'BAR'
          } else if (fromPos && typeof fromPos === 'object') {
            fromPoint = String(fromPos.clockwise || fromPos.counterclockwise)
          } else {
            fromPoint = JSON.stringify(pm.origin)
          }

          let toPoint: string
          if (!toPos) {
            toPoint = 'OFF'
          } else if (toPos === 'off') {
            toPoint = 'OFF'
          } else if (toPos === 'bar') {
            toPoint = 'BAR'
          } else if (typeof toPos === 'object') {
            toPoint = String(toPos.clockwise || toPos.counterclockwise)
          } else {
            toPoint = JSON.stringify(pm.destination)
          }

          console.log(`    Option ${pmIndex + 1}: ${fromPoint} → ${toPoint} (die: ${pm.dieValue})`)
        })
      })

      // Assertions
      expect(play.stateKind).toBe('moving')
      expect(play.moves.size).toBe(2)

      // Both moves should be able to bear off
      const allHaveBearOff = movesArray.every(move =>
        move.possibleMoves.some(pm => pm.destination && pm.destination.kind === 'off')
      )
      expect(allHaveBearOff).toBe(true)

      console.log('\n✓ All moves can bear off checkers')
    })
  })
})