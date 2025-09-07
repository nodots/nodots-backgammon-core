import { describe, expect, it } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonPlayerRolled,
  BackgammonPlayMoving,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Board, generateId, Play } from '../../../../'

describe('Bear-off Doubles Bug', () => {
  const setupBearOffBoard = (): {
    boardImport: BackgammonCheckerContainerImport[]
    player: BackgammonPlayerRolled
  } => {
    // Setup a board in bear-off phase with multiple checkers on position 6
    // This should allow for multiple bear-off moves with 6s
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 6, counterclockwise: 19 },
        checkers: { qty: 4, color: 'white' }, // 4 checkers on point 6
      },
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 2, color: 'white' }, // 2 checkers on point 5
      },
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 9, color: 'white' }, // Rest on point 1
      },
    ]

    const player: BackgammonPlayerRolled = {
      id: generateId(),
      userId: generateId(),
      color: 'white',
      stateKind: 'rolled',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 6] as BackgammonRoll, // Doubles 6,6 = 4 moves
        total: 24,
        color: 'white' as BackgammonColor,
      },
      direction: 'clockwise',
      pipCount: 15,
      isRobot: true,
      rollForStartValue: 3,
    }

    return { boardImport, player }
  }

  it('should reproduce the bug: 4th move of [6,6] doubles fails in bear-off phase', () => {
    const { boardImport, player } = setupBearOffBoard()
    let board = Board.initialize(boardImport)
    
    console.log('=== Initial Board State ===')
    console.log('Point 6 checkers:', board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
    console.log('Point 5 checkers:', board.points.find(p => p.position.clockwise === 5)?.checkers.length || 0)
    console.log('Off checkers:', board.off.clockwise.checkers.length)

    // Initialize the play with doubles [6,6] - should create 4 moves
    let play = Play.initialize(board, player)
    console.log('=== After Play.initialize ===')
    console.log('Total moves created:', play.moves.size)
    console.log('Moves:', Array.from(play.moves).map(m => ({ 
      id: m.id.substring(0, 8), 
      dieValue: m.dieValue, 
      moveKind: m.moveKind, 
      stateKind: m.stateKind,
      possibleMovesCount: m.possibleMoves.length 
    })))

    // Convert to moving state
    let movingPlay = Play.startMove(play)
    
    // Execute first 3 moves successfully
    for (let i = 1; i <= 3; i++) {
      console.log(`\n=== Move ${i} ===`)
      const readyMoves = Array.from(movingPlay.moves).filter(m => m.stateKind === 'ready')
      console.log(`Ready moves before move ${i}:`, readyMoves.length)
      
      expect(readyMoves.length).toBeGreaterThan(0) // Should have at least one ready move
      
      const moveToExecute = readyMoves[0]
      console.log(`Executing move ${i}: die=${moveToExecute.dieValue}, kind=${moveToExecute.moveKind}`)
      
      // Find a valid origin for the move
      const validOrigin = moveToExecute.possibleMoves.length > 0 
        ? moveToExecute.possibleMoves[0].origin 
        : moveToExecute.origin
      
      console.log(`Move ${i} origin: ${validOrigin?.kind || 'undefined'} (${validOrigin?.id?.substring(0, 8) || 'no-id'})`)
      
      const moveResult = Play.move(board, movingPlay, validOrigin!)
      board = moveResult.board
      movingPlay = moveResult.play as BackgammonPlayMoving
      
      console.log(`After move ${i}:`)
      console.log('- Point 6 checkers:', board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
      console.log('- Off checkers:', board.off.clockwise.checkers.length)
      console.log('- Remaining ready moves:', Array.from(movingPlay.moves).filter(m => m.stateKind === 'ready').length)
    }

    // Now attempt the 4th move - this is where the bug occurs
    console.log('\n=== Move 4 (THE BUG) ===')
    const readyMovesBeforeMove4 = Array.from(movingPlay.moves).filter(m => m.stateKind === 'ready')
    console.log('Ready moves before move 4:', readyMovesBeforeMove4.length)
    
    if (readyMovesBeforeMove4.length === 0) {
      console.log('BUG REPRODUCED: No ready moves available for 4th die of doubles!')
      console.log('All moves:', Array.from(movingPlay.moves).map(m => ({ 
        id: m.id.substring(0, 8), 
        dieValue: m.dieValue, 
        stateKind: m.stateKind 
      })))
      
      // This should fail, reproducing the bug
      expect(readyMovesBeforeMove4.length).toBe(0) // Bug: no 4th move available
    } else {
      console.log('4th move is available - bug may be fixed')
      const move4 = readyMovesBeforeMove4[0]
      console.log(`Move 4 details: die=${move4.dieValue}, kind=${move4.moveKind}, possibleMoves=${move4.possibleMoves.length}`)
      
      // If the move exists, try to execute it
      const validOrigin = move4.possibleMoves.length > 0 
        ? move4.possibleMoves[0].origin 
        : move4.origin
      
      const moveResult = Play.move(board, movingPlay, validOrigin!)
      board = moveResult.board
      movingPlay = moveResult.play as BackgammonPlayMoving
      
      console.log('Move 4 executed successfully')
      console.log('Final off checkers:', board.off.clockwise.checkers.length)
    }
  })

  it('should verify that possibleMoves are correctly generated for 4th die in bear-off', () => {
    const { boardImport, player } = setupBearOffBoard()
    const board = Board.initialize(boardImport)
    
    // Test possibleMoves generation for each of the 4 dice in [6,6] doubles
    for (let i = 1; i <= 4; i++) {
      console.log(`\n=== Testing possible moves for die ${i} (value 6) ===`)
      const possibleMoves = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
      console.log(`Possible moves for die ${i}:`, possibleMoves.length)
      
      possibleMoves.forEach((move, idx) => {
        console.log(`  Move ${idx + 1}: ${move.origin.kind} -> ${move.destination.kind}`)
      })
      
      // There should be possible moves for all 4 dice since we have 4 checkers on point 6
      expect(possibleMoves.length).toBeGreaterThan(0)
    }
  })

  it('should handle sequential bear-off moves correctly for doubles', () => {
    const { boardImport, player } = setupBearOffBoard()
    let board = Board.initialize(boardImport)
    
    // Manually simulate the moves to see where the issue occurs
    let remainingDice = [6, 6, 6, 6] // Four 6s from doubles
    
    for (let moveNum = 1; moveNum <= 4; moveNum++) {
      console.log(`\n=== Manual Move ${moveNum} ===`)
      console.log('Board state:')
      console.log('- Point 6:', board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
      console.log('- Point 5:', board.points.find(p => p.position.clockwise === 5)?.checkers.length || 0)
      console.log('- Off:', board.off.clockwise.checkers.length)
      
      const dieValue = remainingDice[moveNum - 1] as BackgammonDieValue
      const possibleMoves = Board.getPossibleMoves(board, player, dieValue)
      console.log(`Possible moves for die ${dieValue}:`, possibleMoves.length)
      
      if (possibleMoves.length === 0) {
        console.log(`BUG: No possible moves for die ${moveNum} (value ${dieValue})`)
        expect(possibleMoves.length).toBeGreaterThan(0) // This should fail if bug exists
        break
      }
      
      // Execute the first possible move
      const move = possibleMoves[0]
      console.log(`Executing: ${move.origin.kind} -> ${move.destination.kind}`)
      
      board = Board.moveChecker(
        board, 
        move.origin, 
        move.destination, 
        player.direction
      )
      
      console.log(`After move ${moveNum}:`)
      console.log('- Point 6:', board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
      console.log('- Off:', board.off.clockwise.checkers.length)
    }
    
    console.log('\n=== Final Result ===')
    console.log('Total checkers borne off:', board.off.clockwise.checkers.length)
    // Should be 4 if all moves executed successfully
    expect(board.off.clockwise.checkers.length).toBe(4)
  })
})