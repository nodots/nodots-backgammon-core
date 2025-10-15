import { Board } from '../../Board'
import { Game } from '../../Game'
import { Player } from '../../Player'
import { exportToGnuPositionId } from '../gnuPositionId'
import { logger } from '../../utils/logger'
import type { BackgammonColor } from '@nodots-llc/backgammon-types'

describe('GNU Position ID canonical starting position', () => {
  test('starting position ID matches 4HPwATDgc/ABMA for one side on roll', () => {
    const board = Board.initialize()

    // Create players with deterministic directions matching board default
    const white = Player.initialize('white', 'clockwise', 'rolling', true)
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true)
    const players = [white, black] as [typeof white, typeof black]

    const gameWhite = Game.initialize(
      players,
      undefined,
      'rolling',
      board,
      undefined,
      undefined,
      'white',
      white,
      black
    ) as any

    const pidWhite = exportToGnuPositionId(gameWhite)

    // Also test black on roll
    const whiteInactive = Player.initialize('white', 'clockwise', 'inactive', true)
    const blackRolling = Player.initialize('black', 'counterclockwise', 'rolling', true)
    const gameBlack = Game.initialize(
      [whiteInactive, blackRolling] as any,
      undefined,
      'rolling',
      board,
      undefined,
      undefined,
      'black',
      blackRolling,
      whiteInactive
    ) as any
    const pidBlack = exportToGnuPositionId(gameBlack)
    const expected = '4HPwATDgc/ABMA'
    // Accept either white or black as the position on roll that matches the canonical ID
    const ok = pidWhite === expected || pidBlack === expected
    if (!ok) {
      // Brute-force search combinations to find the correct stream ordering
      const GNU_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const board = gameWhite.board
      const playerOnRoll = gameWhite.players.find((p: any) => p.stateKind === 'rolling')
      const opponent = gameWhite.players.find((p: any) => p.id !== playerOnRoll.id)

      const emitCountsOnesZero = (counts: number[]) => counts.flatMap((n) => ['1'.repeat(n) + '0']).join('')
      const getCountsFor = (
        color: BackgammonColor,
        perspective: 'clockwise' | 'counterclockwise',
        order: 'asc' | 'desc'
      ) => {
        const arr: number[] = []
        const positions = order === 'asc' ? [...Array(24)].map((_, i) => i + 1) : [...Array(24)].map((_, i) => 24 - i)
        for (const pos of positions) {
          const point = board.points.find((p: any) => p.position[perspective] === pos)
          const n = point ? point.checkers.filter((c: any) => c.color === color).length : 0
          arr.push(n)
        }
        return arr
      }
      const emitCounts = (counts: number[], scheme: 'onesZero' | 'zeroOnes') =>
        counts.map((n) => (scheme === 'onesZero' ? '1'.repeat(n) + '0' : '0' + '1'.repeat(n))).join('')
      const toB64Six = (bitString: string, reverse = false, padAt: 'end' | 'start' = 'end') => {
        const s = reverse ? bitString.split('').reverse().join('') : bitString
        let out = ''
        for (let i = 0; i < 14; i++) {
          const start = i * 6
          let bits = s.substring(start, start + 6)
          if (bits.length < 6) bits = padAt === 'end' ? bits.padEnd(6, '0') : bits.padStart(6, '0')
          let value = 0
          for (let j = 0; j < 6; j++) if (bits[j] === '1') value |= 1 << (5 - j)
          out += GNU_BASE64[value]
        }
        return out
      }
      const toB64Bytes = (bitString: string, perByte: 'lsb' | 'msb', reverse = false, padAt: 'end' | 'start' = 'end') => {
        const s = reverse ? bitString.split('').reverse().join('') : bitString
        // Build 10 bytes, then base64 over the 80-bit stream
        const bytes: number[] = []
        for (let i = 0; i < 10; i++) {
          const seg = s.substring(i * 8, (i + 1) * 8)
          const byteBits = seg.length < 8 ? (padAt === 'end' ? seg.padEnd(8, '0') : seg.padStart(8, '0')) : seg
          let v = 0
          for (let j = 0; j < 8; j++) {
            if (byteBits[j] === '1') v |= perByte === 'lsb' ? 1 << j : 1 << (7 - j)
          }
          bytes.push(v)
        }
        // Now base64 across the 80 bits MSB-first per 6-bit chunk
        let base64Chars = ''
        let numBuffer = 0
        let numBits = 0
        for (let i = 0; i < bytes.length; i++) {
          numBuffer = (numBuffer << 8) | bytes[i]
          numBits += 8
          while (numBits >= 6) {
            numBits -= 6
            const chunk = (numBuffer >> numBits) & 0x3f
            base64Chars += GNU_BASE64[chunk]
          }
        }
        if (numBits > 0) {
          const chunk = (numBuffer << (6 - numBits)) & 0x3f
          base64Chars += GNU_BASE64[chunk]
        }
        return base64Chars.substring(0, 14)
      }
      const combos: Array<[
        'playerFirst' | 'opponentFirst',
        'asc' | 'desc',
        'player' | 'opponent',
        'clockwise' | 'counterclockwise',
        'onesZero' | 'zeroOnes',
        'six' | 'bytesLsb' | 'bytesMsb',
        'barBefore' | 'barAfter',
        boolean, // reverse stream
        'end' | 'start' // pad at end or start
      ]> = []
      for (const sideOrder of ['playerFirst', 'opponentFirst'] as const) {
        for (const order of ['asc', 'desc'] as const) {
          for (const oppPersp of ['player', 'opponent'] as const) {
            for (const persp of ['clockwise', 'counterclockwise'] as const) {
              for (const scheme of ['onesZero', 'zeroOnes'] as const) {
                for (const pack of ['six', 'bytesLsb', 'bytesMsb'] as const) {
                  for (const barPos of ['barBefore', 'barAfter'] as const) {
                    for (const reverse of [false, true]) {
                      for (const padAt of ['end', 'start'] as const) {
                        combos.push([sideOrder, order, oppPersp, persp, scheme, pack, barPos, reverse, padAt])
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Build expected 80-bit stream from canonical base64
      const b64ToBits = (b64: string) => {
        const bitsArr: string[] = []
        for (let i = 0; i < b64.length; i++) {
          const idx = GNU_BASE64.indexOf(b64[i])
          let s = idx.toString(2)
          if (s.length < 6) s = '0'.repeat(6 - s.length) + s
          bitsArr.push(s)
        }
        const full = bitsArr.join('')
        return full.substring(0, 80)
      }
      const expectedBits = b64ToBits(expected)

      // Additionally, try fixed X/O color mapping independent of turn
      const colors: BackgammonColor[] = ['white', 'black'] as any
      for (const xColor of colors) {
        const oColor: BackgammonColor = (xColor === 'white' ? 'black' : 'white') as any
        for (const [sideOrder, order, oppPersp, persp, scheme, pack, barPos, reverse, padAt] of combos) {
          let bitString = ''
          const playerDir = persp
          const oppDir = playerDir === 'clockwise' ? 'counterclockwise' : 'clockwise'
          const seq: Array<'x' | 'o'> = sideOrder === 'playerFirst' ? ['x', 'o'] : ['o', 'x']
          for (const who of seq) {
            if (who === 'x') {
              const countsP = getCountsFor(xColor, playerDir, order)
              const encodedCounts = scheme === 'onesZero' ? emitCountsOnesZero(countsP) : countsP.map((n) => '0' + '1'.repeat(n)).join('')
              // Bars: sum both directions for the color
              const cnt = board.bar.clockwise.checkers.concat(board.bar.counterclockwise.checkers).filter((c: any) => c.color === xColor).length
              const encodedBar = scheme === 'onesZero' ? '1'.repeat(cnt) + '0' : '0' + '1'.repeat(cnt)
              bitString += barPos === 'barBefore' ? encodedBar + encodedCounts : encodedCounts + encodedBar
            } else {
              const countsO = getCountsFor(oColor, playerDir, order)
              const encodedCountsO = scheme === 'onesZero' ? emitCountsOnesZero(countsO) : countsO.map((n) => '0' + '1'.repeat(n)).join('')
              const cnt = board.bar.clockwise.checkers.concat(board.bar.counterclockwise.checkers).filter((c: any) => c.color === oColor).length
              const encodedBarO = scheme === 'onesZero' ? '1'.repeat(cnt) + '0' : '0' + '1'.repeat(cnt)
              bitString += barPos === 'barBefore' ? encodedBarO + encodedCountsO : encodedCountsO + encodedBarO
            }
          }
          const pidSix = toB64Six(bitString, reverse, padAt)
          const pidBytesLsb = toB64Bytes(bitString, 'lsb', reverse, padAt)
          const pidBytesMsb = toB64Bytes(bitString, 'msb', reverse, padAt)
          const matchBits = bitString === expectedBits
          const pick = pack === 'six' ? pidSix : pack === 'bytesLsb' ? pidBytesLsb : pidBytesMsb
          const matchPid = pick === expected
          if (matchBits || matchPid) {
            logger.info('Found canonical ordering:', { sideOrder, order, oppPersp, persp, scheme, pack, barPos, reverse, padAt, matchBits, matchPid, pidSix, pidBytesLsb, pidBytesMsb })
            logger.info('Expected canonical PID:', expected)
          }
        }
      }
      logger.info('Canonical PID check', { pidWhite, pidBlack })
    }
    expect(ok).toBeTruthy()
  })
})
