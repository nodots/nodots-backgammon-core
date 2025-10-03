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

describe('Bear-off Bug: White player stuck with 6 roll', () => {
  let board: BackgammonBoard
  let player: BackgammonPlayerMoving
  let play: BackgammonPlay

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Specific bug scenario', () => {
    test('should reproduce the exact stuck game scenario where white should be able to bear off with 6 but cannot move', () => {
      // Setup the exact scenario from the bug report:
      // - White player should be able to bear off
      // - Has a 6 roll but cannot make any moves
      // - All white checkers are in home board (positions 1-6)
      const boardImport: BackgammonCheckerContainerImport[] = [
        // White checkers all in home board - exact bear-off scenario
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 2, color: 'white' },
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
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 5, color: 'white' },
        },
        // Some black checkers elsewhere (not blocking)
        {
          position: { clockwise: 8, counterclockwise: 17 },
          checkers: { qty: 5, color: 'black' },
        },
        {
          position: { clockwise: 13, counterclockwise: 12 },
          checkers: { qty: 10, color: 'black' },
        },
      ]

      board = Board.buildBoard(boardImport)

      // Create a white player moving clockwise with a roll of 6
      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [6, 2] // The problematic 6

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🚨 === BEAR-OFF BUG REPRODUCTION ===')
      console.log('\nBoard State (all white checkers in home board):')
      console.log(ascii(board))
      console.log(`\nCritical Details:`)
      console.log(`  Player Color: ${player.color}`)
      console.log(`  Player Direction: ${player.direction}`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  Play State: ${play.stateKind}`)
      console.log(`  Total Moves: ${play.moves.length}`)

      // Check if all white checkers are in home board (bear-off eligible)
      const whiteCheckersInHomeBoard = board.points
        .filter(point => point.position.clockwise >= 1 && point.position.clockwise <= 6)
        .reduce((total, point) =>
          total + point.checkers.filter(c => c.color === 'white').length, 0
        )

      const whiteCheckersOnBar = board.bar.clockwise.checkers.filter(c => c.color === 'white').length
      const whiteCheckersOff = board.off.clockwise.checkers.filter(c => c.color === 'white').length
      const totalWhiteCheckers = whiteCheckersInHomeBoard + whiteCheckersOnBar + whiteCheckersOff

      console.log(`\n📊 Checker Distribution:`)
      console.log(`  White in home board (1-6): ${whiteCheckersInHomeBoard}`)
      console.log(`  White on bar: ${whiteCheckersOnBar}`)
      console.log(`  White borne off: ${whiteCheckersOff}`)
      console.log(`  Total white checkers: ${totalWhiteCheckers}`)

      // Analyze each move in detail
      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 --- Move ${index + 1} (Die: ${move.dieValue}) ---`)
        console.log(`  Move ID: ${move.id.substring(0, 8)}`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Possible Moves: ${move.possibleMoves.length}`)

        if (move.dieValue === 6) {
          console.log(`\n  🔍 ANALYSIS FOR DIE 6:`)
          console.log(`    Should be able to bear off from point 6? No checkers on point 6`)
          console.log(`    Should be able to bear off from highest point (5)? YES - rule allows it`)
          console.log(`    Checkers on point 5: ${board.points.find(p => p.position.clockwise === 5)?.checkers.filter(c => c.color === 'white').length || 0}`)
        }

        if (move.possibleMoves.length === 0) {
          console.log(`  ❌ NO LEGAL MOVES AVAILABLE!`)
          console.log(`  🚨 This is the BUG - player should be able to bear off with die 6`)
          console.log(`  🔍 Expected: Bear off from highest point (point 5) with die 6`)
        } else {
          move.possibleMoves.forEach((pm, pmIndex) => {
            const fromPos = (pm.origin as any).position
            const toPos = pm.destination ? (pm.destination as any).position : null

            let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
            let toPoint = !toPos ? 'OFF' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

            console.log(`    ✅ Option ${pmIndex + 1}: Point ${fromPoint} → ${toPoint}`)
          })
        }
      })

      // Specific checks for the bug
      const move6 = movesArray.find(m => m.dieValue === 6)
      if (move6) {
        console.log(`\n🔬 DETAILED ANALYSIS OF DIE 6 MOVE:`)
        console.log(`  Can bear off: ${move6.moveKind === 'bear-off'}`)
        console.log(`  Has moves: ${move6.possibleMoves.length > 0}`)

        if (move6.possibleMoves.length === 0) {
          console.log(`  🚨 BUG CONFIRMED: Die 6 has no possible moves`)
          console.log(`  📋 Bear-off rules state: Can use higher die to bear off from highest point`)
          console.log(`  📋 Highest white checker is on point 5`)
          console.log(`  📋 Should be able to bear off point 5 checker with die 6`)
        }
      }

      // Assertions
      expect(play.stateKind).toBe('moving')
      expect(play.moves.length).toBe(2) // Two dice values

      // Critical test: If all checkers are in home board and we have a 6,
      // there should always be at least one possible move (bear-off from highest point)
      const hasNoMoves6 = movesArray.some(m => m.dieValue === 6 && m.possibleMoves.length === 0)
      if (hasNoMoves6) {
        console.log(`\n🚨 BUG REPRODUCED: Die 6 has no moves despite being in bear-off phase`)
        // Don't fail the test yet - we want to see the exact scenario
      }

      // Log the bear-off eligibility check
      const isEligibleForBearOff = whiteCheckersOnBar === 0 && whiteCheckersInHomeBoard === totalWhiteCheckers - whiteCheckersOff
      console.log(`\n🎯 Bear-off Eligibility: ${isEligibleForBearOff}`)
      console.log(`  No checkers on bar: ${whiteCheckersOnBar === 0}`)
      console.log(`  All remaining checkers in home: ${whiteCheckersInHomeBoard === totalWhiteCheckers - whiteCheckersOff}`)

      if (isEligibleForBearOff && hasNoMoves6) {
        console.log(`\n💥 CONFIRMED BUG: Eligible for bear-off but die 6 has no moves!`)
      }
    })
  })

  describe('Bear-off rule verification', () => {
    test('should allow bearing off with higher die when no checkers on exact point', () => {
      // Test the specific bear-off rule: can use 6 to bear off from point 5 if no checkers on point 6
      const boardImport: BackgammonCheckerContainerImport[] = [
        // Only checkers on point 5, none on point 6
        {
          position: { clockwise: 5, counterclockwise: 20 },
          checkers: { qty: 1, color: 'white' },
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
      rolledPlayer.dice.currentRoll = [6, 1]

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🧪 === BEAR-OFF RULE TEST ===')
      console.log('\nBoard: Only 1 checker on point 5, none on point 6')
      console.log(ascii(board))

      const movesArray = Array.from(play.moves)
      const move6 = movesArray.find(m => m.dieValue === 6)

      console.log(`\n🎲 Die 6 Analysis:`)
      console.log(`  Move Kind: ${move6?.moveKind}`)
      console.log(`  Possible Moves: ${move6?.possibleMoves.length || 0}`)

      if (move6 && move6.possibleMoves.length > 0) {
        const bearOffMove = move6.possibleMoves.find(pm => !pm.destination)
        if (bearOffMove) {
          const fromPoint = (bearOffMove.origin as any).position.clockwise
          console.log(`  ✅ Can bear off from point ${fromPoint} with die 6`)
        }
      } else {
        console.log(`  ❌ Cannot bear off with die 6 - this violates bear-off rules`)
      }

      // This should work according to bear-off rules
      expect(move6).toBeDefined()
      expect(move6?.moveKind).toBe('bear-off')
      expect(move6?.possibleMoves.length).toBeGreaterThan(0)
    })
  })
})