import { describe, it, expect } from '@jest/globals'
import { Play } from '../../Play'
import { Board } from '../../Board'
import { Player } from '../../Player'
import {
  BackgammonMoveReady,
  BackgammonPlayMoving,
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonPlayResult
} from '@nodots-llc/backgammon-types'

describe('Robot Dice Bug - [6,2] Roll', () => {
  it('should not have duplicate die values after executing one move from [6,2] roll', () => {
    // Create a basic board setup where robot can make moves
    const boardImport: BackgammonCheckerContainerImport[] = [
      // Black checker that can move with both 6 and 2
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: { qty: 2, color: 'black' }
      }
    ]

    const board = Board.initialize(boardImport)

    // Create black robot player with [6, 2] roll
    const player = Player.initialize('black', 'clockwise', 'rolling', true) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [6, 2]
    const movingPlayer = Player.toMoving(rolledPlayer)

    // Initialize the play
    const play = Play.initialize(board, movingPlayer)

    console.log('TESTING ROBOT EXECUTION WITH FIXED Game.move() CALL')

    // Verify initial state has two moves with different die values
    const initialMoves = Array.from(play.moves) as BackgammonMoveReady[]
    expect(initialMoves).toHaveLength(2)
    expect(initialMoves.filter(m => m.stateKind === 'ready')).toHaveLength(2)

    const initialDieValues = initialMoves.map(m => m.dieValue).sort()
    expect(initialDieValues).toEqual([2, 6])

    // Execute one move (the 2) - get the move that uses die value 2
    const moveWith2 = initialMoves.find(m => m.dieValue === 2)!
    const origin = moveWith2.possibleMoves?.[0]?.origin
    if (!origin) throw new Error('No origin in possibleMoves')

    // Execute the move
    const result: BackgammonPlayResult = Play.move(play.board, play, origin)

    // Debug: Log what actually happened
    console.log('Executed move die value:', result.move.dieValue)
    console.log('Executed move state:', result.move.stateKind)

    const resultPlay = result.play as BackgammonPlayMoving
    const allMoves = Array.from(resultPlay.moves)
    const readyMoves = allMoves.filter((m: any) => m.stateKind === 'ready')
    const completedMoves = allMoves.filter((m: any) => m.stateKind === 'completed')

    console.log('All moves after execution:')
    allMoves.forEach((move: any, i) => {
      console.log(`  Move ${i}: dieValue=${move.dieValue}, state=${move.stateKind}`)
    })

    // Check what we actually got vs what we expected
    expect(result.move.stateKind).toBe('completed')

    // Log the die values for debugging
    const allMoveDieValues = allMoves.map((m: any) => m.dieValue)
    console.log('All die values:', allMoveDieValues)

    // The critical test: no duplicate die values
    const dieValueCounts = allMoveDieValues.reduce((acc: any, val: any) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {})

    console.log('Die value counts:', dieValueCounts)

    // For [6,2] roll, should have exactly one move with 6 and one with 2
    expect(dieValueCounts[2]).toBe(1)
    expect(dieValueCounts[6]).toBe(1)
    expect(Object.keys(dieValueCounts)).toHaveLength(2)
  })
})