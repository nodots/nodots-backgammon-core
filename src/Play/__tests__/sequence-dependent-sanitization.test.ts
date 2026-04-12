/**
 * Brutal tests for the sequence-dependent move bug.
 *
 * Bug: Game.roll() has a "sanitization" step that re-evaluates every
 * ready move against the static board AFTER Play.initialize(). When
 * Play.initialize() correctly marks a die as ready-but-sequence-dependent
 * (playable only after the other die is played first), the sanitization
 * overwrites it to completed/no-move because the static board check
 * finds zero moves.
 *
 * Fix: Play.createMovesForDiceValues tags sequence-dependent moves with
 * _sequenceDependent=true, and the sanitization skips them.
 *
 * These tests verify the fix survives for both clockwise and
 * counterclockwise players across multiple board configurations.
 */
import { Board, Play } from '../../index'
import type {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDiceStateKind,
  BackgammonDieValue,
  BackgammonMoveReady,
  BackgammonPlayerDirection,
  BackgammonPlayerMoving,
} from '@nodots-llc/backgammon-types'

function emptyBoard(): BackgammonBoard {
  const board = Board.initialize()
  for (const point of board.points) point.checkers = []
  board.bar.clockwise.checkers = []
  board.bar.counterclockwise.checkers = []
  board.off.clockwise.checkers = []
  board.off.counterclockwise.checkers = []
  return board
}

function placeCheckers(
  board: BackgammonBoard,
  color: BackgammonColor,
  direction: BackgammonPlayerDirection,
  positions: number[]
) {
  for (const pos of positions) {
    const point = board.points.find(p => p.position[direction] === pos)
    if (!point) throw new Error(`No point at ${direction} position ${pos}`)
    point.checkers.push({
      id: `${color}-${direction}-${pos}-${point.checkers.length}`,
      color,
      checkercontainerId: point.id,
      isMovable: color === 'white',
    })
  }
}

function makePlayer(
  color: BackgammonColor,
  direction: BackgammonPlayerDirection,
  roll: [BackgammonDieValue, BackgammonDieValue]
): BackgammonPlayerMoving {
  return {
    id: `test-${color}`,
    color,
    direction,
    stateKind: 'moving',
    isRobot: false,
    userId: `test-${color}`,
    pipCount: 0,
    dice: {
      id: 'dice',
      color,
      currentRoll: roll,
      total: roll[0] + roll[1],
      stateKind: 'rolled' as BackgammonDiceStateKind,
    },
  }
}

function moveSummary(play: { moves: any[] }) {
  return play.moves.map((m: any) => ({
    die: m.dieValue,
    state: m.stateKind,
    kind: m.moveKind,
    pm: m.possibleMoves?.length ?? 0,
    seq: !!(m as any)._sequenceDependent,
  }))
}

describe('Sequence-dependent move sanitization', () => {
  // ---------------------------------------------------------------
  // EXACT REPRODUCTION of the user's reported bug
  // ---------------------------------------------------------------
  describe('user-reported bug: clockwise [3,5], checker on 11, point 6 blocked', () => {
    let board: BackgammonBoard
    let player: BackgammonPlayerMoving

    beforeEach(() => {
      board = emptyBoard()
      // White (clockwise): 1(2), 2(3), 3(5), 4(3), 11(2) = 15 checkers
      placeCheckers(board, 'white', 'clockwise', [1,1, 2,2,2, 3,3,3,3,3, 4,4,4, 11,11])
      // Black (counterclockwise): 6cw(2), 18cw(2), 19cw(2), 20cw(2), 21cw(2), 22cw(3), 23cw(2)
      placeCheckers(board, 'black', 'clockwise', [6,6, 18,18, 19,19, 20,20, 21,21, 22,22,22, 23,23])
      player = makePlayer('white', 'clockwise', [3, 5])
    })

    it('die=5 must be ready, not no-move', () => {
      const play = Play.initialize(board, player)
      const die5 = play.moves.find(m => m.dieValue === 5)
      expect(die5?.stateKind).toBe('ready')
    })

    it('die=3 has exactly 2 possible moves (4→1 and 11→8)', () => {
      const play = Play.initialize(board, player)
      const die3 = play.moves.find(m => m.dieValue === 3) as BackgammonMoveReady
      expect(die3.possibleMoves.length).toBe(2)
      const origins = die3.possibleMoves.map(m => m.origin.position.clockwise).sort((a, b) => a - b)
      expect(origins).toEqual([4, 11])
    })

    it('after playing 11→8, die=5 recalculates to show 8→3', () => {
      const play = Play.initialize(board, player)
      const point11 = board.points.find(p => p.position.clockwise === 11)!
      const result = Play.move(board, play, point11)

      const die5after = result.play.moves.find(
        m => m.dieValue === 5 && m.stateKind === 'ready'
      ) as BackgammonMoveReady

      expect(die5after).toBeDefined()
      expect(die5after.possibleMoves.length).toBe(1)
      expect(die5after.possibleMoves[0].origin.position.clockwise).toBe(8)
      expect(die5after.possibleMoves[0].destination.position.clockwise).toBe(3)
    })

    it('both dice complete successfully when played in sequence', () => {
      const play = Play.initialize(board, player)
      const point11 = board.points.find(p => p.position.clockwise === 11)!
      const r1 = Play.move(board, play, point11)

      const point8 = r1.board.points.find(p => p.position.clockwise === 8)!
      const r2 = Play.move(r1.board, r1.play, point8)

      const completed = r2.play.moves.filter(
        m => m.stateKind === 'completed' && m.moveKind !== 'no-move'
      )
      expect(completed.length).toBe(2)
    })
  })

  // ---------------------------------------------------------------
  // Same pattern but reversed dice order: [5, 3]
  // ---------------------------------------------------------------
  describe('reversed dice order [5,3] same board', () => {
    it('die=5 must still be ready', () => {
      const board = emptyBoard()
      placeCheckers(board, 'white', 'clockwise', [1,1, 2,2,2, 3,3,3,3,3, 4,4,4, 11,11])
      placeCheckers(board, 'black', 'clockwise', [6,6, 18,18, 19,19, 20,20, 21,21, 22,22,22, 23,23])
      const player = makePlayer('white', 'clockwise', [5, 3])

      const play = Play.initialize(board, player)
      const die5 = play.moves.find(m => m.dieValue === 5)
      const die3 = play.moves.find(m => m.dieValue === 3)

      expect(die5?.stateKind).toBe('ready')
      expect(die3?.stateKind).toBe('ready')
    })
  })

  // ---------------------------------------------------------------
  // Counterclockwise player, same pattern
  // ---------------------------------------------------------------
  describe('counterclockwise player: [3,5], checker on 11ccw, point 6ccw blocked', () => {
    it('die=5 must be ready', () => {
      const board = emptyBoard()
      // Black (counterclockwise): 1(2), 2(3), 3(5), 4(3), 11(2) = 15
      placeCheckers(board, 'black', 'counterclockwise', [1,1, 2,2,2, 3,3,3,3,3, 4,4,4, 11,11])
      // White (clockwise) blocking point 6ccw = point 19cw: 2 checkers
      // Plus others scattered
      placeCheckers(board, 'white', 'counterclockwise', [6,6, 18,18, 19,19, 20,20, 21,21, 22,22,22, 23,23])

      const player = makePlayer('black', 'counterclockwise', [3, 5])
      const play = Play.initialize(board, player)

      const die5 = play.moves.find(m => m.dieValue === 5)
      expect(die5?.stateKind).toBe('ready')
    })
  })

  // ---------------------------------------------------------------
  // Checker must traverse through a blocked point: 12→8(4), 8→2(6)
  // Point 6 blocked so 12→6 impossible, but 12→8→2 works
  // ---------------------------------------------------------------
  describe('traverse through blocked point: [4,6] from 12, point 6 blocked', () => {
    it('die=6 stays ready when die=4 must be played first', () => {
      const board = emptyBoard()
      // White (clockwise) all 15 on point 12
      placeCheckers(board, 'white', 'clockwise', Array(15).fill(12))
      // Black blocking point 6cw and point 8cw... wait, 8 must be OPEN for 12→8
      // Block point 6 (so 12→6 with die=6 fails)
      // Block point 8? No, 8 must be open for the 4-move.
      // So: block 6cw with 2 black, leave 8cw open
      placeCheckers(board, 'black', 'clockwise', [6,6, 18,18, 19,19, 20,20, 21,21, 22,22, 23,23, 24,24])

      const player = makePlayer('white', 'clockwise', [4, 6])
      const play = Play.initialize(board, player)

      // Die 4: 12→8, legal (8 is open)
      // Die 6: 12→6, blocked. But after 12→8, 8→2 with 6 is legal
      const die6 = play.moves.find(m => m.dieValue === 6)
      const die4 = play.moves.find(m => m.dieValue === 4)

      expect(die4?.stateKind).toBe('ready')
      expect(die6?.stateKind).toBe('ready')
    })
  })

  // ---------------------------------------------------------------
  // Big dice: [6,6] doubles — all four dice blocked initially,
  // but each successive move opens the next.
  // This should NOT trigger sequence-dependent logic (doubles skip it).
  // ---------------------------------------------------------------
  describe('doubles are not affected by sequence-dependent logic', () => {
    it('[6,6] evaluates each die independently', () => {
      const board = emptyBoard()
      placeCheckers(board, 'white', 'clockwise', Array(15).fill(24))
      // Block 18cw so 24→18 fails
      placeCheckers(board, 'black', 'clockwise', [18,18, 1,1,1,1,1,1,1,1,1,1,1,1,1])

      const player = makePlayer('white', 'clockwise', [6, 6])
      const play = Play.initialize(board, player)

      // All four dice should be no-move since 24→18 is blocked and
      // there's no other 6-move from 24
      const noMoves = play.moves.filter(m => m.moveKind === 'no-move')
      expect(noMoves.length).toBe(4)
    })
  })

  // ---------------------------------------------------------------
  // Both dice have independent moves, but ONLY the sequence-dependent
  // ordering uses both. Die A can move checker X, die B can move
  // checker Y. But playing A on X then B on X-destination is the
  // only way to use both.
  //
  // IMPORTANT: The current fix only handles the case where one die
  // has ZERO moves. This test documents the broader case.
  // ---------------------------------------------------------------
  describe('edge: only one checker, two steps needed', () => {
    it('single checker on 14, dice [6,5], blocked at 8 and 9', () => {
      const board = emptyBoard()
      // White: single checker on 14cw, rest on 1cw (can't move 5 or 6 from 1)
      placeCheckers(board, 'white', 'clockwise', [14, 1,1,1,1,1,1,1,1,1,1,1,1,1,1])
      // Block 8cw (14-6=8) and 9cw (14-5=9)
      placeCheckers(board, 'black', 'clockwise', [8,8, 9,9, 20,20,20,20,20,20,20,20,20,20,20])

      const player = makePlayer('white', 'clockwise', [6, 5])
      const play = Play.initialize(board, player)

      // Both 14→8(6) and 14→9(5) are blocked
      // No other checker can move 5 or 6 (all on point 1, can't bear off with checker on 14)
      // Both dice should be no-move — there is no ordering that works
      const noMoves = play.moves.filter(m => m.moveKind === 'no-move')
      expect(noMoves.length).toBe(2)
    })

    it('single checker on 14, dice [6,3], blocked at 8 but not 11', () => {
      const board = emptyBoard()
      placeCheckers(board, 'white', 'clockwise', [14, 1,1,1,1,1,1,1,1,1,1,1,1,1,1])
      // Block 8cw (14-6=8), leave 11cw open (14-3=11), leave 5cw open (11-6=5)
      placeCheckers(board, 'black', 'clockwise', [8,8, 20,20,20,20,20,20,20,20,20,20,20,20,20])

      const player = makePlayer('white', 'clockwise', [6, 3])
      const play = Play.initialize(board, player)

      // Die 6: 14→8 blocked. Die 3: 14→11 legal.
      // After 14→11: 11→5 with 6 is legal (5 is open).
      // So die=6 should be ready (sequence-dependent).
      const die6 = play.moves.find(m => m.dieValue === 6)
      const die3 = play.moves.find(m => m.dieValue === 3)

      expect(die3?.stateKind).toBe('ready')
      expect(die6?.stateKind).toBe('ready')
    })
  })

  // ---------------------------------------------------------------
  // Bearing off edge case: checker outside home board prevents
  // bearing off, but after moving it in, bearing off is possible
  // ---------------------------------------------------------------
  describe('bearing off unlocked by moving last checker into home board', () => {
    it('die=3 moves checker 9→6, then die=5 bears off from 5', () => {
      const board = emptyBoard()
      // White (clockwise): one on 9, rest in home board
      placeCheckers(board, 'white', 'clockwise', [9, 5,5, 4,4,4, 3,3,3, 2,2,2, 1,1,1])
      // No blocking needed — the constraint is bearing-off legality
      placeCheckers(board, 'black', 'clockwise', Array(15).fill(24))

      const player = makePlayer('white', 'clockwise', [3, 5])
      const play = Play.initialize(board, player)

      // Die 5: can't bear off from 5 (checker on 9 outside home board)
      //         9→4 is legal independently
      // Die 3: 9→6 legal, and others in home board
      //
      // After 9→6: all checkers in home board, 5 can bear off from 5
      // But die 5 also has 9→4 as an independent move, so
      // possibleMoves.length > 0 for BOTH dice.
      // The current fix handles the case where one die has ZERO moves.
      // This case has both > 0, so it tests whether normal play works.
      const die5 = play.moves.find(m => m.dieValue === 5) as BackgammonMoveReady
      const die3 = play.moves.find(m => m.dieValue === 3) as BackgammonMoveReady

      expect(die5?.stateKind).toBe('ready')
      expect(die3?.stateKind).toBe('ready')
      // Die 5 should have at least the 9→4 move
      expect(die5.possibleMoves.length).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------
  // Stress: the blocked die is the LARGER die.
  // Backgammon rule: if only one die can be played, must play the
  // larger. But if BOTH can be played via sequence, both must be.
  // ---------------------------------------------------------------
  describe('blocked die is the larger die', () => {
    it('[2,6]: die=6 blocked, die=2 opens it', () => {
      const board = emptyBoard()
      // White: all on 10cw
      placeCheckers(board, 'white', 'clockwise', Array(15).fill(10))
      // Block 4cw (10-6=4), leave 8cw open (10-2=8), leave 2cw open (8-6=2)
      placeCheckers(board, 'black', 'clockwise', [4,4, 20,20,20,20,20,20,20,20,20,20,20,20,20])

      const player = makePlayer('white', 'clockwise', [2, 6])
      const play = Play.initialize(board, player)

      const die6 = play.moves.find(m => m.dieValue === 6)
      const die2 = play.moves.find(m => m.dieValue === 2)

      expect(die2?.stateKind).toBe('ready')
      expect(die6?.stateKind).toBe('ready')

      // Play die=2 first: 10→8
      const point10 = board.points.find(p => p.position.clockwise === 10)!
      const r1 = Play.move(board, play, point10)

      // Die=6 should now show 8→2
      const die6after = r1.play.moves.find(
        m => m.dieValue === 6 && m.stateKind === 'ready'
      ) as BackgammonMoveReady
      expect(die6after).toBeDefined()
      expect(die6after.possibleMoves.length).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------
  // Guard: a die that is genuinely unplayable in ANY ordering
  // must still be marked no-move, not kept ready forever
  // ---------------------------------------------------------------
  describe('genuinely unplayable die stays no-move', () => {
    it('[1,2]: all checkers on 1cw, no bearing off, both no-move', () => {
      const board = emptyBoard()
      placeCheckers(board, 'white', 'clockwise', Array(15).fill(1))
      placeCheckers(board, 'black', 'clockwise', Array(15).fill(24))

      // Can't move from 1 with die=1 or die=2 (would go off board, but
      // bearing off IS legal since all checkers are in home board)
      // Actually: all on point 1, die=1 → bear off, die=2 → bear off
      // This is legal. Let me use a different scenario.

      // All on point 24, no 1 or 2 move possible (points 23 and 22 blocked)
      const board2 = emptyBoard()
      placeCheckers(board2, 'white', 'clockwise', Array(15).fill(24))
      placeCheckers(board2, 'black', 'clockwise', [23,23, 22,22, 20,20,20,20,20,20,20,20,20,20,20])

      const player = makePlayer('white', 'clockwise', [1, 2])
      const play = Play.initialize(board2, player)

      const noMoves = play.moves.filter(m => m.moveKind === 'no-move')
      expect(noMoves.length).toBe(2)
    })
  })
})
