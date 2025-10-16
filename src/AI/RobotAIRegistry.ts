import type { RobotAIProvider } from './RobotAIProvider'

/**
 * RobotAIRegistry
 *
 * Singleton registry for managing AI providers. This registry uses dependency
 * injection to allow external packages (like @nodots-llc/backgammon-ai) to
 * provide AI implementations without CORE having direct dependencies on them.
 *
 * The registry supports self-registration where AI packages automatically
 * register themselves when imported, eliminating the need for explicit
 * initialization code in consuming applications.
 *
 * Architecture:
 * 1. CORE defines the interface and registry (this file)
 * 2. AI package implements the interface and self-registers on import
 * 3. CORE's executeRobotTurn() retrieves provider from registry
 * 4. No explicit registration needed in API or application code
 *
 * @example Self-registration in AI package:
 * ```typescript
 * // In @nodots-llc/backgammon-ai/src/index.ts
 * import { RobotAIRegistry } from '@nodots-llc/backgammon-core'
 * import { GNUAIProvider } from './GNUAIProvider'
 *
 * // Auto-register when package is imported
 * RobotAIRegistry.register(new GNUAIProvider())
 * ```
 *
 * @example Using in CORE:
 * ```typescript
 * // In CORE's executeRobotTurn()
 * const provider = RobotAIRegistry.getProvider()
 * return provider.executeRobotTurn(game)
 * ```
 */
export class RobotAIRegistry {
  private static provider: RobotAIProvider | null = null

  /**
   * Register an AI provider
   *
   * This method is typically called by AI packages during their initialization
   * to make their AI implementation available to CORE.
   *
   * @param provider - The AI provider implementation
   * @throws Error if a provider is already registered (prevents accidental overwrites)
   */
  static register(provider: RobotAIProvider): void {
    if (this.provider !== null) {
      throw new Error(
        'RobotAIProvider already registered. Only one provider can be active at a time.'
      )
    }
    this.provider = provider
  }

  /**
   * Get the registered AI provider
   *
   * @returns The registered AI provider
   * @throws Error if no provider is registered (indicates missing AI package dependency)
   */
  static getProvider(): RobotAIProvider {
    if (this.provider === null) {
      throw new Error(
        'No RobotAIProvider registered. Ensure @nodots-llc/backgammon-ai is installed and imported before executing robot turns.'
      )
    }
    return this.provider
  }

  /**
   * Check if a provider is registered
   *
   * @returns true if a provider is registered, false otherwise
   */
  static hasProvider(): boolean {
    return this.provider !== null
  }

  /**
   * Clear the registered provider (primarily for testing)
   *
   * This method allows tests to reset the registry state between test cases.
   * Should not be used in production code.
   */
  static clear(): void {
    this.provider = null
  }
}
