import { describe, expect, it } from '@jest/globals'
import {
  BackgammonCheckerContainerImport,
  BackgammonColor,
  BackgammonDieValue,
  BackgammonPlayerMoving,
  BackgammonRoll,
} from '@nodots-llc/backgammon-types/dist'
import { Board, generateId } from '../../../../'

describe('Bear-off possibleMoves Recalculation Bug', () => {
  const setupMinimalBearOffBoard = () => {
    // Setup board with exactly 3 checkers on point 6
    // This should allow for exactly 3 bear-off moves with 6, but no 4th move
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 6, counterclockwise: 19 },
        checkers: { qty: 3, color: 'white' }, // Only 3 checkers on point 6
      },
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 12, color: 'white' }, // Rest on point 1
      },
    ]

    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color: 'white',
      stateKind: 'rolled',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 6] as BackgammonRoll,
        total: 24,
        color: 'white' as BackgammonColor,
      },
      direction: 'clockwise',
      pipCount: 15,
      isRobot: true,
      rollForStartValue: 2,
    }

    return { boardImport, player }
  }

  it('should correctly calculate possibleMoves after each bear-off move execution', () => {
    const { boardImport, player } = setupMinimalBearOffBoard()
    let board = Board.initialize(boardImport)
    
    console.log('=== BEAR-OFF RECALCULATION TEST ===')
    console.log('Initial: Point 6 has 3 checkers, rolling [6,6] = 4 moves')
    console.log('Expected: 3 bear-off moves possible, 1 move should be no-move or use different point')
    
    // Test initial possibleMoves
    console.log('\n--- Initial possibleMoves calculation ---')
    const initialMoves = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
    console.log('Initial possible moves with die 6:', initialMoves.length)
    initialMoves.forEach((move, idx) => {
      console.log(`  Move ${idx + 1}: ${move.origin.kind} -> ${move.destination.kind}`)
      if (move.origin.kind === 'point') {
        console.log(`    From point ${(move.origin as any).position.clockwise}`)
      }
    })

    expect(initialMoves.length).toBe(1) // Should be 1 bear-off move from point 6
    
    // Execute first bear-off move
    console.log('\n--- After 1st bear-off move ---')
    board = Board.moveChecker(
      board,
      initialMoves[0].origin,
      initialMoves[0].destination,
      player.direction
    )
    console.log('Point 6 checkers after 1st move:', 
      board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
    console.log('Off checkers:', board.off.clockwise.checkers.length)
    
    const movesAfter1 = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
    console.log('Possible moves after 1st move:', movesAfter1.length)
    expect(movesAfter1.length).toBe(1) // Should still have 1 bear-off move
    
    // Execute second bear-off move
    console.log('\n--- After 2nd bear-off move ---')
    board = Board.moveChecker(
      board,
      movesAfter1[0].origin,
      movesAfter1[0].destination,
      player.direction
    )
    console.log('Point 6 checkers after 2nd move:', 
      board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
    console.log('Off checkers:', board.off.clockwise.checkers.length)
    
    const movesAfter2 = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
    console.log('Possible moves after 2nd move:', movesAfter2.length)
    expect(movesAfter2.length).toBe(1) // Should still have 1 bear-off move
    
    // Execute third bear-off move
    console.log('\n--- After 3rd bear-off move ---')
    board = Board.moveChecker(
      board,
      movesAfter2[0].origin,
      movesAfter2[0].destination,
      player.direction
    )
    console.log('Point 6 checkers after 3rd move:', 
      board.points.find(p => p.position.clockwise === 6)?.checkers.length || 0)
    console.log('Off checkers:', board.off.clockwise.checkers.length)
    
    // This is where the bug likely occurs - no more moves with die 6
    const movesAfter3 = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
    console.log('Possible moves after 3rd move (THIS IS THE BUG):', movesAfter3.length)
    
    if (movesAfter3.length === 0) {
      console.log('🚨 BUG CONFIRMED: No possible moves for 4th die after 3 bear-off moves')
      console.log('Current board state:')
      for (let point = 6; point >= 1; point--) {
        const checkers = board.points.find(p => p.position.clockwise === point)?.checkers.filter(c => c.color === 'white').length || 0
        if (checkers > 0) {
          console.log(`  Point ${point}: ${checkers} white checkers`)
        }
      }
      
      // With checkers on point 1, there SHOULD be possible moves with die 6
      // According to backgammon rules, you can use a higher die value to bear off 
      // from the highest occupied point when no checkers exist on higher points
      const checkersOnPoint1 = board.points.find(p => p.position.clockwise === 1)?.checkers.filter(c => c.color === 'white').length || 0
      if (checkersOnPoint1 > 0) {
        console.log('❌ RULE VIOLATION: Should be able to use die 6 to bear off from point 1')
        console.log('   (Higher die rule: can use higher number when no checkers on higher points)')
      }
    }
    
    // For doubles with only 3 checkers on point 6, the 4th move should be a bear-off from the highest remaining point (point 1)
    // This should work according to the higher die rule
    expect(movesAfter3.length).toBeGreaterThan(0) // This should fail if bug exists
  })

  it('should test the higher die rule specifically for bear-off', () => {
    // Create a board where we need to use the higher die rule
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 3, counterclockwise: 22 },
        checkers: { qty: 1, color: 'white' }, // One checker on point 3
      },
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: { qty: 14, color: 'white' }, // Rest on point 1
      },
    ]
    
    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color: 'white',
      stateKind: 'rolled',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 4] as BackgammonRoll,
        total: 10,
        color: 'white' as BackgammonColor,
      },
      direction: 'clockwise',
      pipCount: 15,
      isRobot: true,
      rollForStartValue: 6,
    }
    
    const board = Board.initialize(boardImport)
    
    console.log('\n=== HIGHER DIE RULE TEST ===')
    console.log('Board: 1 checker on point 3, 14 on point 1')
    console.log('Testing die value 6 (should bear off from point 3 using higher die rule)')
    
    const possibleMoves = Board.getPossibleMoves(board, player, 6 as BackgammonDieValue)
    console.log('Possible moves with die 6:', possibleMoves.length)
    
    possibleMoves.forEach((move, idx) => {
      console.log(`  Move ${idx + 1}: ${move.origin.kind} -> ${move.destination.kind}`)
      if (move.origin.kind === 'point') {
        const originPosition = (move.origin as any).position.clockwise
        console.log(`    From point ${originPosition}`)
        
        if (originPosition === 3) {
          console.log('    ✅ Correctly using higher die rule to bear off from point 3')
        }
      }
    })
    
    // Should have 1 move: bear off from point 3 using die 6 (higher die rule)
    expect(possibleMoves.length).toBe(1)
    
    const bearOffMove = possibleMoves.find(move => 
      move.destination.kind === 'off' && 
      (move.origin as any).position?.clockwise === 3
    )
    expect(bearOffMove).toBeDefined()
  })
})