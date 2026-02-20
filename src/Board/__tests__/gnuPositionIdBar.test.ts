import { Board } from '../../Board'
import { Game } from '../../Game'
import { Player } from '../../Player'
import { exportToGnuPositionId } from '../gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { generateId } from '../../'
import type { BackgammonBoard, BackgammonGame, BackgammonChecker } from '@nodots-llc/backgammon-types'

// GNU BG base64 alphabet
const GNU_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// Decode a GNU Position ID back into a bit string for inspection
function decodePidToBits(pid: string): string {
  const bytes: number[] = []
  let numBuffer = 0
  let numBits = 0

  // Decode base64 -> bytes (reverse of the encoding process)
  for (let i = 0; i < pid.length; i++) {
    const idx = GNU_BASE64.indexOf(pid[i])
    if (idx < 0) continue
    numBuffer = (numBuffer << 6) | idx
    numBits += 6
    while (numBits >= 8) {
      numBits -= 8
      bytes.push((numBuffer >> numBits) & 0xff)
    }
  }

  // Convert bytes to bit string (LSB-first within each byte, matching encoder)
  let bitString = ''
  for (const byte of bytes) {
    for (let j = 0; j < 8; j++) {
      bitString += (byte >> j) & 1 ? '1' : '0'
    }
  }

  return bitString.substring(0, 80)
}

// Parse checkers from a 25-slot section of the bit string (24 points + bar)
// Each slot is: N ones followed by a zero, where N = number of checkers
function parseSlots(bits: string): { points: number[]; bar: number } {
  const points: number[] = []
  let pos = 0
  for (let slot = 0; slot < 24; slot++) {
    let count = 0
    while (pos < bits.length && bits[pos] === '1') {
      count++
      pos++
    }
    // Skip the trailing zero
    if (pos < bits.length) pos++
    points.push(count)
  }
  // Bar slot
  let barCount = 0
  while (pos < bits.length && bits[pos] === '1') {
    barCount++
    pos++
  }
  if (pos < bits.length) pos++ // trailing zero
  return { points, bar: barCount }
}

// Helper: modify a board to put a checker on the bar for a specific player
function putCheckerOnBar(
  board: BackgammonBoard,
  playerColor: 'white' | 'black',
  playerDirection: 'clockwise' | 'counterclockwise',
  sourceGnuPosition: number // which point to remove checker from (player's perspective)
): BackgammonBoard {
  // Deep clone
  const b = JSON.parse(JSON.stringify(board)) as BackgammonBoard

  // Find the source point (using direction lookup per Golden Rule)
  const srcPoint = b.points.find(p => p.position[playerDirection] === sourceGnuPosition)
  if (!srcPoint) throw new Error(`No point found at ${playerDirection} position ${sourceGnuPosition}`)

  const checkerIdx = srcPoint.checkers.findIndex(c => c.color === playerColor)
  if (checkerIdx < 0) throw new Error(`No ${playerColor} checker at ${playerDirection} position ${sourceGnuPosition}`)

  // Remove checker from point
  const checker = srcPoint.checkers.splice(checkerIdx, 1)[0]

  // Add to bar with correct direction
  const barContainer = b.bar[playerDirection]
  barContainer.checkers.push({
    ...checker,
    checkercontainerId: barContainer.id,
  })

  return b
}

describe('GNU Position ID bar encoding', () => {
  beforeAll(async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 0, moveFilter: 0, usePruning: true })
  })

  test('counterclockwise player bar checkers are encoded in position ID', () => {
    // Create a deterministic game: white=clockwise, black=counterclockwise
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // Encode starting position first (no bar checkers)
    const gameNoBar = Game.initialize(
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

    const pidNoBar = exportToGnuPositionId(gameNoBar)
    const bitsNoBar = decodePidToBits(pidNoBar)
    const playerSlotsNoBar = parseSlots(bitsNoBar.substring(0, 40))
    const opponentSlotsNoBar = parseSlots(bitsNoBar.substring(40, 80))

    // Verify no bar checkers in starting position
    expect(playerSlotsNoBar.bar).toBe(0)
    expect(opponentSlotsNoBar.bar).toBe(0)
    // Verify total checker count is correct (15 each)
    const playerTotal = playerSlotsNoBar.points.reduce((a, b) => a + b, 0) + playerSlotsNoBar.bar
    const oppTotal = opponentSlotsNoBar.points.reduce((a, b) => a + b, 0) + opponentSlotsNoBar.bar
    expect(playerTotal).toBe(15)
    expect(oppTotal).toBe(15)

    // Now put a black (counterclockwise) checker on the bar
    // Remove from black's starting position 6 (counterclockwise perspective)
    const boardWithBar = putCheckerOnBar(board, 'black', 'counterclockwise', 6)

    const gameWithBar = Game.initialize(
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

    const pidWithBar = exportToGnuPositionId(gameWithBar)
    const bitsWithBar = decodePidToBits(pidWithBar)

    // Canonical encoding: TanBoard[0] = clockwise (white), TanBoard[1] = counterclockwise (black)
    const cwSlots = parseSlots(bitsWithBar.substring(0, 40))
    const ccwSlots = parseSlots(bitsWithBar.substring(40, 80))

    // Clockwise (white) should have 0 bar checkers
    expect(cwSlots.bar).toBe(0)
    // Counterclockwise (black) should have 1 bar checker
    expect(ccwSlots.bar).toBe(1)

    // Total should still be 15 each
    const cwTotal = cwSlots.points.reduce((a, b) => a + b, 0) + cwSlots.bar
    const ccwTotal = ccwSlots.points.reduce((a, b) => a + b, 0) + ccwSlots.bar
    expect(cwTotal).toBe(15)
    expect(ccwTotal).toBe(15)
  })

  test('clockwise player bar checkers are encoded in position ID', () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'inactive', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'rolling', true, 'b1')

    // Put a white (clockwise) checker on the bar
    const boardWithBar = putCheckerOnBar(board, 'white', 'clockwise', 6)

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
    const bits = decodePidToBits(pid)

    // Canonical encoding: TanBoard[0] = clockwise (white), TanBoard[1] = counterclockwise (black)
    const cwSlots = parseSlots(bits.substring(0, 40))
    const ccwSlots = parseSlots(bits.substring(40, 80))

    // Clockwise (white) should have 1 bar checker
    expect(cwSlots.bar).toBe(1)
    // Counterclockwise (black) should have 0 bar checkers
    expect(ccwSlots.bar).toBe(0)

    // Total should be 15 each
    const cwTotal = cwSlots.points.reduce((a, b) => a + b, 0) + cwSlots.bar
    const ccwTotal = ccwSlots.points.reduce((a, b) => a + b, 0) + ccwSlots.bar
    expect(cwTotal).toBe(15)
    expect(ccwTotal).toBe(15)
  })

  test('GNU returns bar entry hints when counterclockwise player has checker on bar', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'inactive', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'rolling', true, 'b1')

    // Put black checker on bar (remove from ccw position 6)
    const boardWithBar = putCheckerOnBar(board, 'black', 'counterclockwise', 6)

    // Black on roll with checker on bar
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
    // Pass activePlayerDirection='counterclockwise' because black (CCW) is on roll
    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'counterclockwise', 'black')

    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // At least one hint should include a bar entry (from=0, fromContainer='bar')
    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step =>
        step.from === 0 && step.fromContainer === 'bar'
      )
    )
    expect(hasBarEntry).toBe(true)
  })

  test('GNU returns bar entry hints when clockwise player has checker on bar', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // Put white checker on bar (remove from cw position 6)
    const boardWithBar = putCheckerOnBar(board, 'white', 'clockwise', 6)

    // White on roll with checker on bar
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
    // Pass activePlayerDirection='clockwise' because white (CW) is on roll
    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'clockwise', 'white')

    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // At least one hint should include a bar entry
    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step =>
        step.from === 0 && step.fromContainer === 'bar'
      )
    )
    expect(hasBarEntry).toBe(true)
  })
})
