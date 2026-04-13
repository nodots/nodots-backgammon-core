import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonGame,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import { logger } from '../utils/logger'

// GNU BG base64 alphabet
const GNU_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// Helper to get checker count on a specific point for a given player
// GOLDEN RULE: Always look up points by position[direction], never by array index
function getCheckersOnPointByPosition(
  board: BackgammonBoard,
  playerColor: BackgammonColor,
  playerDirection: 'clockwise' | 'counterclockwise',
  gnuPosition: number // 1-24, GNU position from player's perspective
): number {
  if (gnuPosition < 1 || gnuPosition > 24) return 0
  // Find the point where position[direction] equals the GNU position
  const point = board.points.find(
    (p) => p.position[playerDirection] === gnuPosition
  )
  if (!point) return 0
  return point.checkers.filter((c) => c.color === playerColor).length
}

// Helper to get checker count on the bar for a given player
function getCheckersOnBar(
  board: BackgammonBoard,
  player: BackgammonPlayer
): number {
  const barForPlayer = board.bar[player.direction]
  return barForPlayer.checkers.filter((c) => c.color === player.color).length
}

export function exportToGnuPositionId(game: BackgammonGame): string {
  const { board } = game

  // GNU BG position ID: TanBoard[0] = player on roll, TanBoard[1] = opponent.
  // Each player's points are numbered 1-24 from their own perspective.
  // Before roll-for-start completes, there is no active player — fall back
  // to clockwise first (the position is symmetric at the start anyway).
  const onRollPlayer = game.activePlayer ??
    game.players.find((p) => p.direction === 'clockwise')
  const opponent = game.inactivePlayer ??
    game.players.find((p) => p.direction !== (onRollPlayer as any)?.direction)

  if (!onRollPlayer || !opponent) {
    throw new Error(
      'Could not determine players for position encoding'
    )
  }

  logger.debug('[GnuPositionId] Encoding position', {
    onRollColor: onRollPlayer.color,
    onRollDirection: (onRollPlayer as any)?.direction,
    opponentColor: opponent.color,
    opponentDirection: (opponent as any)?.direction,
  })

  let bitString = ''

  // TanBoard[0]: player on roll, points 1-24 from their perspective, then bar
  for (let gnuPos = 1; gnuPos <= 24; gnuPos++) {
    const checkers = getCheckersOnPointByPosition(
      board,
      onRollPlayer.color,
      (onRollPlayer as any).direction,
      gnuPos
    )
    bitString += '1'.repeat(checkers)
    bitString += '0'
  }
  const onRollBarCheckers = getCheckersOnBar(board, onRollPlayer)
  bitString += '1'.repeat(onRollBarCheckers)
  bitString += '0'

  // TanBoard[1]: opponent, points 1-24 from their perspective, then bar
  for (let gnuPos = 1; gnuPos <= 24; gnuPos++) {
    const checkers = getCheckersOnPointByPosition(
      board,
      opponent.color,
      (opponent as any).direction,
      gnuPos
    )
    bitString += '1'.repeat(checkers)
    bitString += '0'
  }
  const opponentBarCheckers = getCheckersOnBar(board, opponent)
  bitString += '1'.repeat(opponentBarCheckers)
  bitString += '0'

  // 3. Pad to 80 bits
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

  // 4. Convert bit string to 10 bytes (little-endian)
  const bytes: number[] = []
  for (let i = 0; i < 10; i++) {
    const byteBits = bitString.substring(i * 8, (i + 1) * 8)
    let byteValue = 0
    for (let j = 0; j < 8; j++) {
      if (byteBits[j] === '1') {
        byteValue |= 1 << j
      }
    }
    bytes.push(byteValue)
  }

  // 5. Base64 encode the 10 bytes
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
