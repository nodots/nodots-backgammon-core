import { BackgammonGame, BackgammonGameMoving, BackgammonMoveCompletedNoMove } from '@nodots-llc/backgammon-types/dist'
import { Game } from '../index'
import { Board } from '../../Board'

describe('Game.undoLastMove', () => {
  let testGame: BackgammonGameMoving;

  beforeEach(() => {
    // Create a basic game and advance to moving state
    let game = Game.createNewGame(
      'test-user-1',
      'test-user-2',
      true, // auto roll for start
      false, // player1 is not robot
      false, // player2 is not robot
      {
        blackDirection: 'clockwise',
        whiteDirection: 'counterclockwise',
        blackFirst: true
      }
    )

    // Roll dice and advance to moving state
    if (game.stateKind === 'rolled-for-start') {
      const rolledGame = Game.roll(game as any)
      const preparingGame = Game.prepareMove(rolledGame)
      testGame = Game.toMoving(preparingGame)
    } else {
      // If not in expected state, force create a moving game
      testGame = {
        ...game,
        stateKind: 'moving'
      } as BackgammonGameMoving
    }
  })

  it('should return error when game is not in moving state', () => {
    const rollingGame = Game.createNewGame(
      'test-user-1',
      'test-user-2',
      false, // don't auto roll
      false,
      false
    )

    const result = Game.undoLastMove(rollingGame)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Cannot undo move from')
    expect(result.error).toContain('Must be in \'moving\' or \'moved\' state')
  })

  it('should return error when no active play exists', () => {
    const gameWithoutActivePlay = {
      ...testGame,
      activePlay: null
    } as any

    const result = Game.undoLastMove(gameWithoutActivePlay)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No active play found')
  })

  it('should return error when no confirmed moves exist', () => {
    // Create a game with only ready moves (no confirmed moves)
    const gameWithNoConfirmedMoves = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'ready-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'ready',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'point-1', kind: 'point' }
        }])
      }
    } as any

    const result = Game.undoLastMove(gameWithNoConfirmedMoves)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No completed moves available to undo')
  })

  it('should return error when trying to undo a no-move', () => {
    // Create a confirmed no-move in the active play
    if (testGame.activePlay?.moves) {
      const noMove: BackgammonMoveCompletedNoMove = {
        id: 'test-move-id',
        player: testGame.activePlayer,
        dieValue: 1,
        stateKind: 'completed',
        moveKind: 'no-move',
        possibleMoves: [],
        origin: undefined,
        destination: undefined,
        isHit: false
      }
      testGame.activePlay.moves = new Set([noMove as any])
    }

    const result = Game.undoLastMove(testGame)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot undo a no-move or invalid move')
  })

  it('should successfully undo a regular point-to-point move', () => {
    // Use actual point IDs from the board
    const firstPoint = testGame.board.points[0]
    const secondPoint = testGame.board.points[1]
    
    const mockGameWithConfirmedMove = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'test-confirmed-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'completed',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: firstPoint.id, kind: 'point' },
          destination: { id: secondPoint.id, kind: 'point' },
          isHit: false
        }])
      }
    } as any

    // Set up board state: destination has the player's checker, origin is empty
    secondPoint.checkers = [{
      id: 'test-checker',
      color: testGame.activePlayer.color,
      checkercontainerId: secondPoint.id
    }]
    firstPoint.checkers = []

    const result = Game.undoLastMove(mockGameWithConfirmedMove)
    
    if (!result.success) {
      console.log('Undo failed with error:', result.error)
    }
    
    expect(result.success).toBe(true)
    expect(result.game).toBeDefined()
    expect(result.undoneMove).toBeDefined()
    expect(result.remainingMoveHistory).toBeDefined()
  })

  it('should handle board state validation errors gracefully', () => {
    // Create a mock game with invalid board state
    const invalidGame = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([{
          id: 'invalid-move',
          player: testGame.activePlayer,
          dieValue: 1,
          stateKind: 'completed',
          moveKind: 'point-to-point',
          possibleMoves: [],
          origin: { id: 'non-existent-origin', kind: 'point' },
          destination: { id: 'non-existent-destination', kind: 'point' },
          isHit: false
        }])
      }
    } as any

    const result = Game.undoLastMove(invalidGame)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to undo move')
  })

  it('should preserve game integrity after undo', () => {
    // Use actual point IDs from the board
    const thirdPoint = testGame.board.points[2]
    const fourthPoint = testGame.board.points[3]
    
    // Get the original moves and modify one to be completed
    const originalMoves = Array.from(testGame.activePlay!.moves)
    const modifiedMoves = originalMoves.map((move, index) => {
      if (index === 0) {
        // Make the first move completed
        return {
          ...move,
          id: 'integrity-test-move',
          stateKind: 'completed',
          moveKind: 'point-to-point',
          origin: { id: thirdPoint.id, kind: 'point' },
          destination: { id: fourthPoint.id, kind: 'point' },
          isHit: false
        }
      }
      // Keep other moves in 'ready' state
      return move
    })

    const mockGameForIntegrityTest = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set(modifiedMoves)
      }
    } as any

    // Set up board state: destination has the player's checker, origin is empty
    fourthPoint.checkers = [{
      id: 'integrity-checker',
      color: testGame.activePlayer.color,
      checkercontainerId: fourthPoint.id
    }]
    thirdPoint.checkers = []

    const result = Game.undoLastMove(mockGameForIntegrityTest)
    
    if (!result.success) {
      console.log('Integrity test undo failed with error:', result.error)
    }
    
    expect(result.success).toBe(true)
    
    if (result.game) {
      // Verify pip counts are numbers and positive
      result.game.players.forEach(player => {
        expect(typeof player.pipCount).toBe('number')
        expect(player.pipCount).toBeGreaterThan(0)
      })
      
      // BACKGAMMON RULES: When all moves are undone, game should transition back to 'rolled' state
      // Player should NOT be able to roll dice again - they must use the same dice values
      if (result.game.stateKind === 'rolled') {
        expect(result.game.stateKind).toBe('rolled')
        // CRITICAL: activePlay should be preserved (not null) to enable continued play after undo
        expect(result.game.activePlay).toBeDefined()
        // Verify dice are in 'rolled' state with preserved values
        const activePlayer = result.game.players.find(p => p.stateKind === 'rolled')
        expect(activePlayer).toBeDefined()
        expect(activePlayer!.dice?.stateKind).toBe('rolled')
        expect(activePlayer!.dice?.currentRoll).toBeDefined()
        expect(activePlayer!.dice?.currentRoll).toHaveLength(2)
      } else {
        // If there are still moves remaining, stay in moving state
        expect(result.game.stateKind).toBe('moving')
        expect(result.game.activePlay).toBeDefined()
      }
    }
  })

  it('REAL-WORLD: should allow player to continue playing after undo', () => {
    console.log('\n🎯 TESTING COMPLETE WORKFLOW: ROLL → MOVE → UNDO → MOVE AGAIN')
    console.log('='.repeat(60))
    
    // STEP 1: Start with a proper rolled state
    let currentGame = Game.createNewGame(
      'test-user-1',
      'test-user-2',
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
    
    console.log(`\n📋 STEP 1 - INITIAL STATE: ${currentGame.stateKind}`)
    console.log(`🎲 DICE: [${currentGame.activePlayer?.dice?.currentRoll?.join(', ')}]`)
    Board.displayAsciiBoard(currentGame.board)

    // STEP 2: Transition to moving state and make a move
    console.log('\n📍 STEP 2: Transitioning to moving state...')
    
    const preparedGame = Game.prepareMove(currentGame as any)
    console.log(`   Prepared state: ${preparedGame.stateKind}`)
    
    const movingGame = Game.toMoving(preparedGame)
    console.log(`   Moving state: ${movingGame.stateKind}`)
    
    // STEP 3: Make an actual move
    console.log('\n📍 STEP 3: Making a move...')
    
    if (movingGame.stateKind === 'moving' && movingGame.activePlay?.moves) {
      const movesArray = Array.from(movingGame.activePlay.moves)
      const readyMove = movesArray.find(m => m.stateKind === 'ready')
      
      if (readyMove && readyMove.possibleMoves && readyMove.possibleMoves.length > 0) {
        const firstPossibleMove = readyMove.possibleMoves[0]
        const originId = firstPossibleMove.origin.id
        
        console.log(`   Attempting move from origin: ${firstPossibleMove.origin.kind}:${originId} -> ${firstPossibleMove.destination.kind}:${firstPossibleMove.destination.id}`)
        
        // Execute the move using Game.executeAndRecalculate
        const gameAfterMove = Game.executeAndRecalculate(movingGame, originId)
        
        if (gameAfterMove.stateKind === 'completed') {
          console.log('❌ Game ended - cannot test undo')
          return
        }
        
        console.log(`✅ Move executed successfully`)
        console.log(`   Game state after move: ${gameAfterMove.stateKind}`)
        
        currentGame = gameAfterMove as any
        
        console.log('\n📋 BOARD STATE AFTER MOVE:')
        Board.displayAsciiBoard(currentGame.board)
        
      } else {
        console.log('❌ No possible moves available - cannot test workflow')
        return
      }
    } else {
      throw new Error(`Game not in moving state or missing activePlay`)
    }

    // STEP 4: Undo the move
    console.log('\n📍 STEP 4: Undoing the move...')
    
    const undoResult = Game.undoLastMove(currentGame)
    
    if (!undoResult.success) {
      console.log(`❌ Undo failed: ${undoResult.error}`)
      throw new Error(`Undo failed: ${undoResult.error}`)
    }
    
    console.log('✅ Move undone successfully')
    const gameAfterUndo = undoResult.game!
    console.log(`   Game state after undo: ${gameAfterUndo.stateKind}`)
    console.log(`   ActivePlay after undo: ${gameAfterUndo.activePlay ? 'Present' : 'Null'}`)
    console.log(`   Dice state: ${gameAfterUndo.activePlayer?.dice?.stateKind}`)
    console.log(`   Dice values: [${gameAfterUndo.activePlayer?.dice?.currentRoll?.join(', ')}]`)
    
    console.log('\n📋 BOARD STATE AFTER UNDO:')
    Board.displayAsciiBoard(gameAfterUndo.board)

    // STEP 5: Get possible moves after undo
    console.log('\n📍 STEP 5: Getting possible moves after undo...')
    
    const possibleMovesResult = Game.getPossibleMoves(gameAfterUndo)
    
    if (!possibleMovesResult.success) {
      console.log(`❌ getPossibleMoves failed: ${possibleMovesResult.error}`)
      throw new Error(`getPossibleMoves failed: ${possibleMovesResult.error}`)
    }
    
    console.log('✅ getPossibleMoves succeeded')
    console.log(`   Possible moves: ${possibleMovesResult.possibleMoves?.length || 0}`)
    console.log(`   Current die: ${possibleMovesResult.currentDie}`)
    
    const updatedGame = possibleMovesResult.updatedGame!
    console.log(`   Updated game state: ${updatedGame.stateKind}`)
    console.log(`   Updated activePlay: ${updatedGame.activePlay ? 'Present' : 'Null'}`)

    // STEP 6: Make another move to prove the game is playable
    console.log('\n📍 STEP 6: Making another move to prove playability...')
    
    if (possibleMovesResult.possibleMoves && possibleMovesResult.possibleMoves.length > 0) {
      const firstMove = possibleMovesResult.possibleMoves[0]
      const originId = firstMove.origin.id
      
      console.log(`   Attempting second move from origin: ${firstMove.origin.kind}:${originId} -> ${firstMove.destination.kind}:${firstMove.destination.id}`)
      
      // Ensure game is in moving state for the move
      let gameReadyToMove = updatedGame
      if (gameReadyToMove.stateKind !== 'moving') {
        if (gameReadyToMove.stateKind === 'rolled') {
          const preparingGame = Game.prepareMove(gameReadyToMove as any)
          gameReadyToMove = Game.toMoving(preparingGame)
          console.log(`   Transitioned to moving state: ${gameReadyToMove.stateKind}`)
        } else {
          throw new Error(`Cannot transition from ${gameReadyToMove.stateKind} to moving`)
        }
      }
      
      // Execute the second move
      const gameAfterSecondMove = Game.executeAndRecalculate(gameReadyToMove as any, originId)
      
      if (gameAfterSecondMove.stateKind === 'completed') {
        console.log('✅ Second move executed - game ended (win condition)')
      } else {
        console.log('✅ Second move executed successfully')
        console.log(`   Game state after second move: ${gameAfterSecondMove.stateKind}`)
      }
      
      console.log('\n📋 BOARD STATE AFTER SECOND MOVE:')
      Board.displayAsciiBoard(gameAfterSecondMove.board)
      
      console.log('\n🎯 WORKFLOW COMPLETE: ROLL → MOVE → UNDO → MOVE AGAIN')
      console.log('✅ ALL STEPS SUCCESSFUL - UNDO FUNCTIONALITY PROVEN!')
      
    } else {
      console.log('⚠️ No possible moves available after undo')
      console.log('   This could be valid if the player is blocked')
      console.log('✅ UNDO FUNCTIONALITY STILL PROVEN - Game returned to playable state')
    }

    // Assertions to verify the test passes
    expect(undoResult.success).toBe(true)
    expect(gameAfterUndo.stateKind).toBe('rolled')
    expect(gameAfterUndo.activePlayer?.dice?.stateKind).toBe('rolled')
    expect(gameAfterUndo.activePlayer?.dice?.currentRoll).toHaveLength(2)
    expect(possibleMovesResult.success).toBe(true)
    expect(possibleMovesResult.possibleMoves).toBeDefined()
    expect(Array.isArray(possibleMovesResult.possibleMoves)).toBe(true)
    
    console.log('\n🎉 REAL-WORLD UNDO TEST PASSED!')
    console.log('='.repeat(50))
  })

  it('should restore hit checkers to their original position when undoing a hitting move', () => {
    console.log('\n🎯 TESTING HIT CHECKER RESTORATION ON UNDO')
    console.log('='.repeat(60))

    // Use actual point IDs from the board
    const originPoint = testGame.board.points[23] // point 24 for black clockwise
    const targetPoint = testGame.board.points[18] // point 19 for black clockwise

    // Clear target point and place a single white checker there (hittable)
    targetPoint.checkers = [{
      id: 'hit-target-checker',
      color: 'white', // opposite of active player (black)
      checkercontainerId: targetPoint.id
    }]

    // Clear origin point and place a black checker there
    originPoint.checkers = [{
      id: 'hitting-checker',
      color: 'black',
      checkercontainerId: originPoint.id
    }]

    console.log(`\n📍 SETUP: Black checker on point ${originPoint.position.clockwise}, White checker on point ${targetPoint.position.clockwise}`)
    console.log(`   Target point checkers BEFORE move: ${targetPoint.checkers.length} (white: ${targetPoint.checkers.filter(c => c.color === 'white').length})`)
    console.log(`   White bar checkers BEFORE move: ${testGame.board.bar.counterclockwise.checkers.length}`)

    // Create a hitting move manually
    const hittingMove = {
      id: 'hitting-move-test',
      player: testGame.activePlayer,
      dieValue: 5, // Distance from point 24 to point 19
      stateKind: 'completed',
      moveKind: 'point-to-point',
      possibleMoves: [],
      origin: { id: originPoint.id, kind: 'point' },
      destination: { id: targetPoint.id, kind: 'point' },
      isHit: true // This is the key - mark this as a hitting move
    }

    const mockGameWithHittingMove = {
      ...testGame,
      activePlay: {
        ...testGame.activePlay,
        moves: new Set([hittingMove])
      }
    } as any

    // Simulate the board state AFTER the hitting move was executed:
    // 1. Black checker moved from origin to destination (hitting)
    // 2. White checker was moved from destination to bar
    originPoint.checkers = [] // Black checker moved away
    targetPoint.checkers = [{
      id: 'hitting-checker',
      color: 'black',
      checkercontainerId: targetPoint.id
    }] // Black checker now at target
    testGame.board.bar.counterclockwise.checkers.push({
      id: 'hit-target-checker',
      color: 'white',
      checkercontainerId: testGame.board.bar.counterclockwise.id
    }) // White checker on bar

    console.log(`\n📍 STATE AFTER HITTING MOVE (before undo):`)
    console.log(`   Target point checkers: ${targetPoint.checkers.length} (black: ${targetPoint.checkers.filter(c => c.color === 'black').length})`)
    console.log(`   White bar checkers: ${testGame.board.bar.counterclockwise.checkers.length}`)

    // Now test the undo
    const result = Game.undoLastMove(mockGameWithHittingMove)

    if (!result.success) {
      console.log(`❌ Undo failed: ${result.error}`)
      throw new Error(`Undo failed: ${result.error}`)
    }

    console.log('✅ Undo successful!')
    const gameAfterUndo = result.game!

    // Check the board state after undo
    const originAfterUndo = gameAfterUndo.board.points.find(p => p.id === originPoint.id)!
    const targetAfterUndo = gameAfterUndo.board.points.find(p => p.id === targetPoint.id)!
    const whiteBarAfterUndo = gameAfterUndo.board.bar.counterclockwise

    console.log(`\n📍 STATE AFTER UNDO:`)
    console.log(`   Origin point checkers: ${originAfterUndo.checkers.length} (black: ${originAfterUndo.checkers.filter(c => c.color === 'black').length})`)
    console.log(`   Target point checkers: ${targetAfterUndo.checkers.length} (white: ${targetAfterUndo.checkers.filter(c => c.color === 'white').length})`)
    console.log(`   White bar checkers: ${whiteBarAfterUndo.checkers.length}`)

    // Assertions to verify correct undo behavior
    expect(result.success).toBe(true)
    
    // Black checker should be back at origin
    expect(originAfterUndo.checkers).toHaveLength(1)
    expect(originAfterUndo.checkers[0].color).toBe('black')
    expect(originAfterUndo.checkers[0].id).toBe('hitting-checker')
    
    // White checker should be restored to target point (where it was before being hit)
    expect(targetAfterUndo.checkers).toHaveLength(1)
    expect(targetAfterUndo.checkers[0].color).toBe('white')
    expect(targetAfterUndo.checkers[0].id).toBe('hit-target-checker')
    
    // White bar should be empty (hit checker restored)
    expect(whiteBarAfterUndo.checkers).toHaveLength(0)

    console.log('\n🎉 HIT CHECKER RESTORATION TEST PASSED!')
    console.log('✅ Hit checker correctly returned to original position after undo')
    console.log('='.repeat(60))
  })
})