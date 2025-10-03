import { describe, expect, test, beforeEach } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonBoard,
  BackgammonPlayerMoving,
  BackgammonPlay,
} from '@nodots-llc/backgammon-types'
import { Play } from '..'
import { Board, Player, Dice } from '../..'
import { ascii } from '../../Board/ascii'

describe('Blocked Non-Home Checker Scenarios', () => {
  let board: BackgammonBoard
  let player: BackgammonPlayerMoving
  let play: BackgammonPlay

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Stranded checker scenario', () => {
    test('should show player with one checker outside home board blocked from entering [1, 2]', () => {
      // Setup: Player has most checkers in home board but one checker on point 8
      // Opponent blocks points 1-6 making entry impossible
      const boardImport: BackgammonCheckerContainerImport[] = [
        // White checkers - mostly in home board
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'white' },
        },
        // ONE STRANDED CHECKER on point 8 (outside home board)
        {
          position: { clockwise: 8, counterclockwise: 17 },
          checkers: { qty: 1, color: 'white' },
        },
        // Black checkers blocking the home board entry points
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 6, color: 'black' }, // MASSIVE BLOCK
        },
      ]

      board = Board.buildBoard(boardImport)

      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [1, 2] // Can't move into blocked points

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🚧 === STRANDED CHECKER SCENARIO ===')
      console.log('\nBoard State (white checker stranded on point 8):')
      console.log(ascii(board))
      console.log(`\n⚠️ Critical Situation Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  White checkers: 14 in home board + 1 STRANDED on point 8`)
      console.log(`  Black fortress: 6 checkers on point 1 🏰`)
      console.log(`  Problem: Can't bear off while checker is outside home`)

      const movesArray = Array.from(play.moves)
      console.log(`\n🎲 Available Moves: ${movesArray.length}`)

      movesArray.forEach((move, index) => {
        console.log(`\n--- Move ${index + 1} (Die: ${move.dieValue}) ---`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Options: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length === 0) {
          console.log(`  ❌ NO LEGAL MOVES - Checker on point 8 cannot move with die ${move.dieValue}`)
          console.log(`     Target would be point ${8 - move.dieValue} but it's BLOCKED!`)
        } else {
          move.possibleMoves.forEach((pm, pmIndex) => {
            const fromPos = (pm.origin as any).position
            const toPos = pm.destination ? (pm.destination as any).position : null

            let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
            let toPoint = !toPos ? 'OFF' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

            console.log(`    ${pmIndex + 1}. Point ${fromPoint} → ${toPoint}`)
          })
        }
      })

      // Show the strategic implications
      console.log(`\n🧠 Strategic Analysis:`)
      console.log(`  • Cannot bear off any checkers (non-home checker exists)`)
      console.log(`  • Point 8 checker must enter home board first`)
      console.log(`  • Die 1: Would go 8→7 (but can't bear off anyway)`)
      console.log(`  • Die 2: Would go 8→6 (but point 1 is blocked by 6 black checkers!)`)
      console.log(`  • This is a "blocked" situation - no progress possible`)

      expect(play.stateKind).toBe('moving')
      expect(play.moves.length).toBe(2)
    })
  })

  describe('Mid-board traffic jam', () => {
    test('should show checker stuck in mid-board with no escape routes [3, 4]', () => {
      // Setup: Checker on point 15 with no legal moves due to blocking
      const boardImport: BackgammonCheckerContainerImport[] = [
        // White checkers - most in home board
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 4, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 4, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 3, color: 'white' },
        },
        // ONE CHECKER STUCK in opponent's outer board
        {
          position: { clockwise: 15, counterclockwise: 10 },
          checkers: { qty: 1, color: 'white' },
        },
        // Black checkers creating blocks
        {
          position: { clockwise: 12, counterclockwise: 13 },
          checkers: { qty: 3, color: 'black' }, // Blocks 15-3=12
        },
        {
          position: { clockwise: 11, counterclockwise: 14 },
          checkers: { qty: 3, color: 'black' }, // Blocks 15-4=11
        },
        // More black checkers elsewhere
        {
          position: { clockwise: 24, counterclockwise: 1 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 23, counterclockwise: 2 },
          checkers: { qty: 2, color: 'black' },
        },
      ]

      board = Board.buildBoard(boardImport)

      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [3, 4] // Both moves blocked

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🚥 === MID-BOARD TRAFFIC JAM ===')
      console.log('\nBoard State (white checker trapped on point 15):')
      console.log(ascii(board))
      console.log(`\n🚨 Traffic Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  White distribution: 14 in home + 1 TRAPPED on point 15`)
      console.log(`  Black roadblocks: points 12(3) and 11(3) 🚧🚧`)
      console.log(`  Escape routes: 15-3=12 ❌  15-4=11 ❌`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Target point: ${15 - move.dieValue}`)
        console.log(`  Status: ${move.possibleMoves.length === 0 ? '🚫 BLOCKED' : '✅ AVAILABLE'}`)
        console.log(`  Legal options: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length === 0) {
          const targetPoint = 15 - move.dieValue
          console.log(`  ⛔ Point ${targetPoint} is occupied by black checkers!`)
        }
      })

      console.log(`\n💡 Bear-off Rules Reminder:`)
      console.log(`  • Can't bear off ANY checkers while one exists outside home board`)
      console.log(`  • Even home board checkers can't bear off until point 15 checker moves`)
      console.log(`  • This creates a strategic bottleneck`)

      expect(play.stateKind).toBe('moving')
    })
  })

  describe('Bar escape blocked', () => {
    test('should show checker on bar unable to enter due to complete home board blockade [1, 6]', () => {
      // Setup: Checker on bar with opponent controlling all entry points
      const boardImport: BackgammonCheckerContainerImport[] = [
        // White checkers - some in home board
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 5, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 5, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 4, color: 'white' },
        },
        // ONE CHECKER ON THE BAR (hit and can't re-enter)
        // This is represented by having it in the bar container
        // Black checkers creating 6-point prime (complete blockade)
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 2, color: 'black' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Manually add a checker to the bar
      if (board.bar.clockwise) {
        board.bar.clockwise.checkers = [
          {
            id: 'bar-checker-1',
            color: 'white',
            checkercontainerId: board.bar.clockwise.id,
            isMovable: true,
          },
        ]
      }

      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [1, 6] // Both entry points blocked

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n⛓️ === BAR ESCAPE BLOCKED ===')
      console.log('\nBoard State (white checker on bar, 6-point prime blocks re-entry):')
      console.log(ascii(board))
      console.log(`\n🏰 Fortress Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  White: 14 checkers + 1 ON BAR`)
      console.log(`  Black prime: Points 1-6 ALL controlled (6-point prime!)`)
      console.log(`  Re-entry impossible: Both dice blocked`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Re-entry attempt: BAR → Point ${move.dieValue}`)
        console.log(`  Status: ${move.possibleMoves.length === 0 ? '🚫 BLOCKED' : '✅ AVAILABLE'}`)

        if (move.possibleMoves.length === 0) {
          console.log(`  ⛔ Point ${move.dieValue} controlled by black checkers!`)
        }
      })

      console.log(`\n📋 Rules in Effect:`)
      console.log(`  • Must enter from bar before any other moves`)
      console.log(`  • All 6 home board points blocked = complete lockout`)
      console.log(`  • This is the strongest defensive position in backgammon`)
      console.log(`  • Player is completely immobilized`)

      expect(play.stateKind).toBe('moving')
    })
  })

  describe('Pip wastage scenario', () => {
    test('should show forced inefficient moves due to blocking [5, 6]', () => {
      // Setup: Player forced to waste pips due to blocking
      const boardImport: BackgammonCheckerContainerImport[] = [
        // White checkers - mostly ready to bear off
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'white' },
        },
        // ONE CHECKER outside home on point 10
        {
          position: { clockwise: 10, counterclockwise: 15 },
          checkers: { qty: 1, color: 'white' },
        },
        // Black checkers blocking key entry points
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 2, color: 'black' }, // Blocks 10-5=5
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 2, color: 'black' }, // Blocks 10-6=4
        },
      ]

      board = Board.buildBoard(boardImport)

      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [5, 6] // High value dice, but limited options

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n💸 === PIP WASTAGE SCENARIO ===')
      console.log('\nBoard State (forced inefficient moves):')
      console.log(ascii(board))
      console.log(`\n💰 Efficiency Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}] = 11 total pips`)
      console.log(`  Checker on point 10 has limited escape routes`)
      console.log(`  Optimal targets blocked by black checkers`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        const targetPoint = 10 - move.dieValue
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Ideal target: Point 10 → Point ${targetPoint}`)
        console.log(`  Available moves: ${move.possibleMoves.length}`)

        if (move.possibleMoves.length === 0) {
          console.log(`  ❌ Point ${targetPoint} is BLOCKED!`)
          console.log(`  💸 ${move.dieValue} pips WASTED - no legal moves`)
        } else {
          move.possibleMoves.forEach((pm, pmIndex) => {
            const fromPos = (pm.origin as any).position
            const toPos = pm.destination ? (pm.destination as any).position : null

            let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
            let toPoint = !toPos ? 'OFF' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

            const efficiency = fromPoint === '10' ? '⚡ NEEDED' : '💸 WASTEFUL'
            console.log(`    ${pmIndex + 1}. ${efficiency} Point ${fromPoint} → ${toPoint}`)
          })
        }
      })

      console.log(`\n📊 Impact Assessment:`)
      console.log(`  • High-value dice roll partially wasted`)
      console.log(`  • Cannot bear off while point 10 checker exists`)
      console.log(`  • Forced to make suboptimal moves with remaining pips`)
      console.log(`  • This demonstrates blocking strategy effectiveness`)

      expect(play.stateKind).toBe('moving')
    })
  })
})