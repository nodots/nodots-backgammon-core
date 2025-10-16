/**
 * Robot Turn Execution
 *
 * This module delegates robot turn execution to the registered AI provider.
 * The actual AI implementation is provided by external packages (like
 * @nodots-llc/backgammon-ai) through the RobotAIProvider interface.
 *
 * Architecture:
 * - CORE defines the interface and delegates execution
 * - AI packages implement the interface with specific strategies
 * - No direct GNU Backgammon dependencies in CORE
 */

import type {
  BackgammonGameMoving,
  BackgammonGameRolling,
} from '@nodots-llc/backgammon-types'
import { RobotAIRegistry } from '../AI/RobotAIRegistry'

/**
 * Execute a complete robot turn
 *
 * Delegates to the registered AI provider to analyze the position,
 * select moves, and execute them. The AI provider is typically registered
 * automatically when the AI package is imported.
 *
 * @param game - Game in moving state with robot as active player
 * @returns Promise resolving to game in rolling state for next player
 * @throws Error if no AI provider is registered
 * @throws Error if the active player is not a robot
 * @throws Error if move execution fails
 *
 * @example
 * ```typescript
 * // Ensure AI package is imported (typically done at app startup)
 * import '@nodots-llc/backgammon-ai'
 *
 * // Execute robot turn
 * const updatedGame = await Game.executeRobotTurn(movingGame)
 * ```
 */
export const executeRobotTurn = async (
  game: BackgammonGameMoving
): Promise<BackgammonGameRolling> => {
  const provider = RobotAIRegistry.getProvider()
  return provider.executeRobotTurn(game)
}
