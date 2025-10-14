/**
 * Debug test to understand what's happening with auto-switch
 */
import { describe, it, expect } from '@jest/globals'
import { Board } from '../../Board'
import { Player } from '../../Player'
import { Play } from '../index'
import {
  BackgammonCheckerContainerImport,
  BackgammonPlayerRolling,
  BackgammonPlayMoving,
  BackgammonPlayResult,
} from '@nodots-llc/backgammon-types'

describe('Debug - Auto-Switch Behavior', () => {
  it('should show what happens during auto-switch', () => {
    const boardImport: BackgammonCheckerContainerImport[] = [
      {
        position: { clockwise: 5, counterclockwise: 20 },
        checkers: { qty: 1, color: 'white' },
      },
      {
        position: { clockwise: 4, counterclockwise: 21 },
        checkers: { qty: 2, color: 'black' },
      },
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: { qty: 0, color: 'white' },
      },
    ]

    const board = Board.initialize(boardImport)
    const player = Player.initialize(
      'white',
      'counterclockwise',
      'rolling',
      false
    ) as BackgammonPlayerRolling
    const rolledPlayer = Player.roll(player)
    rolledPlayer.dice.currentRoll = [1, 3]
    const movingPlayer = Player.toMoving(rolledPlayer)

    const initialPlay = Play.initialize(board, movingPlayer)

    console.log('\n=== INITIAL PLAY ===')
    console.log('Dice:', movingPlayer.dice.currentRoll)
    initialPlay.moves.forEach((m, i) => {
      console.log(`\nMove ${i + 1}: die ${m.dieValue}`)
      console.log('  stateKind:', m.stateKind)
      console.log('  moveKind:', m.moveKind)
      console.log('  possibleMoves:', m.possibleMoves.length)
      m.possibleMoves.forEach((pm, j) => {
        const originPos =
          pm.origin.kind === 'point'
            ? pm.origin.position.counterclockwise
            : pm.origin.kind
        const destPos =
          pm.destination.kind === 'point'
            ? pm.destination.position.counterclockwise
            : pm.destination.kind
        console.log(`    ${j + 1}. ${originPos} -> ${destPos}`)
      })
    })

    const point20 = board.points.find(
      (p) => p.position.counterclockwise === 20
    )!

    console.log('\n=== EXECUTING MOVE FROM POINT 20 ===')

    const moveResult: BackgammonPlayResult = Play.move(
      initialPlay.board,
      initialPlay,
      point20
    )

    console.log('\nMove result:')
    console.log('  autoSwitched:', moveResult.autoSwitched)
    console.log('  originalDieValue:', moveResult.originalDieValue)
    console.log('  usedDieValue:', moveResult.usedDieValue)
    console.log('  completed move die value:', moveResult.move.dieValue)

    const resultPlay = moveResult.play as BackgammonPlayMoving

    console.log('\n=== AFTER MOVE ===')
    console.log('Dice order:', resultPlay.player.dice.currentRoll)
    resultPlay.moves.forEach((m, i) => {
      console.log(`\nMove ${i + 1}: die ${m.dieValue}`)
      console.log('  stateKind:', m.stateKind)
      console.log('  moveKind:', m.moveKind)
    })
  })
})
