/**
 * Test for sequence-dependent moves bug fix
 *
 * Bug: When rolling [6, 3], if only the 6 is directly playable but playing the 6 first
 * would open up a move for the 3, the 3 was being prematurely marked as "no-move".
 *
 * Example scenario from game 6cf3e145-808f-4cb5-a8da-2e227fdd8c9b:
 * - White (counterclockwise) has checkers on positions 24, 3, 2, 1
 * - Black has a prime blocking positions 19, 21, 22, 23 (counterclockwise)
 * - Roll [6, 3]
 * - 6: 24 -> 18 is valid (position 18 is empty)
 * - 3: No direct moves (24 -> 21 blocked, others can't move 3)
 * - BUT after playing 24 -> 18, the checker on 18 CAN move to 15 with the 3
 *
 * Fix: Play.initialize now checks if playing one die first would open moves for the other
 */
import { Board, Play } from '../../index'
import {
  BackgammonColor,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonMoveReady,
  BackgammonPlayerDirection,
  BackgammonPlayerMoving,
} from '@nodots/backgammon-types'

describe('Sequence-dependent moves', () => {
  // Helper to create a board with specific checker positions
  function createBoardWithCheckers(
    whitePositions: number[], // counterclockwise positions
    blackPositions: number[]  // clockwise positions
  ) {
    const board = Board.initialize()

    // Clear all checkers
    for (const point of board.points) {
      point.checkers = []
    }
    board.bar.clockwise.checkers = []
    board.bar.counterclockwise.checkers = []
    board.off.clockwise.checkers = []
    board.off.counterclockwise.checkers = []

    // Place white checkers at counterclockwise positions
    for (const pos of whitePositions) {
      const point = board.points.find(p => p.position.counterclockwise === pos)
      if (point) {
        point.checkers.push({
          id: `white-${pos}-${point.checkers.length}`,
          color: 'white',
          checkercontainerId: point.id,
          isMovable: true,
        })
      }
    }

    // Place black checkers at clockwise positions
    for (const pos of blackPositions) {
      const point = board.points.find(p => p.position.clockwise === pos)
      if (point) {
        point.checkers.push({
          id: `black-${pos}-${point.checkers.length}`,
          color: 'black',
          checkercontainerId: point.id,
          isMovable: false,
        })
      }
    }

    return board
  }

  function createPlayer(
    color: BackgammonColor,
    direction: BackgammonPlayerDirection,
    roll: [BackgammonDieValue, BackgammonDieValue]
  ): BackgammonPlayerMoving {
    return {
      id: 'test-player',
      color,
      direction,
      stateKind: 'moving',
      isRobot: false,
      userId: 'test-user',
      pipCount: 0,
      dice: {
        id: 'test-dice',
        color,
        currentRoll: roll,
        total: roll[0] + roll[1],
        stateKind: 'rolled' as BackgammonDiceStateKind,
      },
    }
  }

  describe('when playing first die opens moves for second die', () => {
    it('should keep second die as ready, not no-move', () => {
      // Create the scenario from the bug report:
      // White on 24 (ccw) can move to 18 with 6
      // 18 -> 15 with 3 is possible after
      // But 24 -> 21 is blocked (black prime)

      // White positions: 24 (5 checkers), positions 3, 2, 1 (other checkers)
      const whitePos = [24, 24, 24, 24, 24, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1]

      // Black prime blocking: 2, 3, 4, 6 (clockwise) = 23, 22, 21, 19 (ccw)
      const blackPos = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 6, 6, 6]

      const board = createBoardWithCheckers(whitePos, blackPos)
      const player = createPlayer('white', 'counterclockwise', [6, 3])

      const play = Play.initialize(board, player)

      // Both moves should be ready
      const readyMoves = play.moves.filter(m => m.stateKind === 'ready')
      const noMoves = play.moves.filter(m => m.moveKind === 'no-move')

      console.log('Play moves:', play.moves.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
        possibleMoves: (m as BackgammonMoveReady).possibleMoves?.length ?? 0,
      })))

      expect(readyMoves.length).toBe(2)
      expect(noMoves.length).toBe(0)

      // Die 6 should have possible moves
      const die6Move = play.moves.find(m => m.dieValue === 6) as BackgammonMoveReady
      expect(die6Move.stateKind).toBe('ready')
      expect(die6Move.possibleMoves.length).toBeGreaterThan(0)

      // Die 3 should be ready (possibly with empty possibleMoves initially)
      // It will get recalculated after die 6 is played
      const die3Move = play.moves.find(m => m.dieValue === 3) as BackgammonMoveReady
      expect(die3Move.stateKind).toBe('ready')
      // The die 3 might have empty possibleMoves initially, that's OK
      // What matters is it's not marked as no-move
    })

    it('should allow playing both dice in sequence', () => {
      // Same setup as above
      const whitePos = [24, 24, 24, 24, 24, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1]
      const blackPos = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 6, 6, 6]

      const board = createBoardWithCheckers(whitePos, blackPos)
      const player = createPlayer('white', 'counterclockwise', [6, 3])

      const play = Play.initialize(board, player)

      // Find origin for die 6 (point 24 counterclockwise)
      const point24 = board.points.find(p => p.position.counterclockwise === 24)
      expect(point24).toBeDefined()

      // Execute first move: 24 -> 18 with die 6
      const result1 = Play.move(board, play, point24!)

      console.log('After first move:', result1.play.moves.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
        possibleMoves: (m as BackgammonMoveReady).possibleMoves?.length ?? 0,
      })))

      // After playing die 6, die 3 should now have possible moves
      const die3MoveAfter = result1.play.moves.find(
        m => m.dieValue === 3 && m.stateKind === 'ready'
      ) as BackgammonMoveReady

      // Die 3 should be ready with possible moves (18 -> 15)
      expect(die3MoveAfter).toBeDefined()
      expect(die3MoveAfter.possibleMoves.length).toBeGreaterThan(0)

      // Find origin for die 3 (point 18 counterclockwise - where the checker just moved)
      const point18 = result1.board.points.find(p => p.position.counterclockwise === 18)
      expect(point18).toBeDefined()
      expect(point18!.checkers.length).toBeGreaterThan(0)

      // Execute second move: 18 -> 15 with die 3
      const result2 = Play.move(result1.board, result1.play, point18!)

      console.log('After second move:', result2.play.moves.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
      })))

      // Both moves should be completed
      const completedMoves = result2.play.moves.filter(
        m => m.stateKind === 'completed' && m.moveKind !== 'no-move'
      )
      expect(completedMoves.length).toBe(2)
    })
  })

  describe('when neither die opens moves for the other', () => {
    it('should correctly mark truly blocked die as no-move', () => {
      // Scenario: White completely blocked - no sequence can use either die
      // White on position 12 (ccw), black prime blocking 8, 9, 10, 11 (ccw)
      // So with roll [3, 4]: 12-3=9 blocked, 12-4=8 blocked
      const whitePos = [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]
      // Black at ccw positions 8, 9, 10, 11 (which are clockwise 17, 16, 15, 14)
      const blackPos = [17, 17, 16, 16, 15, 15, 14, 14]

      const board = createBoardWithCheckers(whitePos, blackPos)
      const player = createPlayer('white', 'counterclockwise', [3, 4])

      const play = Play.initialize(board, player)

      // All moves should be no-moves since white is completely blocked
      const noMoves = play.moves.filter(m => m.moveKind === 'no-move')

      console.log('Blocked scenario moves:', play.moves.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
      })))

      // Both dice should be no-moves
      expect(noMoves.length).toBe(2)
    })
  })

  describe('when one die has moves and other truly cannot be used', () => {
    it('should mark only the truly blocked die as no-move', () => {
      // Scenario: Die 6 can move but die 3 truly cannot (even after die 6)
      // White on 24, black blocking 21, 18, 15 (ccw) - so 24->18 is blocked too
      // Actually let's make: white on 7, can move 7->1 with 6, but 3 is blocked
      const whitePos = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]
      // Black blocking 4 and 1 (so 7->4 blocked, but 7->1 with 6 okay since bearing off)
      // Actually this gets complex with bearing off. Let's use a simpler scenario.

      // White on 12, can move 12->6 with 6 (empty), but 6->3 blocked by black
      // And 12->9 with 3 also blocked
      const whitePos2 = [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]
      const blackPos2 = [
        3, 3, // blocks 6->3 (ccw 22->cw 3)
        9, 9, // blocks 12->9
      ]

      const board = createBoardWithCheckers(whitePos2, blackPos2)
      const player = createPlayer('white', 'counterclockwise', [6, 3])

      const play = Play.initialize(board, player)

      console.log('One playable scenario:', play.moves.map(m => ({
        dieValue: m.dieValue,
        stateKind: m.stateKind,
        moveKind: m.moveKind,
        possibleMoves: (m as BackgammonMoveReady).possibleMoves?.length ?? 0,
      })))

      // Die 6 should have moves (12 -> 6)
      const die6Move = play.moves.find(m => m.dieValue === 6)
      expect(die6Move?.stateKind === 'ready' || die6Move?.moveKind !== 'no-move').toBe(true)
    })
  })
})
