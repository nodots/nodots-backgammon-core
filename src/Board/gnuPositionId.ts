import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import { logger } from '../utils/logger'

/**
 * Direction semantics for GNU Position ID
 * - Nodots points carry both `position.clockwise` and `position.counterclockwise` labels.
 * - When encoding to GNU Position ID, we iterate points strictly in the on-roll
 *   player's own `direction` (clockwise = index 0..23; counterclockwise = 23..0).
 * - The opponent section is likewise emitted using the opponent's own direction.
 * - Bars are counted from each player's own bar container.
 * - No additional flipping, inversion (25 - n), or cross-perspective translation
 *   is performed here. Consumers must interpret GNU indices in the active
 *   player's perspective when mapping moves back to Nodots.
 */

const GNU_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function getPlayerAndOpponent(game: BackgammonGame): { playerOnRoll: BackgammonPlayer; opponent: BackgammonPlayer } {
  let playerOnRoll: BackgammonPlayer | undefined
  switch (game.stateKind) {
    case 'moving':
      playerOnRoll = (game as BackgammonGameMoving).activePlayer
      break
    case 'rolled-for-start':
      playerOnRoll = (game as any).activePlayer
      break
    case 'rolling-for-start':
      playerOnRoll = game.players.find((p) => p.color === 'white') ?? game.players[0]
      logger.info(`Using ${playerOnRoll?.color} as player on roll for rolling-for-start state`)
      break
    case 'rolling':
    case 'doubled':
    case 'moved':
      playerOnRoll = (game as any).activePlayer
      break
    case 'completed': {
      const winner = (game as any).winner
      playerOnRoll = winner ? (game.players.find((p) => p.id === winner.id) as any) : game.players[0]
      break
    }
  }
  if (!playerOnRoll) throw new Error('Could not determine player on roll.')
  const opponent = game.players.find((p) => p.id !== playerOnRoll!.id)
  if (!opponent) throw new Error('Opponent not found')
  return { playerOnRoll: playerOnRoll!, opponent }
}

function getCheckersOnPoint(board: BackgammonBoard, color: BackgammonColor, index: number): number {
  if (index < 0 || index > 23) return 0
  const point = board.points[index]
  return point.checkers.filter((c) => c.color === color).length
}

function getCheckersOnBar(board: BackgammonBoard, player: BackgammonPlayer): number {
  const barForPlayer = board.bar[player.direction]
  return barForPlayer.checkers.filter((c) => c.color === player.color).length
}

function encodeBase64Six(bitString: string): string {
  let out = ''
  for (let i = 0; i < 14; i++) {
    const start = i * 6
    let bits = bitString.substring(start, start + 6)
    if (bits.length < 6) bits = bits.padEnd(6, '0')
    let value = 0
    for (let j = 0; j < 6; j++) if (bits[j] === '1') value |= 1 << (5 - j)
    out += GNU_BASE64[value]
  }
  return out
}

function encodeBase64ViaBytesLSB(bitString: string): string {
  const bytes: number[] = []
  for (let i = 0; i < 10; i++) {
    const byteBits = bitString.substring(i * 8, (i + 1) * 8)
    let byteValue = 0
    for (let j = 0; j < 8; j++) {
      if (byteBits[j] === '1') byteValue |= 1 << j
    }
    bytes.push(byteValue)
  }
  let base64Chars = ''
  let numBuffer = 0
  let numBits = 0
  for (let i = 0; i < bytes.length; ++i) {
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

export function exportToGnuPositionId(game: BackgammonGame): string {
  const { board } = game
  const { playerOnRoll, opponent } = getPlayerAndOpponent(game)

  let bitString = ''

  // Player on roll points 0..23 in array order for clockwise, reversed for counterclockwise
  for (let i = 0; i < 24; i++) {
    const idx = playerOnRoll.direction === 'clockwise' ? i : 23 - i
    const checkers = getCheckersOnPoint(board, playerOnRoll.color, idx)
    bitString += '1'.repeat(checkers) + '0'
  }
  const playerBarCheckers = getCheckersOnBar(board, playerOnRoll)
  bitString += '1'.repeat(playerBarCheckers) + '0'

  // Opponent points
  for (let i = 0; i < 24; i++) {
    const idx = opponent.direction === 'clockwise' ? i : 23 - i
    const checkers = getCheckersOnPoint(board, opponent.color, idx)
    bitString += '1'.repeat(checkers) + '0'
  }
  const opponentBarCheckers = getCheckersOnBar(board, opponent)
  bitString += '1'.repeat(opponentBarCheckers) + '0'

  if (bitString.length > 80) {
    logger.warn('[GnuPositionId] Bit string too long, truncating:', {
      originalLength: bitString.length,
      maxLength: 80,
      truncatedLength: 80,
    })
    bitString = bitString.substring(0, 80)
  } else {
    bitString = bitString.padEnd(80, '0')
  }

  const method = (process.env.NODOTS_GNU_PID_ENCODER || 'strict').toLowerCase()
  if (method === 'strict') {
    return encodeBase64Six(bitString)
  }
  // Default legacy method (matches existing behavior in simulations)
  return encodeBase64ViaBytesLSB(bitString)
}
