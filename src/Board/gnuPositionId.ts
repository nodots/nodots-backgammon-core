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

function getPlayerAndOpponent(game: BackgammonGame): {
  playerOnRoll: BackgammonPlayer
  opponent: BackgammonPlayer
} {
  let playerOnRoll: BackgammonPlayer | undefined

  // EXHAUSTIVE switch on BackgammonGameStateKind for player determination
  switch (game.stateKind) {
    case 'moving':
      playerOnRoll = (game as BackgammonGameMoving).activePlayer
      break

    case 'rolled-for-start':
      // In rolled-for-start, activePlayer indicates who won the roll and will be the first player on roll.
      // This state is just before the first actual turn where checkers move.
      // GNU Pos ID usually represents a position where someone is about to move checkers.
      // Use the activePlayer property which exists in rolled-for-start state
      playerOnRoll = game.activePlayer
      break

    case 'rolling-for-start':
      // In rolling-for-start, no active player is determined yet, but we can still calculate GNU Position ID
      // For starting position, conventionally use white as player on roll (standard GNU convention)
      playerOnRoll =
        game.players.find((p) => p.color === 'white') ?? game.players[0]
      logger.info(
        `Using ${playerOnRoll?.color} as player on roll for rolling-for-start state`
      )
      break

    case 'rolling':
      // Player is about to roll dice - use the active player
      playerOnRoll = game.activePlayer
      break

    case 'doubled':
      // Double offered - use the active player (the one who offered the double)
      playerOnRoll = game.activePlayer
      break

    case 'moved':
      // Player has completed moves but not confirmed turn - use the active player
      playerOnRoll = game.activePlayer
      break

    case 'completed':
      // Game is completed - use the last active player (from winner's perspective)
      // If we have a winner, use them; otherwise just use the first player
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

  const opponent = game.players.find((p) => p.id !== playerOnRoll.id)
  if (!opponent) {
    throw new Error('Opponent not found')
  }
  return { playerOnRoll, opponent }
}

// Helper to get checker count on a specific point for a given player
function getCheckersOnPoint(
  board: BackgammonBoard,
  playerColor: BackgammonColor,
  pointIndex: number // 0-23, mapping to board.points
): number {
  if (pointIndex < 0 || pointIndex > 23) return 0
  const point = board.points[pointIndex]
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
  const { playerOnRoll, opponent } = getPlayerAndOpponent(game)

  let bitString = ''

  // 1. Player on roll's points
  for (let i = 0; i < 24; i++) {
    let checkers = 0
    if (playerOnRoll.direction === 'clockwise') {
      checkers = getCheckersOnPoint(board, playerOnRoll.color, i)
    } else {
      checkers = getCheckersOnPoint(board, playerOnRoll.color, 23 - i)
    }
    bitString += '1'.repeat(checkers)
    bitString += '0'
  }
  const playerBarCheckers = getCheckersOnBar(board, playerOnRoll)
  bitString += '1'.repeat(playerBarCheckers)
  bitString += '0'

  // 2. Opponent's points
  for (let i = 0; i < 24; i++) {
    let checkers = 0
    if (opponent.direction === 'clockwise') {
      checkers = getCheckersOnPoint(board, opponent.color, i)
    } else {
      checkers = getCheckersOnPoint(board, opponent.color, 23 - i)
    }
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
