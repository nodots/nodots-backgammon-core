#!/usr/bin/env node

/**
 * Test Robot Automation Fixes
 * 
 * This script tests the fixes for robot automation to ensure:
 * 1. Robots can make moves properly
 * 2. Games complete without hitting turn limits
 * 3. No excessive "no legal moves" situations
 */

const { Game } = require('../src/Game')
const { Robot } = require('../src/Robot')
const { Board } = require('../src/Board')
const { Player } = require('../src/Player')

async function testRobotAutomation() {
  console.log('🤖 Testing Robot Automation Fixes...\n')

  // Create a simple game with two robot players
  const whitePlayer = {
    id: 'white-robot',
    name: 'White Robot',
    color: 'white',
    direction: 'clockwise',
    isRobot: true,
    stateKind: 'rolling',
    dice: { currentRoll: null }
  }

  const blackPlayer = {
    id: 'black-robot', 
    name: 'Black Robot',
    color: 'black',
    direction: 'counterclockwise',
    isRobot: true,
    stateKind: 'inactive',
    dice: { currentRoll: null }
  }

  const board = Board.initialize()
  const game = Game.create(whitePlayer, blackPlayer, board)

  console.log('✅ Game created successfully')
  console.log(`Game ID: ${game.id}`)
  console.log(`Initial state: ${game.stateKind}`)

  let turnCount = 0
  const maxTurns = 50 // Reduced from 100 to catch issues faster

  while (turnCount < maxTurns) {
    turnCount++
    console.log(`\n🔄 Turn ${turnCount}`)
    console.log(`Active player: ${game.activeColor} (${game.activePlayer?.name})`)
    console.log(`Game state: ${game.stateKind}`)

    try {
      // Process the robot turn
      const result = await Game.processRobotTurn(game, 'beginner')
      
      if (!result.success) {
        console.log(`❌ Robot turn failed: ${result.error}`)
        break
      }

      if (result.game) {
        game = result.game
        console.log(`✅ Robot made move: ${result.message}`)
        
        // Check for game completion
        if (game.stateKind === 'completed') {
          console.log(`\n🎉 Game completed! Winner: ${game.winner}`)
          console.log(`Total turns: ${turnCount}`)
          return { success: true, turns: turnCount, winner: game.winner }
        }
      }

    } catch (error) {
      console.log(`❌ Error during turn ${turnCount}: ${error.message}`)
      break
    }
  }

  if (turnCount >= maxTurns) {
    console.log(`\n⚠️ Game hit turn limit (${maxTurns}) - automation may still have issues`)
    return { success: false, turns: turnCount, error: 'Turn limit reached' }
  }

  return { success: false, turns: turnCount, error: 'Game failed to complete' }
}

// Run the test
if (require.main === module) {
  testRobotAutomation()
    .then(result => {
      console.log('\n📊 Test Results:')
      console.log(`Success: ${result.success}`)
      console.log(`Turns: ${result.turns}`)
      if (result.winner) console.log(`Winner: ${result.winner}`)
      if (result.error) console.log(`Error: ${result.error}`)
      
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testRobotAutomation }
