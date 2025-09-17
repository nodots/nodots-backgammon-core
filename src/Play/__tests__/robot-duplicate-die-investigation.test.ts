import { describe, it, expect } from '@jest/globals'
import { Play } from '../../Play'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Game } from '../../Game'
import {
  BackgammonMoveReady,
  BackgammonPlayMoving,
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonPlayResult,
  BackgammonGameMoving
} from '@nodots-llc/backgammon-types'

describe('Robot Duplicate Die Values Investigation', () => {
  it('should trace where [4,3] roll gets corrupted to duplicate [3,3] values', async () => {
    console.log('🔍 === INVESTIGATING ROBOT DUPLICATE DIE VALUES BUG ===')

    // Recreate the exact scenario from stuck robot game e334a7fb-72e6-424d-b481-8551093bdb7e
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checker on bar (needs to reenter)
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'black' }
      },
      // Some checkers on board for normal moves
      {
        position: { clockwise: 17, counterclockwise: 8 },
        checkers: { qty: 7, color: 'black' }
      },
      {
        position: { clockwise: 19, counterclockwise: 6 },
        checkers: { qty: 5, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black robot player with [4, 3] roll
    const player = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [4, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // 1. CHECKPOINT: Test Play.initialize - should create clean [3,4] moves
    console.log('\n📍 CHECKPOINT 1: Play.initialize()')
    const play = Play.initialize(board, movingPlayer)

    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    const initialDieValues = initialMoves.map(m => m.dieValue).sort()

    console.log('  Initial moves count:', initialMoves.length)
    console.log('  Initial die values:', initialDieValues)
    console.log('  Expected: [3, 4]')

    // This should pass if Play.initialize is working correctly
    expect(initialDieValues).toEqual([3, 4])

    // 2. CHECKPOINT: Test robot getBestMove selection
    console.log('\n📍 CHECKPOINT 2: Robot move selection (simulating Player.getBestMove)')
    const readyMoves = initialMoves.filter(m => m.stateKind === 'ready')
    console.log('  Ready moves count:', readyMoves.length)

    readyMoves.forEach((move, i) => {
      console.log(`  Ready Move ${i}: dieValue=${move.dieValue}, moveKind=${move.moveKind}, possibleMoves=${move.possibleMoves.length}`)
    })

    // Simulate robot selecting the first available move (fallback logic)
    const selectedMove = readyMoves[0]
    console.log('  Selected move dieValue:', selectedMove.dieValue)

    // 3. CHECKPOINT: Test direct Play.move execution
    console.log('\n📍 CHECKPOINT 3: Direct Play.move() execution')
    const origin = selectedMove.origin
    const directResult: BackgammonPlayResult = Play.move(play.board, play, origin)

    console.log('  Executed move dieValue:', directResult.move.dieValue)
    console.log('  Executed move state:', directResult.move.stateKind)

    const directPlay = directResult.play as BackgammonPlayMoving
    const directMoves = Array.from(directPlay.moves)

    console.log('  All moves after direct execution:')
    directMoves.forEach((move: any, i) => {
      console.log(`    Move ${i}: dieValue=${move.dieValue}, state=${move.stateKind}`)
    })

    const directDieValueCounts = directMoves.reduce((acc: any, move: any) => {
      acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
      return acc
    }, {})

    console.log('  Direct execution die value counts:', directDieValueCounts)

    // This should not have duplicates
    expect(directDieValueCounts[3]).toBe(1)
    expect(directDieValueCounts[4]).toBe(1)

    // 4. CHECKPOINT: Test Game.move execution (robot path)
    console.log('\n📍 CHECKPOINT 4: Game.move() execution (robot path)')

    // Create a full game context for robot execution
    const gameMoving = {
      stateKind: 'moving',
      activePlayer: movingPlayer,
      activePlay: play,
      board: board
    } as BackgammonGameMoving

    // Get checker ID from selected move (simulate robot logic)
    const checkerId = selectedMove.possibleMoves?.[0]?.origin?.checkers?.[0]?.id
    console.log('  Using checker ID:', checkerId)

    if (checkerId) {
      const gameResult = Game.move(gameMoving, checkerId)

      if (gameResult.stateKind === 'moving') {
        const gameMoves = Array.from(gameResult.activePlay.moves)

        console.log('  All moves after Game.move():')
        gameMoves.forEach((move: any, i) => {
          console.log(`    Move ${i}: dieValue=${move.dieValue}, state=${move.stateKind}`)
        })

        const gameDieValueCounts = gameMoves.reduce((acc: any, move: any) => {
          acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
          return acc
        }, {})

        console.log('  Game.move() die value counts:', gameDieValueCounts)

        // This is where we might see the corruption
        if (gameDieValueCounts[3] > 1 || gameDieValueCounts[4] > 1) {
          console.log('🚨 CORRUPTION DETECTED in Game.move()!')
          console.log('  Expected: { 3: 1, 4: 1 }')
          console.log('  Actual:', gameDieValueCounts)
        }
      }
    }

    console.log('\n✅ Investigation complete - check output for corruption points')
  })

  it('should reproduce the exact stuck robot scenario', async () => {
    console.log('\n🤖 === REPRODUCING EXACT STUCK ROBOT SCENARIO ===')

    // Try to reproduce the exact conditions that lead to the stuck state
    // This test focuses on multiple move execution like a real robot turn

    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: 'bar',
        direction: 'counterclockwise',
        checkers: { qty: 1, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)
    const player = Player.initialize('black', 'counterclockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [4, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Create full game context
    let currentGame = {
      stateKind: 'moving',
      activePlayer: movingPlayer,
      activePlay: Play.initialize(board, movingPlayer),
      board: board
    } as BackgammonGameMoving

    console.log('Starting robot execution simulation...')

    let moveCount = 0
    const maxMoves = 5 // Safety limit

    while (currentGame.stateKind === 'moving' && moveCount < maxMoves) {
      const readyMoves = Array.from(currentGame.activePlay.moves).filter(
        (m: any) => m.stateKind === 'ready'
      )

      if (readyMoves.length === 0) {
        console.log('No more ready moves available')
        break
      }

      console.log(`\nMove ${moveCount + 1}:`)
      console.log('  Available die values:', readyMoves.map((m: any) => m.dieValue))

      // Simulate robot selecting first available move
      const selectedMove = readyMoves[0] as any
      const checkerId = selectedMove.possibleMoves?.[0]?.origin?.checkers?.[0]?.id

      if (!checkerId) {
        console.log('  No valid checker found, breaking')
        break
      }

      console.log('  Executing move with dieValue:', selectedMove.dieValue)

      try {
        const moveResult = Game.move(currentGame, checkerId)
        currentGame = moveResult as BackgammonGameMoving
        moveCount++

        // Check for corruption after each move
        if (currentGame.stateKind === 'moving') {
          const allMoves = Array.from(currentGame.activePlay.moves)
          const dieValueCounts = allMoves.reduce((acc: any, move: any) => {
            acc[move.dieValue] = (acc[move.dieValue] || 0) + 1
            return acc
          }, {})

          console.log('  Die value counts after move:', dieValueCounts)

          if (dieValueCounts[3] > 1 && dieValueCounts[4] === undefined) {
            console.log('🚨 FOUND THE BUG! Both moves have dieValue: 3')
            console.log('  This explains why robots get stuck!')
            break
          }
        }

      } catch (error) {
        console.log('  Move execution failed:', error)
        break
      }
    }

    console.log('\n🔍 Final game state:')
    if (currentGame.stateKind === 'moving') {
      const finalMoves = Array.from(currentGame.activePlay.moves)
      finalMoves.forEach((move: any, i) => {
        console.log(`  Final Move ${i}: dieValue=${move.dieValue}, state=${move.stateKind}`)
      })
    }
  })
})