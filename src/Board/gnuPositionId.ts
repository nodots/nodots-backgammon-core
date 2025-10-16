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

function getCheckersOnPoint(
  board: BackgammonBoard,
  color: BackgammonColor,
  position: number,
  direction: 'clockwise' | 'counterclockwise'
): number {
  if (position < 1 || position > 24) return 0
  const point = board.points.find(p => p.position[direction] === position)
  if (!point) return 0
  return point.checkers.filter((c) => c.color === color).length
}

function getCheckersOnBar(board: BackgammonBoard, player: BackgammonPlayer): number {
  const barForPlayer = board.bar[player.direction]
  return barForPlayer.checkers.filter((c) => c.color === player.color).length
}

function encodeBase64ViaBytesLSB(bitString: string): string {
  // Convert bit string to bytes using LSB-first bit ordering within each byte
  const bytes: number[] = []
  for (let i = 0; i < 10; i++) {
    const byteBits = bitString.substring(i * 8, (i + 1) * 8)
    let byteValue = 0
    for (let j = 0; j < 8; j++) {
      if (byteBits[j] === '1') byteValue |= 1 << j
    }
    bytes.push(byteValue)
  }

  // Encode bytes to base64 using GNU BG algorithm (positionid.c lines 207-218)
  let base64Chars = ''

  // Process 3 bytes at a time (4 base64 characters)
  for (let i = 0; i < 3; i++) {
    const b0 = bytes[i * 3]
    const b1 = bytes[i * 3 + 1]
    const b2 = bytes[i * 3 + 2]

    base64Chars += GNU_BASE64[b0 >> 2]
    base64Chars += GNU_BASE64[((b0 & 0x03) << 4) | (b1 >> 4)]
    base64Chars += GNU_BASE64[((b1 & 0x0F) << 2) | (b2 >> 6)]
    base64Chars += GNU_BASE64[b2 & 0x3F]
  }

  // Last byte (10th byte, produces 2 base64 characters)
  const lastByte = bytes[9]
  base64Chars += GNU_BASE64[lastByte >> 2]
  base64Chars += GNU_BASE64[(lastByte & 0x03) << 4]

  return base64Chars
}

export function exportToGnuPositionId(game: BackgammonGame): string {
  const { board } = game
  const { playerOnRoll, opponent } = getPlayerAndOpponent(game)

  let bitString = ''

  // Player on roll: encode GNU positions 0-23 (map to Nodots positions 1-24)
  for (let gnuPosition = 0; gnuPosition < 24; gnuPosition++) {
    const nodotsPosition = gnuPosition + 1
    const checkers = getCheckersOnPoint(board, playerOnRoll.color, nodotsPosition, playerOnRoll.direction)
    bitString += '1'.repeat(checkers) + '0'
  }
  const playerBarCheckers = getCheckersOnBar(board, playerOnRoll)
  bitString += '1'.repeat(playerBarCheckers) + '0'

  // Opponent: encode GNU positions 0-23 (map to Nodots positions 1-24)
  for (let gnuPosition = 0; gnuPosition < 24; gnuPosition++) {
    const nodotsPosition = gnuPosition + 1
    const checkers = getCheckersOnPoint(board, opponent.color, nodotsPosition, opponent.direction)
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

  return encodeBase64ViaBytesLSB(bitString)
}
