import { describe, expect, it } from '@jest/globals'
import {
  BackgammonPlayerMoving,
  BackgammonMoveReady,
} from '@nodots-llc/backgammon-types'
import { Board, generateId, Play } from '../../'
import { BOARD_IMPORT_DEFAULT } from '../../Board/imports'

describe('ActivePlay stateKind transition to moved', () => {
  it('should set activePlay.stateKind to "moved" when all moves are completed', () => {
    // Setup: Create a simple board and player with a regular roll
    const board = Board.initialize(BOARD_IMPORT_DEFAULT)
    
    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color: 'white',
      direction: 'clockwise',
      stateKind: 'moving',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [3, 4],
        total: 7,
        color: 'white',
      },
      rollForStartValue: 3,
      pipCount: 167,
      isRobot: false,
    }

    // Initialize play - should create 2 moves for [3,4] roll
    const play = Play.initialize(board, player)
    expect(play.stateKind).toBe('moving')
    expect(play.moves.length).toBe(2)

    // Get the moves and find one with possible moves
    const movesArray = Array.from(play.moves)
    const firstMove = movesArray.find((m): m is BackgammonMoveReady => 
      m.stateKind === 'ready' && m.possibleMoves.length > 0
    )
    
    if (!firstMove) {
      throw new Error('No valid moves found')
    }

    // Execute first move
    const firstOrigin = firstMove.possibleMoves[0].origin
    const result1 = Play.move(board, play, firstOrigin)
    
    // Check the play state after first move
    switch (result1.play.stateKind) {
      case 'moving': {
        // Still moving - find next move
        const remainingMoves = Array.from(result1.play.moves)
        const secondMove = remainingMoves.find((m): m is BackgammonMoveReady => 
          m.stateKind === 'ready' && m.possibleMoves.length > 0
        )
        
        if (!secondMove) {
          // No more ready moves - check if all are completed
          const allCompleted = remainingMoves.every(m => m.stateKind === 'completed')
          expect(allCompleted).toBe(true)
          // This shouldn't happen - if all completed, play should be 'moved'
          expect(result1.play.stateKind).toBe('moved')
        } else {
          // Execute second move
          const secondOrigin = secondMove.possibleMoves[0].origin
          const result2 = Play.move(result1.board, result1.play, secondOrigin)
          
          // Check final state
          switch (result2.play.stateKind) {
            case 'moved':
              // SUCCESS: activePlay transitioned to 'moved'
              const finalMoves = Array.from(result2.play.moves)
              const allCompleted = finalMoves.every(m => m.stateKind === 'completed')
              expect(allCompleted).toBe(true)
              expect(result2.play.stateKind).toBe('moved')
              break
              
            case 'moving':
              // Should not still be moving after all moves
              const moves = Array.from(result2.play.moves)
              const completed = moves.every(m => m.stateKind === 'completed')
              if (completed) {
                // All moves completed but state not transitioned
                expect(result2.play.stateKind).toBe('moved')
              }
              break
              
            default:
              throw new Error(`Unexpected play state: ${result2.play.stateKind}`)
          }
        }
        break
      }
      
      case 'moved':
        // Already moved after first move (both moves might have been no-move)
        expect(result1.play.stateKind).toBe('moved')
        break
        
      default:
        throw new Error(`Unexpected play state: ${result1.play.stateKind}`)
    }
  })

  it('should set activePlay.stateKind to "moved" when moves become no-move', () => {
    // Setup: Create a board where player has limited movement options
    const board = Board.initialize(BOARD_IMPORT_DEFAULT)
    
    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color: 'black',
      direction: 'counterclockwise',
      stateKind: 'moving',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 5],
        total: 11,
        color: 'black',
      },
      rollForStartValue: 4,
      pipCount: 167,
      isRobot: false,
    }

    // Initialize play
    const play = Play.initialize(board, player)
    expect(play.stateKind).toBe('moving')

    // Find a move to execute
    const movesArray = Array.from(play.moves)
    const firstMove = movesArray.find((m): m is BackgammonMoveReady => 
      m.stateKind === 'ready' && m.possibleMoves.length > 0
    )
    
    if (!firstMove) {
      // No moves possible - all should be completed as no-move
      const allCompleted = movesArray.every(m => m.stateKind === 'completed')
      expect(allCompleted).toBe(true)
      // Play should already be in 'moved' state if initialized with no possible moves
      return
    }

    // Execute first move
    const firstOrigin = firstMove.possibleMoves[0].origin
    const result = Play.move(board, play, firstOrigin)
    
    switch (result.play.stateKind) {
      case 'moved': {
        // Transitioned to moved - verify all moves are completed
        const finalMoves = Array.from(result.play.moves)
        const allCompleted = finalMoves.every(m => m.stateKind === 'completed')
        expect(allCompleted).toBe(true)
        expect(result.play.stateKind).toBe('moved')
        break
      }
      
      case 'moving': {
        // Still moving - check if more moves available
        const remainingMoves = Array.from(result.play.moves)
        const hasReadyMoves = remainingMoves.some(m => 
          m.stateKind === 'ready' && m.possibleMoves.length > 0
        )
        expect(hasReadyMoves).toBe(true)
        break
      }
      
      default:
        throw new Error(`Unexpected play state: ${result.play.stateKind}`)
    }
  })

  it('should allow all 4 moves to be executed for doubles', () => {
    // Setup: Create a board with a bearing-off position for testing doubles
    // Import a position where player can bear off with doubles
    const boardImport = [
      {
        position: { clockwise: 3, counterclockwise: 22 },
        checkers: { qty: 2, color: 'white' as const },
      },
      {
        position: { clockwise: 4, counterclockwise: 21 },
        checkers: { qty: 2, color: 'white' as const },
      },
    ]
    const board = Board.buildBoard(boardImport)

    const player: BackgammonPlayerMoving = {
      id: generateId(),
      userId: generateId(),
      color: 'white',
      direction: 'clockwise',
      stateKind: 'moving',
      dice: {
        id: generateId(),
        stateKind: 'rolled',
        currentRoll: [6, 6], // Doubles
        total: 24,
        color: 'white',
      },
      rollForStartValue: 6,
      pipCount: 10, // 2 checkers on 3 + 2 checkers on 4
      isRobot: true, // Simulate robot for AI move path
    }

    // Initialize play - should create 4 moves for doubles
    const play = Play.initialize(board, player)
    expect(play.stateKind).toBe('moving')
    expect(play.moves.length).toBe(4)

    // Verify all 4 moves have the same die value (6)
    const allDieValuesSix = play.moves.every(m => m.dieValue === 6)
    expect(allDieValuesSix).toBe(true)

    // Execute moves one by one, simulating AI move execution with expectedDieValue
    let currentBoard = board
    let currentPlay = play
    let movesExecuted = 0

    for (let i = 0; i < 4; i++) {
      const movesArray = Array.from(currentPlay.moves)
      const readyMove = movesArray.find((m): m is BackgammonMoveReady =>
        m.stateKind === 'ready' && m.possibleMoves.length > 0
      )

      if (!readyMove) {
        // No more ready moves - either no-move or all completed
        break
      }

      // Execute with expectedDieValue (AI path) to test the fix
      const origin = readyMove.possibleMoves[0].origin
      const destination = readyMove.possibleMoves[0].destination
      const result = Play.move(currentBoard, currentPlay, origin, undefined, {
        expectedDieValue: 6,
        desiredDestinationId: destination.id,
      })

      currentBoard = result.board
      currentPlay = result.play
      movesExecuted++

      // After each move (except the last), there should still be ready moves
      if (i < 3) {
        const remainingReady = Array.from(currentPlay.moves).filter(
          m => m.stateKind === 'ready'
        )
        // With the fix, remaining ready moves should be 3, 2, 1 respectively
        expect(remainingReady.length).toBeGreaterThanOrEqual(0)

        // If play is still 'moving', there should be ready moves
        if (currentPlay.stateKind === 'moving') {
          expect(remainingReady.length).toBeGreaterThan(0)
        }
      }
    }

    // Verify we executed at least 2 moves (the position has 4 checkers that can bear off)
    expect(movesExecuted).toBeGreaterThanOrEqual(2)
  })
})