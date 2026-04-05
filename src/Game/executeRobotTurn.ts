/**
 * Robot Turn Execution
 *
 * Delegates robot turn execution to the registered AI provider matched
 * by the robot's email. The RobotActionProcessor attaches robotProfile
 * (including email) to game.activePlayer before this is called.
 */

import type {
  BackgammonGameMoving,
  BackgammonGameRolling,
} from '@nodots-llc/backgammon-types'
import { RobotAIRegistry } from '../AI/RobotAIRegistry'

export const executeRobotTurn = async (
  game: BackgammonGameMoving
): Promise<BackgammonGameRolling> => {
  // robotProfile is attached by RobotActionProcessor before calling this
  const robotEmail = (game.activePlayer as Record<string, any>)
    .robotProfile?.email as string | undefined // cast: robotProfile is not in the type system
  const provider = RobotAIRegistry.getProvider(robotEmail)
  return provider.executeRobotTurn(game)
}
