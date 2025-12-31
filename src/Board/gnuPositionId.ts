import {
  BackgammonColor,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonMoveDirection,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { logger } from '../utils/logger'

/**
 * Determine which player is on roll for the current game state.
 */
function getPlayerOnRoll(game: BackgammonGame): BackgammonPlayer {
  let playerOnRoll: BackgammonPlayer | undefined

  switch (game.stateKind) {
    case 'moving':
      playerOnRoll = (game as BackgammonGameMoving).activePlayer
      break
    case 'rolled-for-start':
    case 'rolling':
    case 'doubled':
    case 'moved':
      playerOnRoll = game.activePlayer
      break
    case 'rolling-for-start':
      playerOnRoll = game.activePlayer ?? game.players[0]
      logger.info(
        `Using ${playerOnRoll?.color ?? 'unknown'} as player on roll for rolling-for-start state`
      )
      break
    case 'completed':
      // Cast to access winner property which may exist on completed games
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

/**
 * Export game position to GNU Backgammon position ID format.
 * Uses the original GNU Backgammon encoding algorithm via native addon.
 *
 * @param game The backgammon game to encode
 * @returns 14-character position ID string valid in GNU Backgammon
 */
export function exportToGnuPositionId(game: BackgammonGame): string {
  const { board } = game

  const playerOnRoll = getPlayerOnRoll(game)
  const activeColor: BackgammonColor = playerOnRoll.color ?? 'white'
  const activeDirection = playerOnRoll.direction as BackgammonMoveDirection | undefined
  if (!activeDirection) {
    throw new Error('Player on roll is missing direction.')
  }

  logger.debug('[GnuPositionId] Encoding position via native addon', {
    gameStateKind: game.stateKind,
    activeColor,
    activeDirection,
  })

  return GnuBgHints.getPositionId(board, activeColor, activeDirection)
}
