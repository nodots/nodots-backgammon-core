/**
 * Robot Turn Execution
 *
 * Delegates robot turn execution to the registered AI provider matched
 * by the robot's email. Callers MUST attach `robotProfile` to
 * `game.activePlayer` before invoking this; otherwise the registry can
 * only resolve via the `*` catch-all and may route a GNU robot to a
 * Nodots provider (or vice versa). The previous silent fallback caused
 * stuck robot turns and "No legal moves available from origin" errors
 * because NodotsAIProvider was being used to execute GNU robots.
 */

import type {
  BackgammonGameMoving,
  BackgammonGameRolling,
} from '@nodots/backgammon-types'
import { RobotAIRegistry } from '../AI/RobotAIRegistry'
import { logger } from '../utils/logger'

export const executeRobotTurn = async (
  game: BackgammonGameMoving
): Promise<BackgammonGameRolling> => {
  // robotProfile is attached by the API layer (REST endpoint and queue worker)
  // before calling this. CORE doesn't have DB access to look it up itself.
  const robotEmail = (game.activePlayer as Record<string, any>)
    .robotProfile?.email as string | undefined // cast: robotProfile is not in the type system

  if (!robotEmail) {
    logger.error(
      `[executeRobotTurn] No robotProfile.email on activePlayer for game ${game.id}. ` +
        `Caller forgot to attach the robot profile, AI provider routing will fall back ` +
        `to '*' which may pick the wrong provider for this robot.`
    )
  }

  const provider = RobotAIRegistry.getProvider(robotEmail)
  return provider.executeRobotTurn(game)
}
