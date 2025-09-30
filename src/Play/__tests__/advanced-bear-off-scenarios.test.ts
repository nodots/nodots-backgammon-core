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

describe('Advanced Bear-off Scenarios', () => {
  let board: BackgammonBoard
  let player: BackgammonPlayerMoving
  let play: BackgammonPlay

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Race to the finish', () => {
    test('should show bear-off race with checkers on high points [6, 5]', () => {
      // Setup: Player has checkers spread across points 6, 5, 4 - classic bear-off race
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 5, color: 'white' },
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
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
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
      rolledPlayer.dice.currentRoll = [6, 5]

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🎯 === BEAR-OFF RACE SCENARIO ===')
      console.log('\nBoard State:')
      console.log(ascii(board))
      console.log(`\n📊 Game Stats:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  Total Moves Available: ${play.moves.size}`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  State: ${move.stateKind}`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Options Available: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint: string
          if (fromPos && typeof fromPos === 'object') {
            fromPoint = String(fromPos.clockwise || fromPos.counterclockwise)
          } else {
            fromPoint = 'BAR'
          }

          let toPoint: string
          if (!toPos) {
            toPoint = 'OFF ⭐'
          } else if (typeof toPos === 'object') {
            toPoint = String(toPos.clockwise || toPos.counterclockwise)
          } else {
            toPoint = toPos
          }

          console.log(`    ${pmIndex + 1}. Point ${fromPoint} → ${toPoint}`)
        })
      })

      expect(play.stateKind).toBe('moving')
      expect(play.moves.size).toBe(2)
    })
  })

  describe('Gap scenario', () => {
    test('should show bear-off with gaps in home board [6, 1]', () => {
      // Setup: Player has gaps in home board - testing bear-off rules with gaps
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 3, color: 'white' },
        },
        {
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 1, color: 'white' },
        },
        // Note: gaps on points 5, 3, and 1
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

      console.log('\n🕳️ === BEAR-OFF WITH GAPS SCENARIO ===')
      console.log('\nBoard State (note the gaps on points 5, 3, and 1):')
      console.log(ascii(board))
      console.log(`\n📊 Game Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  Checkers in home: 6 total`)
      console.log(`  Gap points: 5, 3, 1`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Move Kind: ${move.moveKind}`)
        console.log(`  Available Options: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
          let toPoint = !toPos ? 'OFF ⭐' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

          const moveType = !toPos ? '🏁 BEAR OFF' : '🔄 MOVE'
          console.log(`    ${pmIndex + 1}. ${moveType}: Point ${fromPoint} → ${toPoint}`)
        })
      })

      expect(play.stateKind).toBe('moving')
    })
  })

  describe('Blocked bear-off scenario', () => {
    test('should show bear-off when opponent blocks home points [5, 3]', () => {
      // Setup: Opponent has checkers blocking some home points
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
          position: { clockwise: 4, counterclockwise: 21 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
        },
        // Black checkers blocking points
        {
          position: { clockwise: 2, counterclockwise: 23 },
          checkers: { qty: 2, color: 'black' },
        },
        {
          position: { clockwise: 1, counterclockwise: 24 },
          checkers: { qty: 3, color: 'black' },
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
      rolledPlayer.dice.currentRoll = [5, 3]

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n🚫 === BLOCKED BEAR-OFF SCENARIO ===')
      console.log('\nBoard State (black checkers block points 1 & 2):')
      console.log(ascii(board))
      console.log(`\n⚔️ Battle Analysis:`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  White checkers: points 6(2), 5(3), 4(1), 3(1)`)
      console.log(`  Black blocks: points 2(2), 1(3) 🚫`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Move Type: ${move.moveKind}`)
        console.log(`  Strategic Options: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
          let toPoint = !toPos ? 'OFF ⭐' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

          const isBlocked = (toPoint === '1' || toPoint === '2') && toPos
          const moveIcon = !toPos ? '🏁' : isBlocked ? '❌' : '✅'

          console.log(`    ${pmIndex + 1}. ${moveIcon} Point ${fromPoint} → ${toPoint}`)
        })
      })

      expect(play.stateKind).toBe('moving')
    })
  })

  describe('Pip count optimization', () => {
    test('should show optimal bear-off moves for pip count [4, 2]', () => {
      // Setup: Scenario where pip count optimization matters
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
          checkers: { qty: 2, color: 'white' },
        },
        {
          position: { clockwise: 3, counterclockwise: 22 },
          checkers: { qty: 1, color: 'white' },
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

      const rollingPlayer = Player.initialize(
        'white',
        'clockwise',
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(rollingPlayer)
      rolledPlayer.dice.currentRoll = [4, 2]

      player = Player.toMoving(rolledPlayer)
      play = Play.initialize(board, player)

      console.log('\n📈 === PIP COUNT OPTIMIZATION SCENARIO ===')
      console.log('\nBoard State (distributed checkers for optimal play):')
      console.log(ascii(board))

      // Calculate pip count
      const pipCount = (1*6 + 1*5 + 2*4 + 1*3 + 2*2 + 1*1)
      console.log(`\n🧮 Pip Count Analysis:`)
      console.log(`  Current pip count: ${pipCount}`)
      console.log(`  Dice Roll: [${player.dice.currentRoll?.join(', ')}]`)
      console.log(`  Potential pip reduction: 4 + 2 = 6 pips`)

      const movesArray = Array.from(play.moves)
      movesArray.forEach((move, index) => {
        console.log(`\n🎲 Move ${index + 1} (Die: ${move.dieValue})`)
        console.log(`  Strategy Options: ${move.possibleMoves.length}`)

        move.possibleMoves.forEach((pm, pmIndex) => {
          const fromPos = (pm.origin as any).position
          const toPos = pm.destination ? (pm.destination as any).position : null

          let fromPoint = fromPos?.clockwise || fromPos?.counterclockwise || 'BAR'
          let toPoint = !toPos ? 'OFF' : (toPos?.clockwise || toPos?.counterclockwise || toPos)

          // Calculate pip impact
          const pipReduction = !toPos ? Number(fromPoint) : (Number(fromPoint) - Number(toPoint))
          const efficiencyIcon = pipReduction >= move.dieValue ? '⚡' : '📉'

          console.log(`    ${pmIndex + 1}. ${efficiencyIcon} Point ${fromPoint} → ${toPoint} (${pipReduction} pips)`)
        })
      })

      expect(play.stateKind).toBe('moving')
    })
  })
})