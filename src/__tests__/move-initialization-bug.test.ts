import { Board, Player, Play } from '../index'
import { generateId } from '../utils/logger'
import { BackgammonCheckerContainerImport, BackgammonPlayerRolled, BackgammonDiceRolled } from '@nodots-llc/backgammon-types/dist'

describe('Move Initialization Bug', () => {
  test('should reproduce the bug with doubles in bear-off position', () => {
    // Create a board with white checkers in bear-off position (as described in handoff)
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 22 as any, counterclockwise: 3 as any },
        checkers: { qty: 2, color: 'white' },
      },
      {
        position: { clockwise: 23 as any, counterclockwise: 2 as any },
        checkers: { qty: 3, color: 'white' },
      },
      {
        position: { clockwise: 24 as any, counterclockwise: 1 as any },
        checkers: { qty: 12, color: 'white' },
      },
    ]

    const board = Board.initialize(boardImport)
    
    // Create a white player with [3,3] roll (doubles)
    const whitePlayer = Player.initialize(
      'white',
      'clockwise',
      undefined,
      generateId(),
      'inactive',
      true
    )

    // Set the current roll to [3,3] (doubles)
    const rolledPlayer: BackgammonPlayerRolled = {
      ...whitePlayer,
      stateKind: 'rolled',
      dice: {
        ...whitePlayer.dice,
        stateKind: 'rolled',
        currentRoll: [3, 3],
        total: 6,
      } as BackgammonDiceRolled,
    }

    // Initialize the play
    const play = Play.initialize(board, rolledPlayer)

    // Debug: Check the moves array state
    console.log('🔍 Debug: Moves array state:')
    const movesArray = Array.from(play.moves)
    movesArray.forEach((move, index) => {
      const originStr = move.origin ? 
        (move.origin.kind === 'point' ? `point-${(move.origin as any).position.clockwise}` : 'bar') : 
        'null'
      console.log(`  Move ${index}: stateKind=${move.stateKind}, dieValue=${move.dieValue}, origin=${originStr}`)
      
      // Check possible moves for this die
      const possibleMoves = Board.getPossibleMoves(board, rolledPlayer, move.dieValue)
      console.log(`    Possible moves for die ${move.dieValue}: ${possibleMoves.length}`)
      
      if (possibleMoves.length > 0) {
        console.log(`    First possible move: origin=point-${possibleMoves[0].origin.position.clockwise}, destination=${possibleMoves[0].destination.kind}`)
      }
    })

    // The bug: moves should have proper origin/destination, not null
    movesArray.forEach((move) => {
      if (move.stateKind === 'ready' && move.moveKind !== 'no-move') {
        // For ready moves that aren't no-move, origin should be set
        expect(move.origin).not.toBeNull()
        expect(move.origin).not.toBeUndefined()
      }
    })
  })
})