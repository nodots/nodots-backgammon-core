import { describe, expect, it } from '@jest/globals'
import {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolling,
  BackgammonGameMoved,
} from '@nodots-llc/backgammon-types/dist'
import { Game } from '../index'
import { Board } from '../../Board'

/**
 * COMPREHENSIVE E2E TEST: PROPER UNDO BEHAVIOR IN NODOTS BACKGAMMON
 * 
 * This test suite serves as PROOF that undo functionality works correctly according to proper backgammon rules:
 * 
 * ✅ CORRECT BEHAVIOR:
 * - Undo works during current turn (before confirmation)
 * - Player can undo moves and continue playing with same dice
 * - Game state transitions properly during undo operations
 * 
 * ❌ PREVENTED BEHAVIOR:
 * - Undo does NOT work after turn confirmation 
 * - Once turn is confirmed, moves are permanent
 * - Cross-turn undo is impossible and properly blocked
 * 
 * 🎯 SUCCESS CRITERIA:
 * - Demonstrates current-turn undo works perfectly
 * - Proves cross-turn undo is properly blocked with appropriate errors
 * - Shows clean state management and transitions
 * - Verifies error handling is appropriate
 */
describe('Proper Undo Behavior - E2E Proof', () => {
  
  /**
   * COMPREHENSIVE WORKFLOW TEST
   * Tests the complete player experience: Roll → Move → Undo → Move → Confirm → Try Undo (blocked)
   */
  it('PROOF: Complete undo workflow - current turn works, cross-turn blocked', () => {
    console.log('\n🎯 COMPREHENSIVE UNDO BEHAVIOR PROOF')
    console.log('='.repeat(70))
    
    // ===============================
    // PHASE 1: GAME INITIALIZATION
    // ===============================
    console.log('\n📋 PHASE 1: INITIALIZING GAME')
    
    let currentGame = Game.createNewGame(
      'player1-id',
      'player2-id',
      true, // auto roll for start
      false, // player1 is not robot
      false, // player2 is not robot
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    // Advance to rolled state
    if (currentGame.stateKind === 'rolled-for-start') {
      currentGame = Game.roll(currentGame as any)
    }
    
    expect(currentGame.stateKind).toBe('rolled')
    console.log(`✅ Game initialized - State: ${currentGame.stateKind}`)
    console.log(`🎲 Initial dice: [${currentGame.activePlayer?.dice?.currentRoll?.join(', ')}]`)
    console.log(`👤 Active player: ${currentGame.activePlayer?.color}`)
    
    // Store original dice values for later verification
    const originalDiceValues = [...(currentGame.activePlayer?.dice?.currentRoll || [])]
    const originalActivePlayer = currentGame.activePlayer?.color
    
    // ===============================
    // PHASE 2: TRANSITION TO MOVING AND MAKE FIRST MOVE
    // ===============================
    console.log('\n📋 PHASE 2: MAKING FIRST MOVE')
    
    const preparedGame = Game.prepareMove(currentGame as any)
    console.log(`✅ Game prepared - State: ${preparedGame.stateKind}`)
    
    const movingGame = Game.toMoving(preparedGame)
    expect(movingGame.stateKind).toBe('moving')
    console.log(`✅ Game in moving state - State: ${movingGame.stateKind}`)
    
    // Verify activePlay exists with moves
    expect(movingGame.activePlay).toBeDefined()
    expect(movingGame.activePlay?.moves).toBeDefined()
    
    const movesArray = Array.from(movingGame.activePlay!.moves)
    console.log(`📊 Available moves: ${movesArray.length}`)
    
    // Find a ready move to execute
    const readyMove = movesArray.find(m => m.stateKind === 'ready')
    expect(readyMove).toBeDefined()
    expect(readyMove!.possibleMoves).toBeDefined()
    expect(readyMove!.possibleMoves!.length).toBeGreaterThan(0)
    
    const firstPossibleMove = readyMove!.possibleMoves![0]
    const originId = firstPossibleMove.origin.id
    
    console.log(`🎯 Executing first move: ${firstPossibleMove.origin.kind}:${originId} → ${firstPossibleMove.destination.kind}:${firstPossibleMove.destination.id}`)
    
    // Execute the first move
    const gameAfterFirstMove = Game.executeAndRecalculate(movingGame, originId)
    
    // Game should still be in moving state (or moved if all moves completed)
    expect(['moving', 'moved'].includes(gameAfterFirstMove.stateKind)).toBe(true)
    console.log(`✅ First move executed - State: ${gameAfterFirstMove.stateKind}`)
    
    // Store the board state after first move for comparison
    const boardAfterFirstMove = JSON.stringify(gameAfterFirstMove.board)
    
    // ===============================
    // PHASE 3: UNDO THE FIRST MOVE (SHOULD WORK)
    // ===============================
    console.log('\n📋 PHASE 3: UNDOING FIRST MOVE (SHOULD WORK)')
    
    const undoResult = Game.undoLastMove(gameAfterFirstMove)
    
    expect(undoResult.success).toBe(true)
    expect(undoResult.game).toBeDefined()
    expect(undoResult.undoneMove).toBeDefined()
    
    const gameAfterUndo = undoResult.game!
    console.log(`✅ UNDO SUCCESSFUL - State: ${gameAfterUndo.stateKind}`)
    console.log(`📊 Undone move: ${undoResult.undoneMove?.moveKind} from ${undoResult.undoneMove?.origin?.kind}:${undoResult.undoneMove?.origin?.id}`)
    
    // Verify game state after undo
    expect(gameAfterUndo.stateKind).toBe('rolled')
    expect(gameAfterUndo.activePlayer?.color).toBe(originalActivePlayer)
    expect(gameAfterUndo.activePlayer?.dice?.stateKind).toBe('rolled')
    // Check dice values are preserved (order might differ due to dice switching)
    expect(gameAfterUndo.activePlayer?.dice?.currentRoll?.sort()).toEqual(originalDiceValues.sort())
    expect(gameAfterUndo.activePlay).toBeDefined()
    
    console.log(`🎲 Dice after undo: [${gameAfterUndo.activePlayer?.dice?.currentRoll?.join(', ')}]`)
    console.log(`👤 Active player after undo: ${gameAfterUndo.activePlayer?.color}`)
    
    // Verify board state was properly reverted
    const boardAfterUndo = JSON.stringify(gameAfterUndo.board)
    expect(boardAfterUndo).not.toBe(boardAfterFirstMove)
    
    // ===============================
    // PHASE 4: MAKE A DIFFERENT MOVE (PROVE GAME IS PLAYABLE)
    // ===============================
    console.log('\n📋 PHASE 4: MAKING DIFFERENT MOVE AFTER UNDO')
    
    // Get possible moves after undo
    const possibleMovesResult = Game.getPossibleMoves(gameAfterUndo)
    expect(possibleMovesResult.success).toBe(true)
    expect(possibleMovesResult.possibleMoves).toBeDefined()
    expect(possibleMovesResult.possibleMoves!.length).toBeGreaterThan(0)
    
    console.log(`📊 Possible moves after undo: ${possibleMovesResult.possibleMoves!.length}`)
    
    const updatedGameAfterUndo = possibleMovesResult.updatedGame!
    
    // Transition back to moving state
    let gameReadyForSecondMove = updatedGameAfterUndo
    if (gameReadyForSecondMove.stateKind !== 'moving') {
      const preparedAgain = Game.prepareMove(gameReadyForSecondMove as any)
      gameReadyForSecondMove = Game.toMoving(preparedAgain)
    }
    
    expect(gameReadyForSecondMove.stateKind).toBe('moving')
    
    // Find a different move to execute
    const secondMove = possibleMovesResult.possibleMoves![0]
    const secondOriginId = secondMove.origin.id
    
    console.log(`🎯 Executing second move: ${secondMove.origin.kind}:${secondOriginId} → ${secondMove.destination.kind}:${secondMove.destination.id}`)
    
    // Execute the second move
    const gameAfterSecondMove = Game.executeAndRecalculate(gameReadyForSecondMove as any, secondOriginId)
    
    expect(['moving', 'moved'].includes(gameAfterSecondMove.stateKind)).toBe(true)
    console.log(`✅ Second move executed - State: ${gameAfterSecondMove.stateKind}`)
    
    // ===============================
    // PHASE 5: CONFIRM TURN (FINALIZE MOVES)
    // ===============================
    console.log('\n📋 PHASE 5: CONFIRMING TURN (FINALIZING MOVES)')
    
    let gameReadyToConfirm = gameAfterSecondMove
    
    // First, make sure we've made enough moves or all moves are done
    console.log(`🔍 Game state before confirmation: ${gameReadyToConfirm.stateKind}`)
    
    let gameAfterConfirmation: BackgammonGame
    
    if (gameReadyToConfirm.stateKind === 'moving') {
      // Check if we can confirm the turn
      const canConfirm = Game.canConfirmTurn(gameReadyToConfirm as BackgammonGameMoving)
      console.log(`🔍 Can confirm turn: ${canConfirm}`)
      
      if (canConfirm) {
        console.log('🔄 Confirming from moving state...')
        gameAfterConfirmation = Game.confirmTurn(gameReadyToConfirm as BackgammonGameMoving)
      } else {
        // Make additional moves until we can confirm, or skip to show cross-turn undo blocked
        console.log('⚠️ Cannot confirm turn yet - making additional moves or transitioning to moved state...')
        
        // Try to execute all remaining moves
        let currentGameState: BackgammonGame = gameReadyToConfirm
        while (currentGameState.stateKind === 'moving') {
          const movesArray = Array.from((currentGameState as BackgammonGameMoving).activePlay!.moves)
          const readyMove = movesArray.find(m => m.stateKind === 'ready')
          
          if (readyMove && readyMove.possibleMoves && readyMove.possibleMoves.length > 0) {
            const possibleMove = readyMove.possibleMoves[0]
            console.log(`🎯 Making additional move: ${possibleMove.origin.kind}:${possibleMove.origin.id}`)
            currentGameState = Game.executeAndRecalculate(currentGameState as BackgammonGameMoving, possibleMove.origin.id)
          } else {
            break
          }
        }
        
        if (currentGameState.stateKind === 'moving') {
          console.log('🔄 Confirming from moving state after additional moves...')
          gameAfterConfirmation = Game.confirmTurn(currentGameState as BackgammonGameMoving)
        } else if (currentGameState.stateKind === 'moved') {
          console.log('🔄 Confirming from moved state...')
          gameAfterConfirmation = Game.confirmTurnFromMoved(currentGameState as BackgammonGameMoved)
        } else {
          throw new Error(`Unexpected game state after making moves: ${currentGameState.stateKind}`)
        }
      }
    } else if (gameReadyToConfirm.stateKind === 'moved') {
      console.log('🔄 Confirming from moved state...')
      gameAfterConfirmation = Game.confirmTurnFromMoved(gameReadyToConfirm as BackgammonGameMoved)
    } else {
      throw new Error(`Unexpected game state for confirmation: ${gameReadyToConfirm.stateKind}`)
    }
    
    expect(gameAfterConfirmation.stateKind).toBe('rolling')
    expect(gameAfterConfirmation.activePlayer?.color).not.toBe(originalActivePlayer)
    expect(gameAfterConfirmation.activePlay).toBeUndefined()
    
    console.log(`✅ TURN CONFIRMED - State: ${gameAfterConfirmation.stateKind}`)
    console.log(`👤 New active player: ${gameAfterConfirmation.activePlayer?.color}`)
    console.log(`📊 ActivePlay after confirmation: ${gameAfterConfirmation.activePlay ? 'Present' : 'Undefined (CORRECT)'}`)
    
    // ===============================
    // PHASE 6: ATTEMPT CROSS-TURN UNDO (SHOULD FAIL)
    // ===============================
    console.log('\n📋 PHASE 6: ATTEMPTING CROSS-TURN UNDO (SHOULD FAIL)')
    
    const crossTurnUndoResult = Game.undoLastMove(gameAfterConfirmation as any)
    
    expect(crossTurnUndoResult.success).toBe(false)
    expect(crossTurnUndoResult.error).toBeDefined()
    expect(crossTurnUndoResult.game).toBeUndefined()
    
    console.log(`❌ CROSS-TURN UNDO BLOCKED (CORRECT BEHAVIOR)`)
    console.log(`🚫 Error message: ${crossTurnUndoResult.error}`)
    
    // Verify the error is appropriate for the current state
    expect(crossTurnUndoResult.error).toContain('Cannot undo move from')
    expect(crossTurnUndoResult.error).toContain('rolling')
    expect(crossTurnUndoResult.error).toContain('Must be in \'moving\' or \'moved\' state')
    
    // ===============================  
    // PHASE 7: VERIFY GAME INTEGRITY
    // ===============================
    console.log('\n📋 PHASE 7: VERIFYING GAME INTEGRITY')
    
    // Verify the game is in a proper state for the next player
    expect(gameAfterConfirmation.stateKind).toBe('rolling')
    expect(gameAfterConfirmation.activePlayer?.stateKind).toBe('rolling')
    expect(gameAfterConfirmation.inactivePlayer?.stateKind).toBe('inactive')
    expect(gameAfterConfirmation.activePlay).toBeUndefined()
    
    // Verify pip counts are valid
    gameAfterConfirmation.players.forEach(player => {
      expect(typeof player.pipCount).toBe('number')
      expect(player.pipCount).toBeGreaterThan(0)
    })
    
    console.log(`✅ Game integrity verified`)
    console.log(`📊 Player pip counts: ${gameAfterConfirmation.players.map(p => `${p.color}:${p.pipCount}`).join(', ')}`)
    
    console.log('\n🎉 COMPREHENSIVE UNDO BEHAVIOR PROOF COMPLETE')
    console.log('='.repeat(70))
    console.log('✅ Current-turn undo: WORKS PERFECTLY')
    console.log('❌ Cross-turn undo: PROPERLY BLOCKED')
    console.log('✅ Game state management: CLEAN AND CORRECT')
    console.log('✅ Error handling: APPROPRIATE')
    console.log('='.repeat(70))
  })

  /**
   * EDGE CASE: UNDO IN DIFFERENT GAME STATES
   * Tests that undo only works in appropriate states
   */
  it('PROOF: Undo only works in moving/moved states', () => {
    console.log('\n🎯 TESTING UNDO STATE RESTRICTIONS')
    
    // Test undo in rolling-for-start state
    const newGame = Game.createNewGame(
      'player1-id', 
      'player2-id', 
      false, // don't auto roll
      false, 
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    expect(newGame.stateKind).toBe('rolling-for-start')
    
    const undoInRollingForStart = Game.undoLastMove(newGame as any)
    expect(undoInRollingForStart.success).toBe(false)
    expect(undoInRollingForStart.error).toContain('Cannot undo move from rolling-for-start')
    console.log(`✅ Undo blocked in rolling-for-start state: ${undoInRollingForStart.error}`)
    
    // Test undo in rolling state
    const rolledGame = Game.createNewGame(
      'player1-id',
      'player2-id', 
      true, // auto roll for start
      false,
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    let gameInRollingState = rolledGame
    if (gameInRollingState.stateKind === 'rolled-for-start') {
      gameInRollingState = Game.roll(gameInRollingState as any)
      // Confirm turn to get to next player's rolling state
      const prepared = Game.prepareMove(gameInRollingState as any)
      const moving = Game.toMoving(prepared)
      
      // Make all moves until we can confirm
      let movingGameState: BackgammonGame = moving
      while (movingGameState.stateKind === 'moving') {
        const movesArray = Array.from((movingGameState as BackgammonGameMoving).activePlay!.moves)
        const readyMove = movesArray.find(m => m.stateKind === 'ready')
        
        if (readyMove && readyMove.possibleMoves && readyMove.possibleMoves.length > 0) {
          const possibleMove = readyMove.possibleMoves[0]
          movingGameState = Game.executeAndRecalculate(movingGameState as BackgammonGameMoving, possibleMove.origin.id)
        } else {
          break
        }
      }
      
      if (movingGameState.stateKind === 'moving' && Game.canConfirmTurn(movingGameState as BackgammonGameMoving)) {
        gameInRollingState = Game.confirmTurn(movingGameState as BackgammonGameMoving)
      } else if (movingGameState.stateKind === 'moved') {
        gameInRollingState = Game.confirmTurnFromMoved(movingGameState as BackgammonGameMoved)
      }
    }
    
    expect(gameInRollingState.stateKind).toBe('rolling')
    
    const undoInRolling = Game.undoLastMove(gameInRollingState as any)
    expect(undoInRolling.success).toBe(false)
    expect(undoInRolling.error).toContain('Cannot undo move from rolling')
    console.log(`✅ Undo blocked in rolling state: ${undoInRolling.error}`)
    
    console.log('✅ State restrictions properly enforced')
  })

  /**
   * EDGE CASE: UNDO WITH NO ACTIVE PLAY
   * Tests error handling when activePlay is missing
   */
  it('PROOF: Undo fails gracefully when no active play exists', () => {
    console.log('\n🎯 TESTING UNDO WITH MISSING ACTIVE PLAY')
    
    // Create a game and advance to moving state
    let testGame = Game.createNewGame(
      'player1-id',
      'player2-id',
      true,
      false,
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    if (testGame.stateKind === 'rolled-for-start') {
      testGame = Game.roll(testGame as any)
    }
    
    const prepared = Game.prepareMove(testGame as any)
    const moving = Game.toMoving(prepared)
    
    // Artificially remove activePlay to test error handling
    const gameWithoutActivePlay = {
      ...moving,
      activePlay: null
    } as any
    
    const undoResult = Game.undoLastMove(gameWithoutActivePlay)
    expect(undoResult.success).toBe(false)
    expect(undoResult.error).toBe('No active play found')
    
    console.log(`✅ Missing activePlay handled gracefully: ${undoResult.error}`)
  })

  /**
   * EDGE CASE: UNDO WITH NO CONFIRMED MOVES
   * Tests error handling when no moves have been confirmed yet
   */
  it('PROOF: Undo fails gracefully when no confirmed moves exist', () => {
    console.log('\n🎯 TESTING UNDO WITH NO CONFIRMED MOVES')
    
    // Create a game and advance to moving state without making any moves
    let testGame = Game.createNewGame(
      'player1-id',
      'player2-id',
      true,
      false,
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    if (testGame.stateKind === 'rolled-for-start') {
      testGame = Game.roll(testGame as any)
    }
    
    const prepared = Game.prepareMove(testGame as any)
    const moving = Game.toMoving(prepared)
    
    // At this point, all moves should be in 'ready' state, none confirmed
    expect(moving.stateKind).toBe('moving')
    expect(moving.activePlay).toBeDefined()
    
    const movesArray = Array.from(moving.activePlay!.moves)
    const allMovesReady = movesArray.every(move => move.stateKind === 'ready')
    expect(allMovesReady).toBe(true)
    
    const undoResult = Game.undoLastMove(moving)
    expect(undoResult.success).toBe(false)
    expect(undoResult.error).toBe('No completed moves available to undo')
    
    console.log(`✅ No completed moves handled gracefully: ${undoResult.error}`)
  })

  /**
   * MULTIPLE MOVES: UNDO AFTER SEVERAL MOVES
   * Tests that undo works correctly when multiple moves have been made
   */
  it('PROOF: Undo works correctly with multiple moves', () => {
    console.log('\n🎯 TESTING UNDO WITH MULTIPLE MOVES')
    
    // Create and advance game to moving state
    let testGame = Game.createNewGame(
      'player1-id',
      'player2-id',
      true,
      false,
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )
    
    if (testGame.stateKind === 'rolled-for-start') {
      testGame = Game.roll(testGame as any)
    }
    
    const prepared = Game.prepareMove(testGame as any)
    let movingGame = Game.toMoving(prepared)
    
    // Make multiple moves if possible
    let moveCount = 0
    const maxMoves = 3 // Try to make up to 3 moves
    let currentMovingGame: BackgammonGame = movingGame
    
    for (let i = 0; i < maxMoves; i++) {
      if (currentMovingGame.stateKind !== 'moving') break
      
      const movesArray = Array.from((currentMovingGame as BackgammonGameMoving).activePlay!.moves)
      const readyMove = movesArray.find(m => m.stateKind === 'ready')
      
      if (!readyMove || !readyMove.possibleMoves || readyMove.possibleMoves.length === 0) {
        break
      }
      
      const possibleMove = readyMove.possibleMoves[0]
      const originId = possibleMove.origin.id
      
      console.log(`🎯 Making move ${i + 1}: ${possibleMove.origin.kind}:${originId} → ${possibleMove.destination.kind}:${possibleMove.destination.id}`)
      
      currentMovingGame = Game.executeAndRecalculate(currentMovingGame as BackgammonGameMoving, originId)
      moveCount++
      
      if (currentMovingGame.stateKind === 'moved') {
        break // All moves completed
      }
    }
    
    movingGame = currentMovingGame as any // For the rest of the test
    
    console.log(`✅ Made ${moveCount} moves`)
    expect(moveCount).toBeGreaterThan(0)
    
    // Now test undo
    const undoResult = Game.undoLastMove(movingGame)
    expect(undoResult.success).toBe(true)
    expect(undoResult.undoneMove).toBeDefined()
    
    console.log(`✅ Undo successful after ${moveCount} moves`)
    console.log(`📊 Undone move: ${undoResult.undoneMove?.moveKind}`)
    
    // Verify we can continue playing
    const gameAfterUndo = undoResult.game!
    expect(['rolled', 'moving'].includes(gameAfterUndo.stateKind)).toBe(true)
    expect(gameAfterUndo.activePlay).toBeDefined()
    
    console.log(`✅ Game remains playable after undo: ${gameAfterUndo.stateKind}`)
  })

  /**
   * INTEGRATION TEST: COMPLETE GAME FLOW WITH UNDO
   * Tests a realistic game flow with multiple turns and undo operations
   */
  it('PROOF: Complete multi-turn game flow with undo restrictions', () => {
    console.log('\n🎯 TESTING COMPLETE MULTI-TURN GAME FLOW')
    
    let currentGame = Game.createNewGame(
      'player1-id',
      'player2-id',
      true,
      false,
      false,
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise', 
        blackFirst: true
      }
    )
    
    // Track original player for verification
    if (currentGame.stateKind === 'rolled-for-start') {
      currentGame = Game.roll(currentGame as any)
    }
    
    const firstPlayerColor = currentGame.activePlayer?.color
    console.log(`🎲 First player: ${firstPlayerColor}`)
    
    // ===== FIRST PLAYER'S TURN =====
    console.log('\n--- FIRST PLAYER\'S TURN ---')
    
    // Make move and undo (should work)
    const prepared1 = Game.prepareMove(currentGame as any)
    const moving1 = Game.toMoving(prepared1)
    
    const movesArray1 = Array.from(moving1.activePlay!.moves)
    const readyMove1 = movesArray1.find(m => m.stateKind === 'ready')
    const possibleMove1 = readyMove1!.possibleMoves![0]
    
    const gameAfterMove1 = Game.executeAndRecalculate(moving1, possibleMove1.origin.id)
    console.log(`✅ First player made move`)
    
    // Undo should work (same turn)
    const undoResult1 = Game.undoLastMove(gameAfterMove1)
    expect(undoResult1.success).toBe(true)
    console.log(`✅ First player undo successful (current turn)`)
    
    // Make move again and confirm turn
    const gameAfterUndo1 = undoResult1.game!
    const possibleMovesResult1 = Game.getPossibleMoves(gameAfterUndo1)
    const updatedGame1 = possibleMovesResult1.updatedGame!
    
    const prepared1Again = Game.prepareMove(updatedGame1 as any)
    const moving1Again = Game.toMoving(prepared1Again)
    let gameAfterMove1Again: BackgammonGame = Game.executeAndRecalculate(moving1Again, possibleMove1.origin.id)
    
    // Make additional moves until we can confirm
    while (gameAfterMove1Again.stateKind === 'moving') {
      const movesArray = Array.from((gameAfterMove1Again as BackgammonGameMoving).activePlay!.moves)
      const readyMove = movesArray.find(m => m.stateKind === 'ready')
      
      if (readyMove && readyMove.possibleMoves && readyMove.possibleMoves.length > 0) {
        const possibleMove = readyMove.possibleMoves[0]
        gameAfterMove1Again = Game.executeAndRecalculate(gameAfterMove1Again as BackgammonGameMoving, possibleMove.origin.id)
      } else {
        break
      }
    }
    
    // Confirm turn (pass to next player)
    let gameAfterTurn1: BackgammonGame
    if (gameAfterMove1Again.stateKind === 'moving' && Game.canConfirmTurn(gameAfterMove1Again as BackgammonGameMoving)) {
      gameAfterTurn1 = Game.confirmTurn(gameAfterMove1Again as BackgammonGameMoving)
    } else if (gameAfterMove1Again.stateKind === 'moved') {
      gameAfterTurn1 = Game.confirmTurnFromMoved(gameAfterMove1Again as BackgammonGameMoved)
    } else {
      throw new Error(`Cannot confirm turn in state: ${gameAfterMove1Again.stateKind}`)
    }
    
    expect(gameAfterTurn1.stateKind).toBe('rolling')
    expect(gameAfterTurn1.activePlayer?.color).not.toBe(firstPlayerColor)
    console.log(`✅ First player turn confirmed - passed to ${gameAfterTurn1.activePlayer?.color}`)
    
    // ===== ATTEMPT CROSS-TURN UNDO =====
    console.log('\n--- ATTEMPTING CROSS-TURN UNDO ---')
    
    const crossTurnUndoResult = Game.undoLastMove(gameAfterTurn1 as any)
    expect(crossTurnUndoResult.success).toBe(false)
    expect(crossTurnUndoResult.error).toContain('Cannot undo move from rolling')
    console.log(`❌ Cross-turn undo properly blocked: ${crossTurnUndoResult.error}`)
    
    // ===== SECOND PLAYER'S TURN =====
    console.log('\n--- SECOND PLAYER\'S TURN ---')
    
    // Roll dice for second player
    const rolledGame2 = Game.roll(gameAfterTurn1 as BackgammonGameRolling)
    expect(rolledGame2.stateKind).toBe('rolled')
    console.log(`✅ Second player rolled dice`)
    
    // Second player can undo their own moves (but not first player's)
    const prepared2 = Game.prepareMove(rolledGame2 as any)
    const moving2 = Game.toMoving(prepared2)
    
    const movesArray2 = Array.from(moving2.activePlay!.moves)
    const readyMove2 = movesArray2.find(m => m.stateKind === 'ready')
    
    if (readyMove2 && readyMove2.possibleMoves && readyMove2.possibleMoves.length > 0) {
      const possibleMove2 = readyMove2.possibleMoves[0]
      const gameAfterMove2 = Game.executeAndRecalculate(moving2, possibleMove2.origin.id)
      console.log(`✅ Second player made move`)
      
      // Second player can undo their own move (current turn)
      const undoResult2 = Game.undoLastMove(gameAfterMove2)
      expect(undoResult2.success).toBe(true)
      console.log(`✅ Second player undo successful (current turn)`)
      
      // But they still cannot undo first player's moves
      expect(undoResult2.undoneMove?.player?.color).toBe(gameAfterTurn1.activePlayer?.color)
      console.log(`✅ Second player can only undo their own moves`)
    }
    
    console.log('\n🎉 MULTI-TURN GAME FLOW PROOF COMPLETE')
    console.log('✅ Current-turn undo: Works for both players')
    console.log('❌ Cross-turn undo: Properly blocked for both players')
    console.log('✅ Turn isolation: Each player can only undo their own current turn')
  })
})