#!/usr/bin/env node

const { Game, Player, Robot } = require('../dist/index.js')

async function testRobotAutomation() {
  console.log('🤖 Testing Robot Automation After Rolling Dice...\n')

  try {
    // Create a robot vs robot game
    const robotPlayer1 = Player.initialize(
      'white',
      'clockwise',
      undefined,
      'robot1',
      'inactive',
      true
    )
    const robotPlayer2 = Player.initialize(
      'black',
      'counterclockwise',
      undefined,
      'robot2',
      'inactive',
      true
    )

    console.log('1. Creating game with two robots...')
    let game = Game.initialize([robotPlayer1, robotPlayer2])
    console.log(`   Initial state: ${game.stateKind}`)

    console.log('\n2. Rolling for start...')
    game = Game.rollForStart(game)
    console.log(`   After roll for start: ${game.stateKind}`)
    console.log(
      `   Active player: ${game.activePlayer?.color} (robot: ${game.activePlayer?.isRobot})`
    )

    if (game.stateKind === 'rolled') {
      console.log(
        `   Dice roll: [${
          game.activePlayer?.dice?.currentRoll?.join(', ') || 'N/A'
        }]`
      )

      console.log('\n3. Testing robot automation...')

      // Test the new advanceRobotToMoving method
      console.log('   Calling Game.advanceRobotToMoving()...')
      const movingGame = Game.advanceRobotToMoving(game)
      console.log(`   After auto-advance: ${movingGame.stateKind}`)

      if (movingGame.stateKind === 'moving') {
        console.log('   ✅ Robot successfully advanced to moving state!')

        console.log('\n4. Testing robot move execution...')
        const robotResult = await Robot.makeOptimalMove(movingGame, 'beginner')

        if (robotResult.success) {
          console.log('   ✅ Robot successfully made optimal move!')
          console.log(`   Final game state: ${robotResult.game?.stateKind}`)
          console.log(`   Message: ${robotResult.message}`)
        } else {
          console.log('   ❌ Robot move failed:', robotResult.error)
        }
      } else {
        console.log('   ❌ Robot did not advance to moving state')
      }
    } else if (game.stateKind === 'moving') {
      console.log('   ✅ Robot automatically advanced to moving state!')

      console.log('\n3. Testing robot move execution...')
      const robotResult = await Robot.makeOptimalMove(game, 'beginner')

      if (robotResult.success) {
        console.log('   ✅ Robot successfully made optimal move!')
        console.log(`   Final game state: ${robotResult.game?.stateKind}`)
        console.log(`   Message: ${robotResult.message}`)
      } else {
        console.log('   ❌ Robot move failed:', robotResult.error)
      }
    } else {
      console.log(
        `   ⚠️  Unexpected state after roll for start: ${game.stateKind}`
      )
    }

    console.log('\n🎉 Robot automation test completed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testRobotAutomation()
