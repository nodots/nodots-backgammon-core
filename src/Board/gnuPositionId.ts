import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import { logger } from '../utils/logger'

// GNU BG base64 alphabet
const GNU_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// GNU Backgammon has FIXED conventions:
// - GNU white = always clockwise
// - GNU black = always counterclockwise
// Nodots allows any player/color/direction combination, so we must normalize.
type GnuColor = 'white' | 'black'

interface GnuNormalization {
  // Maps Nodots color to GNU color
  toGnu: Record<BackgammonColor, GnuColor>
  // The Nodots player who maps to GNU white (clockwise)
  gnuWhitePlayer: BackgammonPlayer
  // The Nodots player who maps to GNU black (counterclockwise)
  gnuBlackPlayer: BackgammonPlayer
}

function createGnuNormalization(game: BackgammonGame): GnuNormalization {
  const clockwisePlayer = game.players.find((p) => p.direction === 'clockwise')
  const counterclockwisePlayer = game.players.find(
    (p) => p.direction === 'counterclockwise'
  )

  if (!clockwisePlayer || !counterclockwisePlayer) {
    throw new Error(
      'Unable to determine player directions for GNU BG normalization.'
    )
  }

  // GNU white = clockwise, GNU black = counterclockwise
  // Type assertion needed because BackgammonColor might be undefined in some contexts,
  // but we know both players have valid colors at this point
  const toGnu = {
    [clockwisePlayer.color]: 'white',
    [counterclockwisePlayer.color]: 'black',
  } as Record<BackgammonColor, GnuColor>

  return {
    toGnu,
    gnuWhitePlayer: clockwisePlayer,
    gnuBlackPlayer: counterclockwisePlayer,
  }
}

function getPlayerOnRoll(game: BackgammonGame): BackgammonPlayer {
  let playerOnRoll: BackgammonPlayer | undefined

  // EXHAUSTIVE switch on BackgammonGameStateKind for player determination
  switch (game.stateKind) {
    case 'moving':
      playerOnRoll = (game as BackgammonGameMoving).activePlayer
      break

    case 'rolled-for-start':
      playerOnRoll = game.activePlayer
      break

    case 'rolling-for-start':
      // For starting position, use the clockwise player (GNU white convention)
      playerOnRoll =
        game.players.find((p) => p.direction === 'clockwise') ?? game.players[0]
      logger.info(
        `Using ${playerOnRoll?.color} (clockwise/GNU white) as player on roll for rolling-for-start state`
      )
      break

    case 'rolling':
      playerOnRoll = game.activePlayer
      break

    case 'doubled':
      playerOnRoll = game.activePlayer
      break

    case 'moved':
      playerOnRoll = game.activePlayer
      break

    case 'completed':
      const completedGame = game as BackgammonGame & {
        winner?: BackgammonPlayer
      }
      if (completedGame.winner) {
        playerOnRoll = game.players.find(
          (p) => p.id === completedGame.winner?.id
        )
      }
      playerOnRoll ??= game.players[0]
      break
  }

  if (!playerOnRoll) {
    throw new Error('Could not determine player on roll.')
  }

  return playerOnRoll
}

// Helper to get checker count on a specific point for a GNU-normalized player
// GNU white uses clockwise positions, GNU black uses counterclockwise positions
// GOLDEN RULE: Always look up points by position[direction], never by array index
function getCheckersOnPointForGnuPlayer(
  board: BackgammonBoard,
  nodotPlayer: BackgammonPlayer, // The actual Nodots player
  gnuPosition: number // 1-24, GNU position from player's perspective
): number {
  if (gnuPosition < 1 || gnuPosition > 24) return 0

  // Use the player's direction to find the correct point
  // Clockwise player (GNU white) uses clockwise positions
  // Counterclockwise player (GNU black) uses counterclockwise positions
  const point = board.points.find(
    (p) => p.position[nodotPlayer.direction] === gnuPosition
  )
  if (!point) return 0

  // Count checkers of this player's color on the point
  return point.checkers.filter((c) => c.color === nodotPlayer.color).length
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

  // Create GNU normalization: maps Nodots colors/directions to GNU conventions
  // GNU white = clockwise, GNU black = counterclockwise
  const normalization = createGnuNormalization(game)

  // Get the player who is on roll in Nodots
  const nodotPlayerOnRoll = getPlayerOnRoll(game)

  // Determine GNU color of player on roll
  const gnuColorOnRoll = normalization.toGnu[nodotPlayerOnRoll.color]

  // Get the GNU white and black players (mapped from Nodots players)
  // gnuWhitePlayer is the clockwise player, gnuBlackPlayer is the counterclockwise player
  const gnuPlayerOnRoll =
    gnuColorOnRoll === 'white'
      ? normalization.gnuWhitePlayer
      : normalization.gnuBlackPlayer
  const gnuOpponent =
    gnuColorOnRoll === 'white'
      ? normalization.gnuBlackPlayer
      : normalization.gnuWhitePlayer

  // Diagnostic logging to trace position ID encoding
  logger.debug('[GnuPositionId] Encoding position with GNU normalization', {
    gameStateKind: game.stateKind,
    nodotPlayerOnRollColor: nodotPlayerOnRoll.color,
    nodotPlayerOnRollDirection: nodotPlayerOnRoll.direction,
    gnuColorOnRoll,
    gnuWhitePlayerColor: normalization.gnuWhitePlayer.color,
    gnuBlackPlayerColor: normalization.gnuBlackPlayer.color,
  })

  let bitString = ''

  // 1. GNU player on roll's points (GNU positions 1-24 from their perspective)
  // GOLDEN RULE: Use position[direction] to find points, not array indices
  for (let gnuPos = 1; gnuPos <= 24; gnuPos++) {
    const checkers = getCheckersOnPointForGnuPlayer(board, gnuPlayerOnRoll, gnuPos)
    bitString += '1'.repeat(checkers)
    bitString += '0'
  }
  const playerBarCheckers = getCheckersOnBar(board, gnuPlayerOnRoll)
  bitString += '1'.repeat(playerBarCheckers)
  bitString += '0'

  // 2. GNU opponent's points (GNU positions 1-24 from their perspective)
  // GOLDEN RULE: Use position[direction] to find points, not array indices
  for (let gnuPos = 1; gnuPos <= 24; gnuPos++) {
    const checkers = getCheckersOnPointForGnuPlayer(board, gnuOpponent, gnuPos)
    bitString += '1'.repeat(checkers)
    bitString += '0'
  }
  const opponentBarCheckers = getCheckersOnBar(board, gnuOpponent)
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
