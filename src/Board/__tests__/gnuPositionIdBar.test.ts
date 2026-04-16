import { Board } from '../../Board'
import { Game } from '../../Game'
import { Player } from '../../Player'
import { exportToGnuPositionId } from '../gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import type { BackgammonBoard, BackgammonGame } from '@nodots-llc/backgammon-types'

const GNU_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodePidToBits(pid: string): string {
  let numBuffer = 0
  let numBits = 0
  const bytes: number[] = []
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
  let bitString = ''
  for (const byte of bytes) {
    for (let j = 0; j < 8; j++) {
      bitString += (byte >> j) & 1 ? '1' : '0'
    }
  }
  return bitString.substring(0, 80)
}

function parseSlots(bits: string): { points: number[]; bar: number } {
  const points: number[] = []
  let pos = 0
  for (let slot = 0; slot < 24; slot++) {
    let count = 0
    while (pos < bits.length && bits[pos] === '1') { count++; pos++ }
    if (pos < bits.length) pos++
    points.push(count)
  }
  let barCount = 0
  while (pos < bits.length && bits[pos] === '1') { barCount++; pos++ }
  if (pos < bits.length) pos++
  return { points, bar: barCount }
}

function putCheckerOnBar(
  board: BackgammonBoard,
  playerColor: 'white' | 'black',
  playerDirection: 'clockwise' | 'counterclockwise',
  sourceGnuPosition: number
): BackgammonBoard {
  const b = JSON.parse(JSON.stringify(board)) as BackgammonBoard
  const srcPoint = b.points.find(p => p.position[playerDirection] === sourceGnuPosition)
  if (!srcPoint) throw new Error(`No point at ${playerDirection} position ${sourceGnuPosition}`)
  const checkerIdx = srcPoint.checkers.findIndex(c => c.color === playerColor)
  if (checkerIdx < 0) throw new Error(`No ${playerColor} checker at position ${sourceGnuPosition}`)
  const checker = srcPoint.checkers.splice(checkerIdx, 1)[0]
  const barContainer = b.bar[playerDirection]
  barContainer.checkers.push({ ...checker, checkercontainerId: barContainer.id })
  return b
}

describe('GNU Position ID bar encoding', () => {
  beforeAll(async () => {
    await GnuBgHints.initialize()
    GnuBgHints.configure({ evalPlies: 0, moveFilter: 0, usePruning: true })
  })

  test('on-roll player bar checker is in TanBoard[1]', () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // White on roll, put white checker on bar
    const boardWithBar = putCheckerOnBar(board, 'white', 'clockwise', 6)
    const game = Game.initialize(
      [white, black] as any, undefined, 'rolling', boardWithBar,
      undefined, undefined, 'white', white, black
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const bits = decodePidToBits(pid)

    // Bitstream order: TanBoard[0] (opponent) first, TanBoard[1] (on-roll) second
    const opponentSlots = parseSlots(bits.substring(0, 40))
    const onRollSlots = parseSlots(bits.substring(40, 80))

    expect(onRollSlots.bar).toBe(1)
    expect(opponentSlots.bar).toBe(0)
    expect(onRollSlots.points.reduce((a, b) => a + b, 0) + onRollSlots.bar).toBe(15)
    expect(opponentSlots.points.reduce((a, b) => a + b, 0) + opponentSlots.bar).toBe(15)
  })

  test('opponent bar checker is in TanBoard[0]', () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    // White on roll, put BLACK checker on bar (opponent)
    const boardWithBar = putCheckerOnBar(board, 'black', 'counterclockwise', 6)
    const game = Game.initialize(
      [white, black] as any, undefined, 'rolling', boardWithBar,
      undefined, undefined, 'white', white, black
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const bits = decodePidToBits(pid)

    const opponentSlots = parseSlots(bits.substring(0, 40))
    const onRollSlots = parseSlots(bits.substring(40, 80))

    expect(onRollSlots.bar).toBe(0)
    expect(opponentSlots.bar).toBe(1)
  })

  test('GNU returns bar entry hints when on-roll player has checker on bar', async () => {
    const board = Board.initialize()
    const black = Player.initialize('black', 'counterclockwise', 'rolling', true, 'b1')
    const white = Player.initialize('white', 'clockwise', 'inactive', true, 'w1')

    const boardWithBar = putCheckerOnBar(board, 'black', 'counterclockwise', 6)
    const game = Game.initialize(
      [white, black] as any, undefined, 'rolling', boardWithBar,
      undefined, undefined, 'black', black, white
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [4, 3]
    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'counterclockwise', 'black')

    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    // GNU represents bar entry as from=24 (the 25th point, 0-indexed)
    // or from=25 depending on the addon's translation layer
    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step =>
        step.from === 0 || step.from === 24 || step.from === 25 ||
        step.fromContainer === 'bar'
      )
    )
    expect(hasBarEntry).toBe(true)
  })

  test('GNU returns bar entry hints for clockwise player on bar', async () => {
    const board = Board.initialize()
    const white = Player.initialize('white', 'clockwise', 'rolling', true, 'w1')
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'b1')

    const boardWithBar = putCheckerOnBar(board, 'white', 'clockwise', 6)
    const game = Game.initialize(
      [white, black] as any, undefined, 'rolling', boardWithBar,
      undefined, undefined, 'white', white, black
    ) as any as BackgammonGame

    const pid = exportToGnuPositionId(game)
    const dice: [number, number] = [6, 5]
    const hints = await GnuBgHints.getHintsFromPositionId(pid, dice, 5, 'clockwise', 'white')

    expect(hints).toBeTruthy()
    expect(hints!.length).toBeGreaterThan(0)

    const hasBarEntry = hints!.some(hint =>
      hint.moves.some(step =>
        step.from === 0 || step.from === 24 || step.from === 25 ||
        step.fromContainer === 'bar'
      )
    )
    expect(hasBarEntry).toBe(true)
  })
})
