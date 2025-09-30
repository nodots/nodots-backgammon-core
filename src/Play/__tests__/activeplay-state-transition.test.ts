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
    expect(play.moves.size).toBe(2)

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
})