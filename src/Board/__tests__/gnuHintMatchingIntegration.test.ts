import { Board } from '../../Board'
import { Game } from '../../Game'
import { Player } from '../../Player'
import { Dice } from '../../Dice'
import { Play } from '../../Play'
import { exportToGnuPositionId } from '../gnuPositionId'
import { GnuBgHints, MoveStep, MoveHint } from '@nodots-llc/gnubg-hints'
import { generateId } from '../../'
import type {
  BackgammonBoard,
  BackgammonGame,
  BackgammonMoveReady,
  BackgammonPlayerMoving,
  BackgammonMoveDirection,
  BackgammonDieValue,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'

// Helper: modify a board to put a checker on the bar for a specific player
// Copied from gnuPositionIdBar.test.ts
function putCheckerOnBar(
  board: BackgammonBoard,
  playerColor: 'white' | 'black',
  playerDirection: 'clockwise' | 'counterclockwise',
  sourceGnuPosition: number
): BackgammonBoard {
  const b = JSON.parse(JSON.stringify(board)) as BackgammonBoard
  const srcPoint = b.points.find(p => p.position[playerDirection] === sourceGnuPosition)
  if (!srcPoint) throw new Error(`No point found at ${playerDirection} position ${sourceGnuPosition}`)
  const checkerIdx = srcPoint.checkers.findIndex(c => c.color === playerColor)
  if (checkerIdx < 0) throw new Error(`No ${playerColor} checker at ${playerDirection} position ${sourceGnuPosition}`)
  const checker = srcPoint.checkers.splice(checkerIdx, 1)[0]
  const barContainer = b.bar[playerDirection]
  barContainer.checkers.push({
    ...checker,
    checkercontainerId: barContainer.id,
  })
  return b
}

/**
 * For a given GNU hint step, find the matching CORE legal move among the
 * ready moves. Returns undefined if no match is found (which means the
 * position ID encoding or hint interpretation is broken).
 */
function matchHintStepToLegalMove(
  hintStep: MoveStep,
  readyMoves: BackgammonMoveReady[],
  activeDirection: BackgammonMoveDirection
): BackgammonMoveReady | undefined {
  // Compute the expected die value from the hint step
  let expectedDie: number
  if (hintStep.fromContainer === 'bar') {
    expectedDie = 25 - hintStep.to
  } else if (hintStep.toContainer === 'off') {
    expectedDie = hintStep.from
  } else {
    expectedDie = hintStep.from - hintStep.to
  }

  for (const move of readyMoves) {
    if (move.dieValue !== expectedDie) continue
    if (!move.possibleMoves) continue

    for (const pm of move.possibleMoves) {
      // Match origin
      const originMatches = hintStep.fromContainer === 'bar'
        ? pm.origin.kind === 'bar'
        : pm.origin.kind === 'point' &&
          'clockwise' in pm.origin.position &&
          (pm.origin.position as { clockwise: number; counterclockwise: number })[activeDirection] === hintStep.from

      if (!originMatches) continue

      // Match destination
      const destMatches = hintStep.toContainer === 'off'
        ? pm.destination.kind === 'off'
        : pm.destination.kind === 'point' &&
          'clockwise' in pm.destination.position &&
          (pm.destination.position as { clockwise: number; counterclockwise: number })[activeDirection] === hintStep.to

      if (!destMatches) continue

      return move
    }
  }
  return undefined
}

/**
 * Build a deterministic moving player with specific dice values.
 * Player.initialize creates inactive dice; this constructs rolled dice manually.
 */
function buildMovingPlayer(
  color: 'white' | 'black',
  direction: BackgammonMoveDirection,
  die1: BackgammonDieValue,
  die2: BackgammonDieValue
): BackgammonPlayerMoving {
  const base = Player.initialize(color, direction, 'moving', true, `test-${color}`)
  const dice = Dice.initialize(color, 'rolled', undefined, [die1, die2])
  return {
    ...base,
    stateKind: 'moving',
    dice,
  } as BackgammonPlayerMoving
}

describe('GNU hint-to-CORE move matching integration', () => {
  beforeAll(async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 0, moveFilter: 0, usePruning: true })
  })

  test('clockwise player on roll, opening position - hints match CORE legal moves', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // Build game for position ID encoding
    const game = Game.initialize(
      [white, black] as any,
      undefined,
      'rolling',
      board,
      undefined,
      undefined,
      'white',
      white,
      black
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [3, 1]

    // Get GNU hints
    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'clockwise', 'white')
    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // Build deterministic moving player and play for CORE legal moves
    const movingPlayer = buildMovingPlayer('white', 'clockwise', 3 as BackgammonDieValue, 1 as BackgammonDieValue)
    const play = Play.initialize(board, movingPlayer)
    const readyMoves = play.moves.filter(m => m.stateKind === 'ready') as BackgammonMoveReady[]

    // Verify top-ranked hint (rank 1) matches CORE legal moves
    const topHint = hints!.find(h => h.rank === 1) || hints![0]
    for (const step of topHint.moves) {
      const match = matchHintStepToLegalMove(step, readyMoves, 'clockwise')
      expect(match).toBeDefined()
      if (match) {
        // Verify moveKind agreement
        const matchingPm = match.possibleMoves.find(pm => {
          if (step.fromContainer === 'bar') return pm.origin.kind === 'bar'
          if (step.toContainer === 'off') return pm.destination.kind === 'off'
          return pm.origin.kind === 'point' &&
            'clockwise' in pm.origin.position &&
            (pm.origin.position as any).clockwise === step.from
        })
        if (matchingPm) {
          // Derive moveKind from the possible move's origin/destination
          let coreMoveKind: string
          if (matchingPm.origin.kind === 'bar') coreMoveKind = 'reenter'
          else if (matchingPm.destination.kind === 'off') coreMoveKind = 'bear-off'
          else coreMoveKind = 'point-to-point'
          expect(step.moveKind).toBe(coreMoveKind)
        }
      }
    }
  })

  test('counterclockwise player on roll, opening position - hints match CORE legal moves', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'inactive', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'rolling', true, 'b1')

    const game = Game.initialize(
      [white, black] as any,
      undefined,
      'rolling',
      board,
      undefined,
      undefined,
      'black',
      black,
      white
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [4, 2]

    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'counterclockwise', 'black')
    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    const movingPlayer = buildMovingPlayer('black', 'counterclockwise', 4 as BackgammonDieValue, 2 as BackgammonDieValue)
    const play = Play.initialize(board, movingPlayer)
    const readyMoves = play.moves.filter(m => m.stateKind === 'ready') as BackgammonMoveReady[]

    const topHint = hints!.find(h => h.rank === 1) || hints![0]
    for (const step of topHint.moves) {
      const match = matchHintStepToLegalMove(step, readyMoves, 'counterclockwise')
      expect(match).toBeDefined()
      if (match) {
        let coreMoveKind: string
        const matchingPm = match.possibleMoves.find(pm => {
          if (step.fromContainer === 'bar') return pm.origin.kind === 'bar'
          if (step.toContainer === 'off') return pm.destination.kind === 'off'
          return pm.origin.kind === 'point' &&
            'counterclockwise' in pm.origin.position &&
            (pm.origin.position as any).counterclockwise === step.from
        })
        if (matchingPm) {
          if (matchingPm.origin.kind === 'bar') coreMoveKind = 'reenter'
          else if (matchingPm.destination.kind === 'off') coreMoveKind = 'bear-off'
          else coreMoveKind = 'point-to-point'
          expect(step.moveKind).toBe(coreMoveKind)
        }
      }
    }
  })

  test('counterclockwise player on bar - bar reentry hint matches CORE legal move', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'inactive', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'rolling', true, 'b1')

    // Put black checker on bar (remove from ccw position 6)
    const boardWithBar = putCheckerOnBar(board, 'black', 'counterclockwise', 6)

    const game = Game.initialize(
      [white, black] as any,
      undefined,
      'rolling',
      boardWithBar,
      undefined,
      undefined,
      'black',
      black,
      white
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [4, 3]

    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'counterclockwise', 'black')
    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // Verify at least one hint has a bar entry step
    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step => step.from === 0 && step.fromContainer === 'bar')
    )
    expect(hasBarEntry).toBe(true)

    const movingPlayer = buildMovingPlayer('black', 'counterclockwise', 4 as BackgammonDieValue, 3 as BackgammonDieValue)
    const play = Play.initialize(boardWithBar, movingPlayer)
    const readyMoves = play.moves.filter(m => m.stateKind === 'ready') as BackgammonMoveReady[]

    const topHint = hints!.find(h => h.rank === 1) || hints![0]
    let foundBarStep = false
    for (const step of topHint.moves) {
      const match = matchHintStepToLegalMove(step, readyMoves, 'counterclockwise')
      expect(match).toBeDefined()
      if (step.fromContainer === 'bar') {
        foundBarStep = true
        // The matched CORE move should be a reentry
        if (match) {
          const barPm = match.possibleMoves.find(pm => pm.origin.kind === 'bar')
          expect(barPm).toBeDefined()
        }
      }
    }
    expect(foundBarStep).toBe(true)
  })

  test('clockwise player on bar - bar reentry hint matches CORE legal move', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // Put white checker on bar (remove from cw position 6)
    const boardWithBar = putCheckerOnBar(board, 'white', 'clockwise', 6)

    const game = Game.initialize(
      [white, black] as any,
      undefined,
      'rolling',
      boardWithBar,
      undefined,
      undefined,
      'white',
      white,
      black
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [4, 3]

    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'clockwise', 'white')
    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // Verify at least one hint has a bar entry step
    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step => step.from === 0 && step.fromContainer === 'bar')
    )
    expect(hasBarEntry).toBe(true)

    const movingPlayer = buildMovingPlayer('white', 'clockwise', 4 as BackgammonDieValue, 3 as BackgammonDieValue)
    const play = Play.initialize(boardWithBar, movingPlayer)
    const readyMoves = play.moves.filter(m => m.stateKind === 'ready') as BackgammonMoveReady[]

    const topHint = hints!.find(h => h.rank === 1) || hints![0]
    let foundBarStep = false
    for (const step of topHint.moves) {
      const match = matchHintStepToLegalMove(step, readyMoves, 'clockwise')
      expect(match).toBeDefined()
      if (step.fromContainer === 'bar') {
        foundBarStep = true
        if (match) {
          const barPm = match.possibleMoves.find(pm => pm.origin.kind === 'bar')
          expect(barPm).toBeDefined()
        }
      }
    }
    expect(foundBarStep).toBe(true)
  })
})
